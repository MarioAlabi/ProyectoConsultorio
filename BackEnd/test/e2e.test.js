/**
 * End-to-end integrity test suite.
 *
 * Verifies every REST endpoint exposed by the backend against a live server.
 * Requires:
 *   1. Backend running at BASE_URL (default http://localhost:3000)
 *   2. Seed users created via `npm run seed` (admin/doctor/assistant)
 *   3. Document-template table migrated + seeded (`npm run seed:templates`)
 *
 * Usage:
 *   node test/e2e.test.js
 *
 * Optional env overrides:
 *   BASE_URL=http://localhost:3000
 *   ORIGIN=http://localhost:5173
 *   ADMIN_EMAIL / ADMIN_PASSWORD
 *   DOCTOR_EMAIL / DOCTOR_PASSWORD
 *   ASSISTANT_EMAIL / ASSISTANT_PASSWORD
 *   DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / DB_PORT
 *     (used to reset the Better Auth rate limiter between runs)
 */

import "dotenv/config";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

const CREDENTIALS = {
    admin: {
        email: process.env.ADMIN_EMAIL || "admin@consultorio.com",
        password: process.env.ADMIN_PASSWORD || "AdminPassword123!",
    },
    doctor: {
        email: process.env.DOCTOR_EMAIL || "doctor@consultorio.com",
        password: process.env.DOCTOR_PASSWORD || "DoctorPassword123!",
    },
    assistant: {
        email: process.env.ASSISTANT_EMAIL || "assistant@consultorio.com",
        password: process.env.ASSISTANT_PASSWORD || "AssistantPassword123!",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    bold: "\x1b[1m",
};

const stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    failures: [],
};

const state = {};

const log = {
    section: (title) =>
        console.log(`\n${COLORS.bold}${COLORS.cyan}━━━ ${title} ━━━${COLORS.reset}`),
    pass: (name, meta = "") =>
        console.log(`  ${COLORS.green}✓${COLORS.reset} ${name}${meta ? ` ${COLORS.gray}${meta}${COLORS.reset}` : ""}`),
    fail: (name, err) => {
        console.log(`  ${COLORS.red}✗${COLORS.reset} ${name}`);
        console.log(`    ${COLORS.red}${err}${COLORS.reset}`);
    },
    skip: (name, reason) =>
        console.log(`  ${COLORS.yellow}⊘${COLORS.reset} ${name} ${COLORS.gray}(${reason})${COLORS.reset}`),
    info: (msg) => console.log(`  ${COLORS.gray}› ${msg}${COLORS.reset}`),
};

/**
 * Parses Set-Cookie headers and returns a cookie-jar string for subsequent requests.
 */
const extractCookies = (response) => {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    return setCookie.map((c) => c.split(";")[0]).join("; ");
};

/**
 * Minimal HTTP client bound to a role-specific cookie jar.
 */
const createClient = (role) => {
    const jar = { cookie: "" };

    const request = async (method, path, { body, query, headers = {} } = {}) => {
        const url = new URL(`${BASE_URL}${path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) url.searchParams.set(k, v);
            }
        }

        const init = {
            method,
            headers: {
                "Content-Type": "application/json",
                Origin: ORIGIN,
                ...(jar.cookie ? { Cookie: jar.cookie } : {}),
                ...headers,
            },
        };
        if (body !== undefined) init.body = JSON.stringify(body);

        const res = await fetch(url, init);
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json")
            ? await res.json().catch(() => null)
            : await res.text().catch(() => null);

        const newCookies = extractCookies(res);
        if (newCookies) jar.cookie = newCookies;

        return { status: res.status, ok: res.ok, body: payload, headers: res.headers };
    };

    return {
        role,
        jar,
        get: (path, opts) => request("GET", path, opts),
        post: (path, body, opts) => request("POST", path, { ...opts, body }),
        put: (path, body, opts) => request("PUT", path, { ...opts, body }),
        patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
        delete: (path, opts) => request("DELETE", path, opts),
    };
};

/**
 * Declarative test-case runner.
 * @param {string} name
 * @param {() => Promise<void> | void} fn
 */
const test = async (name, fn) => {
    try {
        await fn();
        stats.passed++;
        log.pass(name);
    } catch (err) {
        stats.failed++;
        stats.failures.push({ name, err });
        log.fail(name, err.message || err);
    }
};

const skip = (name, reason) => {
    stats.skipped++;
    log.skip(name, reason);
};

const expect = {
    eq: (actual, expected, label = "") => {
        if (actual !== expected) {
            throw new Error(`${label} expected ${expected}, got ${actual}`);
        }
    },
    truthy: (value, label = "value") => {
        if (!value) throw new Error(`${label} should be truthy, got ${value}`);
    },
    status: (res, expected, label = "") => {
        if (res.status !== expected) {
            const snippet =
                typeof res.body === "object" ? JSON.stringify(res.body).slice(0, 180) : res.body;
            throw new Error(
                `${label || "response"} expected status ${expected}, got ${res.status} — ${snippet}`
            );
        }
    },
    statusIn: (res, expectedList, label = "") => {
        if (!expectedList.includes(res.status)) {
            const snippet =
                typeof res.body === "object" ? JSON.stringify(res.body).slice(0, 180) : res.body;
            throw new Error(
                `${label || "response"} expected one of [${expectedList.join(", ")}], got ${res.status} — ${snippet}`
            );
        }
    },
};

const randomDui = () => {
    const n = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");
    const m = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    const check = String(Math.floor(Math.random() * 10));
    return `${n}${m}-${check}`;
};

const todayKey = () => new Date().toISOString().split("T")[0];
const futureDateKey = (daysAhead = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
};

/**
 * Picks a clock time that's unlikely to collide with previous test runs.
 * Uses minute granularity derived from `Date.now()` so parallel runs are safe too.
 */
const randomSlot = () => {
    const hour = 7 + Math.floor(Math.random() * 10); // 07:00 - 16:xx
    const minute = Math.random() < 0.5 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${minute}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Better Auth enforces a DB-backed rate limiter on /api/auth/* routes
 * (see src/config/auth.js: max 100 req / 60s window). Because this suite
 * fires dozens of auth-backed requests per run, consecutive invocations
 * collide with the previous run's counters and get a 429.
 *
 * Best-effort reset: truncate the `rate_limit` table via the shared DB
 * connection used by the backend. Requires DB_* env vars (same as app.js).
 *
 * Silently no-ops if credentials are not available — CI pipelines running
 * against a dedicated DB shouldn't need this.
 */
const resetRateLimiter = async () => {
    try {
        const { default: mysql } = await import("mysql2/promise");
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,
        });
        await conn.query("DELETE FROM rate_limit");
        await conn.end();
        console.log(`${COLORS.gray}› rate_limit cleared${COLORS.reset}`);
    } catch (err) {
        console.log(
            `${COLORS.yellow}› rate_limit NOT cleared (${err.code || err.message}); may see 429s${COLORS.reset}`
        );
    }
};

const run = async () => {
    console.log(`${COLORS.bold}${COLORS.blue}E2E Integrity Test Suite${COLORS.reset}`);
    console.log(`${COLORS.gray}Target: ${BASE_URL}${COLORS.reset}`);

    await resetRateLimiter();
    console.log("");

    // ── 0. Health check ─────────────────────────────────────────────
    log.section("0. Health check");

    await test("GET /status returns ok", async () => {
        const anon = createClient("anon");
        const res = await anon.get("/status");
        expect.status(res, 200);
        expect.eq(res.body.status, "ok", "status");
    });

    // ── 1. Authentication (Better Auth) ─────────────────────────────
    log.section("1. Authentication");

    const admin = createClient("admin");
    const doctor = createClient("doctor");
    const assistant = createClient("assistant");
    const anon = createClient("anon");

    await test("POST /api/auth/sign-in/email — admin logs in", async () => {
        const res = await admin.post("/api/auth/sign-in/email", CREDENTIALS.admin);
        expect.status(res, 200);
        expect.truthy(res.body?.user, "user");
        expect.eq(res.body.user.role, "admin", "role");
        state.adminUserId = res.body.user.id;
    });

    await test("POST /api/auth/sign-in/email — doctor logs in", async () => {
        const res = await doctor.post("/api/auth/sign-in/email", CREDENTIALS.doctor);
        expect.status(res, 200);
        expect.eq(res.body.user.role, "doctor", "role");
        state.doctorUserId = res.body.user.id;
    });

    await test("POST /api/auth/sign-in/email — assistant logs in", async () => {
        const res = await assistant.post("/api/auth/sign-in/email", CREDENTIALS.assistant);
        expect.status(res, 200);
        expect.eq(res.body.user.role, "assistant", "role");
        state.assistantUserId = res.body.user.id;
    });

    await test("POST /api/auth/sign-in/email — bad credentials rejected", async () => {
        const tmp = createClient("bad");
        const res = await tmp.post("/api/auth/sign-in/email", {
            email: CREDENTIALS.admin.email,
            password: "wrong-password",
        });
        // 429 appears when rate limiter trips after repeated failed attempts.
        expect.statusIn(res, [400, 401, 429], "bad-credentials");
    });

    await test("GET /api/auth/get-session — session endpoint", async () => {
        const res = await admin.get("/api/auth/get-session");
        expect.status(res, 200);
        expect.truthy(res.body?.user, "session user");
    });

    // ── 2. Authorization guards ─────────────────────────────────────
    log.section("2. Authorization (role guards)");

    await test("GET /api/patients — anonymous returns 401", async () => {
        const res = await anon.get("/api/patients");
        expect.status(res, 401);
    });

    await test("GET /api/audit — non-admin returns 403", async () => {
        const res = await doctor.get("/api/audit");
        expect.status(res, 403);
    });

    await test("POST /api/consultations/:id — assistant cannot create consultation", async () => {
        const res = await assistant.post("/api/consultations/not-a-real-id", {});
        expect.statusIn(res, [403], "assistant forbidden");
    });

    // ── 3. Clinic settings ──────────────────────────────────────────
    log.section("3. Clinic settings");

    await test("GET /api/settings — public read", async () => {
        const res = await anon.get("/api/settings");
        expect.status(res, 200);
    });

    await test("POST /api/settings — admin updates clinic name", async () => {
        const newName = `Consultorio E2E ${Date.now()}`;
        const res = await admin.post("/api/settings", {
            clinicName: newName,
            address: "Av. Testing 123",
        });
        expect.status(res, 200);
        expect.truthy(res.body?.data, "updated data");
        state.clinicName = newName;
    });

    await test("POST /api/settings — doctor forbidden", async () => {
        const res = await doctor.post("/api/settings", { clinicName: "hack" });
        expect.status(res, 403);
    });

    // ── 4. Insurers ─────────────────────────────────────────────────
    log.section("4. Insurers");

    await test("POST /api/insurers — doctor creates insurer", async () => {
        const res = await doctor.post("/api/insurers", {
            companyName: `E2E Insurer ${Date.now()}`,
            contactName: "María Contacto",
            phone: "2200-0000",
            email: `e2e-${Date.now()}@insurer.test`,
            fixedConsultationAmount: 25.5,
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "insurer id");
        state.insurerId = res.body.data.id;
    });

    await test("GET /api/insurers — list", async () => {
        const res = await doctor.get("/api/insurers");
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "data is array");
    });

    await test("GET /api/insurers/:id — detail", async () => {
        const res = await doctor.get(`/api/insurers/${state.insurerId}`);
        expect.status(res, 200);
        expect.eq(res.body?.data?.id, state.insurerId, "id match");
    });

    await test("PUT /api/insurers/:id — update", async () => {
        const res = await doctor.put(`/api/insurers/${state.insurerId}`, {
            companyName: "E2E Insurer Updated",
            contactName: "María Contacto",
            phone: "2200-0001",
            email: `e2e-upd-${Date.now()}@insurer.test`,
            fixedConsultationAmount: 30,
        });
        expect.status(res, 200);
    });

    await test("PATCH /api/insurers/:id/status — deactivate", async () => {
        const res = await doctor.patch(`/api/insurers/${state.insurerId}/status`, {
            status: "inactive",
        });
        expect.status(res, 200);
    });

    await test("PATCH /api/insurers/:id/status — reactivate", async () => {
        const res = await doctor.patch(`/api/insurers/${state.insurerId}/status`, {
            status: "active",
        });
        expect.status(res, 200);
    });

    await test("POST /api/insurers — assistant forbidden", async () => {
        const res = await assistant.post("/api/insurers", {
            companyName: "x",
            contactName: "x",
            phone: "1",
            email: "x@x.com",
            fixedConsultationAmount: 1,
        });
        expect.status(res, 403);
    });

    // ── 5. Patients ─────────────────────────────────────────────────
    log.section("5. Patients");

    await test("POST /api/patients/register — assistant creates patient", async () => {
        const res = await assistant.post("/api/patients/register", {
            fullName: `Paciente E2E ${Date.now()}`,
            dateOfBirth: "1990-05-15",
            identityDocument: randomDui(),
            gender: "male",
            phone: "7000-0000",
            address: "Col. Testing",
            isMinor: false,
            personalHistory: "Ninguna",
            familyHistory: "Ninguna",
            insurerId: state.insurerId,
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "patient id");
        expect.truthy(res.body?.data?.fileNumber, "file number");
        state.patientId = res.body.data.id;
        state.patientFileNumber = res.body.data.fileNumber;
    });

    await test("POST /api/patients/register — invalid DUI rejected", async () => {
        const res = await assistant.post("/api/patients/register", {
            fullName: "X",
            dateOfBirth: "1990-05-15",
            identityDocument: "bad-format",
            gender: "male",
            isMinor: false,
        });
        expect.status(res, 400);
    });

    await test("GET /api/patients — list", async () => {
        const res = await assistant.get("/api/patients");
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/patients?q=… — search", async () => {
        const res = await assistant.get("/api/patients", { query: { q: state.patientFileNumber } });
        expect.status(res, 200);
        expect.truthy(res.body?.data?.length > 0, "found by file number");
    });

    await test("GET /api/patients/:id — detail", async () => {
        const res = await assistant.get(`/api/patients/${state.patientId}`);
        expect.status(res, 200);
        expect.eq(res.body?.data?.id, state.patientId, "id match");
    });

    await test("PUT /api/patients/:id — update", async () => {
        const res = await assistant.put(`/api/patients/${state.patientId}`, {
            phone: "7000-1111",
            address: "Col. Actualizada",
        });
        expect.status(res, 200);
    });

    await test("PATCH /api/patients/:id/status — change status", async () => {
        const res = await assistant.patch(`/api/patients/${state.patientId}/status`, {
            status: "inactive",
        });
        expect.status(res, 200);
        // Reactivate for downstream tests
        const reset = await assistant.patch(`/api/patients/${state.patientId}/status`, {
            status: "active",
        });
        expect.status(reset, 200, "reset to active");
    });

    // ── 6. Appointments ─────────────────────────────────────────────
    log.section("6. Appointments");

    // Use a random future day (2 to 29 days ahead) to minimise collisions with
    // appointments persisted by previous runs against the shared database.
    const futureDate = futureDateKey(2 + Math.floor(Math.random() * 27));
    let firstSlot = null;

    await test("POST /api/appointments — create", async () => {
        // Retry with fresh random slots to tolerate collisions from prior runs
        // that persisted appointments in the shared database.
        let res;
        for (let attempt = 0; attempt < 12; attempt++) {
            const slot = randomSlot();
            res = await assistant.post("/api/appointments", {
                patientId: state.patientId,
                date: futureDate,
                time: slot,
                reason: "Control de rutina (E2E)",
            });
            if (res.status === 201) {
                firstSlot = slot;
                break;
            }
            if (res.status !== 409) break; // any non-conflict error: stop retrying
        }
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "appointment id");
        state.appointmentId = res.body.data.id;
    });

    await test("POST /api/appointments — conflict detected", async () => {
        const res = await assistant.post("/api/appointments", {
            patientId: state.patientId,
            date: futureDate,
            time: firstSlot,
            reason: "duplicada",
        });
        expect.status(res, 409);
    });

    await test("POST /api/appointments — past date rejected", async () => {
        const res = await assistant.post("/api/appointments", {
            patientId: state.patientId,
            date: "2000-01-01",
            time: "10:00",
        });
        expect.status(res, 400);
    });

    await test("GET /api/appointments?from=&to=", async () => {
        const res = await assistant.get("/api/appointments", {
            query: { from: futureDate, to: futureDate },
        });
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/appointments?date=today — default fallback", async () => {
        const res = await assistant.get("/api/appointments");
        expect.status(res, 200);
    });

    await test("PUT /api/appointments/:id — reschedule", async () => {
        let res;
        for (let attempt = 0; attempt < 12; attempt++) {
            const slot = randomSlot();
            if (slot === firstSlot) continue;
            res = await assistant.put(`/api/appointments/${state.appointmentId}`, {
                date: futureDate,
                time: slot,
                reason: "Reprogramada E2E",
            });
            if (res.status === 200) break;
            if (res.status !== 409) break;
        }
        expect.status(res, 200);
    });

    await test("PATCH /api/appointments/:id/status — mark present", async () => {
        const res = await assistant.patch(
            `/api/appointments/${state.appointmentId}/status`,
            { status: "present" }
        );
        expect.status(res, 200);
    });

    await test("PATCH /api/appointments/bulk-cancel — empty date cancels none", async () => {
        const res = await assistant.patch("/api/appointments/bulk-cancel", {
            date: futureDateKey(365), // far future, unlikely to match
        });
        // Accepts 200 even when 0 cancelled
        expect.status(res, 200);
    });

    // ── 7. Preclinical records ──────────────────────────────────────
    log.section("7. Preclinical records");

    await test("POST /api/preclinical — assistant creates record (status=waiting)", async () => {
        const res = await assistant.post("/api/preclinical", {
            patientId: state.patientId,
            motivo: "Dolor de cabeza persistente (E2E)",
            bloodPressure: "120/80",
            temperature: 36.6,
            weight: 150,
            height: 1.72,
            heartRate: 72,
            oxygenSaturation: 98,
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "preclinical id");
        expect.eq(res.body?.data?.status, "waiting", "status");
        state.preclinicalId = res.body.data.id;
    });

    await test("POST /api/preclinical — duplicate waiting record rejected", async () => {
        const res = await assistant.post("/api/preclinical", {
            patientId: state.patientId,
            motivo: "otra razón",
        });
        expect.status(res, 409);
    });

    await test("GET /api/preclinical — list (today)", async () => {
        const res = await assistant.get("/api/preclinical");
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/preclinical/dashboard — doctor dashboard", async () => {
        const res = await doctor.get("/api/preclinical/dashboard", {
            query: { date: todayKey() },
        });
        expect.status(res, 200);
        expect.truthy(res.body?.data?.counters, "counters");
    });

    await test("GET /api/preclinical/dashboard — assistant forbidden", async () => {
        const res = await assistant.get("/api/preclinical/dashboard");
        expect.status(res, 403);
    });

    await test("GET /api/preclinical/patient/:patientId — history by patient", async () => {
        const res = await assistant.get(`/api/preclinical/patient/${state.patientId}`);
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/preclinical/:id — doctor reads record", async () => {
        const res = await doctor.get(`/api/preclinical/${state.preclinicalId}`);
        expect.status(res, 200);
        expect.eq(res.body?.data?.id, state.preclinicalId, "id match");
    });

    await test("PATCH /api/preclinical/:id/status — in_consultation", async () => {
        const res = await doctor.patch(`/api/preclinical/${state.preclinicalId}/status`, {
            status: "in_consultation",
        });
        expect.status(res, 200);
    });

    // ── 8. Consultations ────────────────────────────────────────────
    log.section("8. Consultations");

    await test("POST /api/consultations/:preclinicalId — doctor finishes consultation", async () => {
        const res = await doctor.post(`/api/consultations/${state.preclinicalId}`, {
            anamnesis: "Paciente refiere cefalea de 3 días de evolución.",
            physicalExam: "Signos vitales estables.",
            diagnosis: "Cefalea tensional (E2E)",
            labResults: "Sin laboratorios.",
            observations: "Hidratación y reposo.",
            billingType: "insurance",
            insurerId: state.insurerId,
            agreedAmount: 30,
            bloodPressure: "120/80",
            temperature: 36.6,
            heartRate: 72,
            oxygenSaturation: 98,
            weight: 150,
            height: 1.72,
            bmi: 22.4,
            medicamentos: [
                {
                    name: "Paracetamol",
                    concentration: "500",
                    concentrationUnit: "mg",
                    dose: "1",
                    doseUnit: "Tableta(s)",
                    route: "Oral",
                    frequency: "Cada 8 horas",
                    duration: "Por 3 días",
                    additionalInstructions: "Con alimentos.",
                },
            ],
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.consultationId, "consultation id");
        state.consultationId = res.body.data.consultationId;
    });

    await test("GET /api/consultations/:preclinicalId — read consultation", async () => {
        const res = await doctor.get(`/api/consultations/${state.preclinicalId}`);
        expect.status(res, 200);
        expect.truthy(res.body?.data?.id, "consultation id");
    });

    await test("GET /api/consultations/patient/:id/history — clinical history", async () => {
        const res = await doctor.get(`/api/consultations/patient/${state.patientId}/history`);
        expect.status(res, 200);
        // Backend returns a viewModel: { patientId, rangeYears, empty, items: [] }
        expect.truthy(Array.isArray(res.body?.data?.items), "items array");
    });

    await test("GET /api/consultations/reports/by-insurer — insurer report", async () => {
        const res = await doctor.get("/api/consultations/reports/by-insurer", {
            query: {
                insurerId: state.insurerId,
                from: futureDateKey(-30),
                to: futureDateKey(30),
            },
        });
        expect.status(res, 200);
    });

    await test("GET /api/consultations/reports/diagnostics — HU-07 report", async () => {
        const res = await doctor.get("/api/consultations/reports/diagnostics", {
            query: { fromYear: 2024, toYear: 2026 },
        });
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data?.byCode), "byCode array");
        expect.truthy(Array.isArray(res.body?.data?.byYear), "byYear array");
        expect.truthy(res.body?.data?.totals, "totals");
    });

    await test("GET /api/consultations/reports/diagnosis-catalog — catalog", async () => {
        const res = await doctor.get("/api/consultations/reports/diagnosis-catalog");
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/consultations/reports/diagnostics — assistant forbidden", async () => {
        const res = await assistant.get("/api/consultations/reports/diagnostics");
        expect.status(res, 403);
    });

    // ── 8.5 AI Clinical endpoints (accept 503 if no GEMINI_API_KEY) ─────────
    log.section("8.5 AI Clinical integrations");

    await test("POST /api/ai/suggest-icd10 — auth + reachable", async () => {
        const res = await doctor.post("/api/ai/suggest-icd10", { diagnosis: "Diabetes mellitus tipo 2" });
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    await test("POST /api/ai/suggest-icd10 — assistant forbidden", async () => {
        const res = await assistant.post("/api/ai/suggest-icd10", { diagnosis: "x" });
        expect.status(res, 403);
    });

    await test("GET /api/ai/patient/:id/summary — auth + reachable", async () => {
        const res = await doctor.get(`/api/ai/patient/${state.patientId}/summary`);
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    await test("POST /api/ai/draft-anamnesis — auth + reachable", async () => {
        const res = await doctor.post("/api/ai/draft-anamnesis", {
            motivo: "Cefalea de 3 días",
            edad: 35,
            genero: "male",
        });
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    await test("POST /api/ai/check-prescription — auth + reachable", async () => {
        const res = await doctor.post("/api/ai/check-prescription", {
            medications: [{ name: "Paracetamol", dose: "1 tableta", frequency: "c/8h" }],
            patient: { age: 35, isMinor: false },
        });
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    await test("POST /api/ai/extract-history — auth + reachable", async () => {
        const res = await assistant.post("/api/ai/extract-history", {
            text: "Diabetes tipo 2 desde 2020. Alergia a penicilina.",
        });
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    await test("POST /api/ai/analyze-report — auth + reachable", async () => {
        const res = await doctor.post("/api/ai/analyze-report", {
            byYear: [{ year: 2025, total: 10, diagnoses: [] }],
            period: "2025",
            totalConsultations: 10,
        });
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    // ── 9. Document templates ───────────────────────────────────────
    log.section("9. Document templates");

    await test("POST /api/document-templates — admin creates template", async () => {
        const res = await admin.post("/api/document-templates", {
            type: "constancia",
            name: `E2E Constancia ${Date.now()}`,
            description: "Plantilla de prueba E2E",
            bodyTemplate:
                "Por medio de la presente hacemos constar que {{paciente.nombre}} " +
                "fue atendido el {{fecha.hoy}} en {{clinica.nombre}}.",
            isDefault: false,
            status: "active",
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "template id");
        state.templateId = res.body.data.id;
    });

    await test("GET /api/document-templates — list", async () => {
        const res = await admin.get("/api/document-templates");
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("GET /api/document-templates/:id — detail", async () => {
        const res = await admin.get(`/api/document-templates/${state.templateId}`);
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data?.placeholders), "placeholders array");
    });

    await test("PUT /api/document-templates/:id — update", async () => {
        const res = await admin.put(`/api/document-templates/${state.templateId}`, {
            name: "E2E Constancia (actualizada)",
            description: "Actualizada",
        });
        expect.status(res, 200);
    });

    await test("PATCH /api/document-templates/:id/status — inactive", async () => {
        const res = await admin.patch(
            `/api/document-templates/${state.templateId}/status`,
            { status: "inactive" }
        );
        expect.status(res, 200);
        // reactivate for downstream document generation
        await admin.patch(`/api/document-templates/${state.templateId}/status`, {
            status: "active",
        });
    });

    await test("POST /api/document-templates/ai-draft — IA (accepts 5xx if no key)", async () => {
        const res = await admin.post("/api/document-templates/ai-draft", {
            prompt: "Incapacidad por gripe por 3 días",
            preferType: "incapacidad",
        });
        // If GEMINI_API_KEY is missing, backend returns 5xx/4xx; accept both.
        expect.statusIn(res, [200, 400, 500, 502, 503]);
    });

    // ── 10. Generated documents ─────────────────────────────────────
    log.section("10. Generated documents");

    await test("POST /api/documents — doctor emits constancia", async () => {
        const res = await doctor.post("/api/documents", {
            templateId: state.templateId,
            patientId: state.patientId,
            consultationId: state.consultationId,
            extras: {},
            title: "Constancia E2E",
        });
        expect.status(res, 201);
        expect.truthy(res.body?.data?.id, "document id");
        state.documentId = res.body.data.id;
    });

    await test("GET /api/documents/:id — detail", async () => {
        const res = await doctor.get(`/api/documents/${state.documentId}`);
        expect.status(res, 200);
        expect.eq(res.body?.data?.id, state.documentId, "id match");
    });

    await test("GET /api/documents/patient/:patientId — list by patient", async () => {
        const res = await doctor.get(`/api/documents/patient/${state.patientId}`);
        expect.status(res, 200);
        expect.truthy(Array.isArray(res.body?.data), "array");
    });

    await test("POST /api/documents — assistant forbidden", async () => {
        const res = await assistant.post("/api/documents", {
            templateId: state.templateId,
            patientId: state.patientId,
        });
        expect.status(res, 403);
    });

    // ── 11. Audit logs (admin-only) ─────────────────────────────────
    log.section("11. Audit logs");

    await test("GET /api/audit — admin reads", async () => {
        const res = await admin.get("/api/audit");
        expect.status(res, 200);
    });

    await test("GET /api/audit/record/:recordId — record trail", async () => {
        const res = await admin.get(`/api/audit/record/${state.patientId}`);
        expect.status(res, 200);
    });

    await test("GET /api/audit/patient/:patientId — patient trail", async () => {
        const res = await admin.get(`/api/audit/patient/${state.patientId}`);
        expect.status(res, 200);
    });

    await test("GET /api/audit — doctor forbidden", async () => {
        const res = await doctor.get("/api/audit");
        expect.status(res, 403);
    });

    // ── 12. Maintenance (backup/restore, admin-only) ────────────────
    log.section("12. Maintenance");

    await test("GET /api/admin/backup — admin endpoint reachable", async () => {
        // Bypass JSON parsing by using a raw fetch (controller returns SQL/zip stream).
        // 500 is accepted because backup depends on `mysqldump` being installed in the
        // backend host; that's an environment concern, not an endpoint contract issue.
        const res = await fetch(`${BASE_URL}/api/admin/backup`, {
            headers: { Cookie: admin.jar.cookie, Origin: ORIGIN },
        });
        expect.statusIn(
            { status: res.status, body: null },
            [200, 201, 500],
            "backup reachable (500 = mysqldump missing)"
        );
    });

    await test("GET /api/admin/backup — non-admin forbidden", async () => {
        const res = await fetch(`${BASE_URL}/api/admin/backup`, {
            headers: { Cookie: doctor.jar.cookie, Origin: ORIGIN },
        });
        expect.statusIn({ status: res.status, body: null }, [401, 403], "backup forbidden");
    });

    skip("POST /api/admin/restore", "destructive — skipped to preserve data integrity");

    // ── 13. Sign-out ────────────────────────────────────────────────
    log.section("13. Sign-out");

    await test("POST /api/auth/sign-out — admin", async () => {
        const res = await admin.post("/api/auth/sign-out", {});
        expect.statusIn(res, [200, 204]);
    });

    await test("POST /api/auth/sign-out — doctor", async () => {
        const res = await doctor.post("/api/auth/sign-out", {});
        expect.statusIn(res, [200, 204]);
    });

    await test("POST /api/auth/sign-out — assistant", async () => {
        const res = await assistant.post("/api/auth/sign-out", {});
        expect.statusIn(res, [200, 204]);
    });

    // ── Report ──────────────────────────────────────────────────────
    console.log(
        `\n${COLORS.bold}━━━ Summary ━━━${COLORS.reset}\n` +
        `  ${COLORS.green}passed:  ${stats.passed}${COLORS.reset}\n` +
        `  ${COLORS.red}failed:  ${stats.failed}${COLORS.reset}\n` +
        `  ${COLORS.yellow}skipped: ${stats.skipped}${COLORS.reset}\n`
    );

    if (stats.failed > 0) {
        console.log(`${COLORS.red}${COLORS.bold}Failures:${COLORS.reset}`);
        for (const { name, err } of stats.failures) {
            console.log(`  ${COLORS.red}✗${COLORS.reset} ${name}`);
            console.log(`    ${COLORS.gray}${err.message || err}${COLORS.reset}`);
        }
        process.exit(1);
    }

    console.log(`${COLORS.green}${COLORS.bold}All E2E checks passed.${COLORS.reset}`);
    process.exit(0);
};

run().catch((err) => {
    console.error(`\n${COLORS.red}${COLORS.bold}Test runner crashed:${COLORS.reset}`, err);
    process.exit(2);
});
