/**
 * Seed demo: genera un dataset clínico realista para 2024, 2025 y hasta
 * 2026-04-23. Pensado para demostraciones (HU-07, analítica, AI clínico).
 *
 * Qué genera:
 *   - 6 aseguradoras con montos pre-negociados distintos.
 *   - 60 pacientes (48 adultos + 12 menores) con historias clínicas diversas.
 *   - ~900 citas distribuidas en 28 meses (con escalado estacional).
 *   - Registros pre-clínicos, consultas médicas finalizadas, recetas y
 *     diagnósticos con CIE-10 real (los 25 códigos más comunes en consulta
 *     externa de El Salvador).
 *
 * Cómo usar:
 *   cd BackEnd && node src/seedDemo.js
 *
 * Es idempotente por patientId: si vuelves a correrlo, añade más datos sin
 * duplicar pacientes (detecta por identityDocument). Si quieres un reset
 * total: TRUNCATE las tablas antes (ver comando al final del archivo).
 */

import 'dotenv/config';
import { v4 as uuidv4 } from "uuid";
import { connectDB, db } from "./config/db.js";
import {
    users,
    patients,
    insurers,
    appointments,
    preclinicalRecords,
    medicalConsultations,
    prescribedMedications,
} from "./models/schema.js";
import { eq, and, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// 25 diagnósticos CIE-10 frecuentes en consulta externa
// ─────────────────────────────────────────────────────────────────────────────

const DIAGNOSES = [
    { code: "I10", name: "Hipertensión esencial (primaria)", weight: 15, tags: ["chronic", "adult"] },
    { code: "E11.9", name: "Diabetes mellitus tipo 2 sin complicaciones", weight: 12, tags: ["chronic", "adult"] },
    { code: "J00", name: "Rinofaringitis aguda (resfriado común)", weight: 10, tags: ["acute", "any"] },
    { code: "J06.9", name: "Infección aguda de las vías respiratorias superiores", weight: 9, tags: ["acute", "any"] },
    { code: "K29.7", name: "Gastritis no especificada", weight: 8, tags: ["acute", "adult"] },
    { code: "N39.0", name: "Infección de vías urinarias, sitio no especificado", weight: 7, tags: ["acute", "any"] },
    { code: "M54.5", name: "Lumbago no especificado", weight: 7, tags: ["acute", "adult"] },
    { code: "R51", name: "Cefalea", weight: 6, tags: ["acute", "any"] },
    { code: "J45.9", name: "Asma, no especificada", weight: 5, tags: ["chronic", "any"] },
    { code: "K21.9", name: "Enfermedad del reflujo gastroesofágico sin esofagitis", weight: 5, tags: ["chronic", "adult"] },
    { code: "A09", name: "Diarrea y gastroenteritis de presunto origen infeccioso", weight: 6, tags: ["acute", "any"] },
    { code: "E78.5", name: "Hiperlipidemia no especificada", weight: 5, tags: ["chronic", "adult"] },
    { code: "F41.1", name: "Trastorno de ansiedad generalizada", weight: 4, tags: ["mental", "adult"] },
    { code: "F32.9", name: "Episodio depresivo, no especificado", weight: 3, tags: ["mental", "adult"] },
    { code: "Z00.0", name: "Examen médico general", weight: 8, tags: ["checkup", "any"] },
    { code: "L20.9", name: "Dermatitis atópica no especificada", weight: 3, tags: ["chronic", "any"] },
    { code: "H10.9", name: "Conjuntivitis no especificada", weight: 3, tags: ["acute", "any"] },
    { code: "H66.9", name: "Otitis media no especificada", weight: 4, tags: ["acute", "child"] },
    { code: "B34.9", name: "Infección viral no especificada", weight: 5, tags: ["acute", "any"] },
    { code: "O80", name: "Parto único espontáneo", weight: 2, tags: ["obstetric", "adult"] },
    { code: "E66.9", name: "Obesidad no especificada", weight: 4, tags: ["chronic", "adult"] },
    { code: "M25.5", name: "Dolor articular", weight: 4, tags: ["acute", "adult"] },
    { code: "R50.9", name: "Fiebre no especificada", weight: 4, tags: ["acute", "any"] },
    { code: "S93.4", name: "Esguince de tobillo", weight: 2, tags: ["acute", "any"] },
    { code: "Z76.8", name: "Control de salud del niño sano", weight: 5, tags: ["checkup", "child"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de medicamentos por diagnóstico (plan clínico estándar)
// ─────────────────────────────────────────────────────────────────────────────

const MED_PLANS = {
    "I10": [{ name: "Losartán", conc: "50", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "E11.9": [
        { name: "Metformina", conc: "850", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 12 horas", dur: "Por 30 días" },
        { name: "Glibenclamida", conc: "5", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" },
    ],
    "J00": [{ name: "Paracetamol", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 3 días" }],
    "J06.9": [
        { name: "Amoxicilina", conc: "500", concU: "mg", dose: "1", doseU: "Cápsula(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 7 días" },
        { name: "Paracetamol", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 6 horas", dur: "Por 5 días" },
    ],
    "K29.7": [{ name: "Omeprazol", conc: "20", concU: "mg", dose: "1", doseU: "Cápsula(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 14 días" }],
    "N39.0": [{ name: "Ciprofloxacina", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 12 horas", dur: "Por 7 días" }],
    "M54.5": [
        { name: "Ibuprofeno", conc: "400", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 5 días" },
        { name: "Diclofenaco", conc: "50", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 12 horas", dur: "Por 5 días" },
    ],
    "R51": [{ name: "Paracetamol", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 3 días" }],
    "J45.9": [{ name: "Salbutamol", conc: "100", concU: "mcg", dose: "2", doseU: "Aplicación(es)", route: "Oral", freq: "Cada 6 horas", dur: "Por 14 días" }],
    "K21.9": [{ name: "Omeprazol", conc: "20", concU: "mg", dose: "1", doseU: "Cápsula(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "A09": [
        { name: "Loperamida", conc: "2", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 3 días" },
        { name: "Sales de rehidratación oral", conc: "", concU: "", dose: "1", doseU: "Aplicación(es)", route: "Oral", freq: "Cada 6 horas", dur: "Por 3 días" },
    ],
    "E78.5": [{ name: "Atorvastatina", conc: "20", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "F41.1": [{ name: "Sertralina", conc: "50", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "F32.9": [{ name: "Fluoxetina", conc: "20", concU: "mg", dose: "1", doseU: "Cápsula(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "Z00.0": [],
    "L20.9": [{ name: "Hidrocortisona", conc: "1", concU: "%", dose: "1", doseU: "Aplicación(es)", route: "Tópica", freq: "Cada 12 horas", dur: "Por 7 días" }],
    "H10.9": [{ name: "Cloranfenicol", conc: "0.5", concU: "%", dose: "1", doseU: "Gota(s)", route: "Oftálmica", freq: "Cada 6 horas", dur: "Por 7 días" }],
    "H66.9": [{ name: "Amoxicilina", conc: "250", concU: "mg", dose: "1", doseU: "Mililitro(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 7 días" }],
    "B34.9": [{ name: "Paracetamol", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 5 días" }],
    "O80": [{ name: "Ácido fólico", conc: "1", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 24 horas", dur: "Por 30 días" }],
    "E66.9": [],
    "M25.5": [{ name: "Naproxeno", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 12 horas", dur: "Por 5 días" }],
    "R50.9": [{ name: "Paracetamol", conc: "500", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 6 horas", dur: "Por 3 días" }],
    "S93.4": [{ name: "Ibuprofeno", conc: "400", concU: "mg", dose: "1", doseU: "Tableta(s)", route: "Oral", freq: "Cada 8 horas", dur: "Por 7 días" }],
    "Z76.8": [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de aseguradoras
// ─────────────────────────────────────────────────────────────────────────────

const INSURERS_DATA = [
    { companyName: "ASESUISA", contactName: "Carlos Martínez", phone: "2209-1000", email: "asesuisa@insurance.sv", amount: 28.0 },
    { companyName: "MAPFRE El Salvador", contactName: "Lucía Hernández", phone: "2206-6000", email: "mapfre@insurance.sv", amount: 32.5 },
    { companyName: "SISA Seguros", contactName: "Roberto García", phone: "2259-8800", email: "sisa@insurance.sv", amount: 25.0 },
    { companyName: "Pan American Life", contactName: "María Rodríguez", phone: "2248-3000", email: "panamerican@insurance.sv", amount: 35.0 },
    { companyName: "Seguros e Inversiones", contactName: "Jorge López", phone: "2207-1500", email: "segurosinversiones@insurance.sv", amount: 30.0 },
    { companyName: "Qualitas Compañía de Seguros", contactName: "Andrea Morales", phone: "2298-4200", email: "qualitas@insurance.sv", amount: 27.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de nombres (se combinan para crear pacientes)
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES_M = [
    "Carlos", "José", "Luis", "Juan", "Miguel", "Roberto", "Ricardo", "Fernando",
    "Jorge", "Alberto", "Manuel", "Rafael", "Alejandro", "Daniel", "Oscar", "Eduardo",
    "Mario", "Francisco", "Marvin", "Nelson", "René", "Héctor", "Raúl", "Edwin",
];
const FIRST_NAMES_F = [
    "María", "Ana", "Sofía", "Lucía", "Laura", "Carmen", "Beatriz", "Claudia",
    "Patricia", "Elena", "Mónica", "Silvia", "Andrea", "Verónica", "Gabriela", "Rosa",
    "Teresa", "Mariana", "Dora", "Blanca", "Marta", "Alba", "Sandra", "Karla",
];
const LAST_NAMES = [
    "García", "Martínez", "Rodríguez", "López", "Hernández", "González", "Pérez",
    "Sánchez", "Ramírez", "Flores", "Rivas", "Cruz", "Morales", "Díaz", "Vásquez",
    "Castro", "Reyes", "Jiménez", "Ruiz", "Mejía", "Navarro", "Aguilar", "Paz",
    "Romero", "Carranza", "Portillo", "Chávez", "Serrano", "Alvarado", "Soriano",
    "Menjívar", "Bonilla", "Argueta", "Zelaya", "Escobar", "Ventura",
];

const ANTECEDENTS_PERSONAL = [
    "Sin antecedentes de importancia.",
    "DM2 desde hace 5 años, en tratamiento con metformina.",
    "HTA diagnosticada hace 3 años, en control con losartán.",
    "Alérgica a penicilina. Sin otros antecedentes.",
    "Apendicectomía en 2015. Sin medicación actual.",
    "Asma bronquial desde la infancia, usa salbutamol PRN.",
    "Dislipidemia en control con atorvastatina.",
    "Ex fumadora (20 paquetes/año, suspendió hace 5 años).",
    "Gastritis crónica, uso intermitente de omeprazol.",
    "Hipotiroidismo, usa levotiroxina 50mcg/día.",
    "Sin alergias conocidas. No fumadora.",
    "Cesárea previa (2019). No otras cirugías.",
];

const ANTECEDENTS_FAMILY = [
    "Padre con HTA, madre con DM2.",
    "Abuela materna con cáncer de mama.",
    "Sin antecedentes familiares relevantes.",
    "Padre falleció de infarto a los 58 años.",
    "Hermano con diabetes tipo 2.",
    "Madre con hipotiroidismo.",
    "Antecedente de cardiopatía en familia paterna.",
    "Sin antecedentes heredo-familiares conocidos.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de aleatoriedad determinista
// ─────────────────────────────────────────────────────────────────────────────

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) => Number((Math.random() * (max - min) + min).toFixed(decimals));

const weightedPick = (items, tags = ["any"]) => {
    const eligible = items.filter((i) => i.tags.some((t) => tags.includes(t) || t === "any"));
    const totalWeight = eligible.reduce((sum, i) => sum + i.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of eligible) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }
    return eligible[0];
};

const randomDui = (() => {
    let counter = 100000;
    return () => {
        counter += randInt(13, 97);
        const n = String(counter).padStart(8, "0").slice(0, 8);
        return `${n}-${randInt(0, 9)}`;
    };
})();

const pad = (n, w = 2) => String(n).padStart(w, "0");

const formatMysqlDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatMysqlDateTime = (d) =>
    `${formatMysqlDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const dateInRange = (year, month, day, hour = randInt(8, 16), minute = random([0, 15, 30, 45])) =>
    new Date(year, month - 1, day, hour, minute, randInt(0, 59));

// Factor estacional — más consultas en meses fríos/lluviosos (enero, junio-agosto, noviembre).
const seasonalFactor = (month) => {
    const seasonal = [1.2, 0.9, 0.95, 1.0, 1.05, 1.25, 1.3, 1.2, 1.0, 0.95, 1.15, 0.85];
    return seasonal[month - 1] || 1;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generadores
// ─────────────────────────────────────────────────────────────────────────────

const generatePatient = (index, isMinor = false, insurerId = null) => {
    const gender = Math.random() < 0.5 ? "male" : "female";
    const firstName = gender === "male" ? random(FIRST_NAMES_M) : random(FIRST_NAMES_F);
    const middleName = gender === "male" ? random(FIRST_NAMES_M) : random(FIRST_NAMES_F);
    const lastName1 = random(LAST_NAMES);
    const lastName2 = random(LAST_NAMES);
    const fullName = `${firstName} ${middleName} ${lastName1} ${lastName2}`;

    // Edad: adultos entre 18 y 78, menores entre 2 y 17
    const minAge = isMinor ? 2 : 18;
    const maxAge = isMinor ? 17 : 78;
    const age = randInt(minAge, maxAge);
    const currentYear = 2026;
    const birthYear = currentYear - age;
    const birthMonth = randInt(1, 12);
    const birthDay = randInt(1, 28);
    const yearOfBirth = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

    return {
        id: uuidv4(),
        fullName,
        yearOfBirth,
        identityDocument: randomDui(),
        gender,
        phone: `7${randInt(100, 999)}-${randInt(1000, 9999)}`,
        address: `Col. ${random(["San Benito", "Escalón", "Miramonte", "Flor Blanca", "Centro", "Zacamil", "Soyapango", "Apopa", "Mejicanos"])} #${randInt(1, 500)}`,
        fileNumber: `EXP-2024-${String(1000 + index).padStart(4, "0")}`,
        isMinor: isMinor ? 1 : 0,
        responsibleName: isMinor ? `${random(FIRST_NAMES_F)} ${lastName1} ${lastName2}` : null,
        personalHistory: random(ANTECEDENTS_PERSONAL),
        familyHistory: random(ANTECEDENTS_FAMILY),
        insurerId,
        status: "active",
        age, // no se persiste, se usa para lógica
        createdAt: new Date(2024, 0, 1 + index), // registros escalonados
    };
};

const generateConsultationData = (patient, consultationDate) => {
    const tags = ["any"];
    if (patient.age < 18) tags.push("child");
    if (patient.age >= 18) tags.push("adult");

    // Mental health solo en adultos con menor probabilidad
    const allTagsRelevant = tags.includes("adult")
        ? [...tags, Math.random() < 0.15 ? "mental" : "any", Math.random() < 0.2 ? "chronic" : "any"]
        : tags;

    const dx = weightedPick(DIAGNOSES, allTagsRelevant);

    // Signos vitales: en rango normal ±outliers
    const isAbnormal = Math.random() < 0.25;
    const sys = isAbnormal ? randInt(140, 170) : randInt(110, 130);
    const dia = isAbnormal ? randInt(90, 105) : randInt(65, 85);
    const temp = Math.random() < 0.15 ? randFloat(37.6, 39.0, 1) : randFloat(36.2, 36.9, 1);
    const hr = randInt(65, 95);
    const o2 = randInt(94, 99);

    // Peso/altura acorde a edad
    const weight = patient.age < 10
        ? randFloat(15, 40, 1)
        : patient.age < 18 ? randFloat(40, 130, 1)
            : randFloat(110, 220, 1);
    const height = patient.age < 10
        ? randFloat(0.9, 1.3, 2)
        : patient.age < 18 ? randFloat(1.3, 1.75, 2)
            : randFloat(1.5, 1.85, 2);
    const wKg = weight / 2.2046;
    const bmi = Number((wKg / (height * height)).toFixed(2));

    // Plan médico
    const plan = MED_PLANS[dx.code] || [];

    // Motivos de consulta según diagnóstico
    const motivos = {
        chronic: "Control mensual de condición crónica.",
        acute: "Cuadro agudo de sintomatología reciente.",
        checkup: "Chequeo de rutina.",
        mental: "Seguimiento de salud mental.",
        obstetric: "Control obstétrico.",
    };
    const motivoCategory = dx.tags.find((t) => motivos[t]) || "acute";
    const motivo = motivos[motivoCategory];

    // Anamnesis acorde al diagnóstico
    const anamnesis = `Paciente ${patient.gender === "male" ? "masculino" : "femenino"} de ${patient.age} años acude por ${dx.name.toLowerCase()}. Refiere sintomatología de ${randInt(1, 14)} días de evolución. ${patient.personalHistory.includes("DM2") || patient.personalHistory.includes("HTA") ? "Antecedente de patología crónica en control. " : ""}Niega reacciones adversas a medicamentos previos.`;

    const physicalExam = `Paciente en buen estado general, orientado, cooperador. SV: TA ${sys}/${dia}, FC ${hr}, T ${temp}°C, SatO₂ ${o2}%. Examen físico por aparatos sin hallazgos patológicos agudos adicionales al motivo de consulta.`;

    const observations = dx.tags.includes("chronic")
        ? "Continúa en tratamiento crónico. Indicar próximo control en 30 días. Adherencia adecuada."
        : dx.tags.includes("acute")
            ? "Resolución esperada en 5-7 días. Señales de alarma explicadas al paciente."
            : "Examen de rutina dentro de límites normales. Próximo control anual.";

    const labResults = Math.random() < 0.2
        ? "Laboratorios recientes dentro de límites normales. Hemograma, perfil lipídico y glicemia en rango."
        : "Sin laboratorios en esta consulta.";

    return {
        diagnosis: dx,
        motivo,
        anamnesis,
        physicalExam,
        diagnosisText: dx.name,
        labResults,
        observations,
        vitals: {
            bloodPressure: `${sys}/${dia}`,
            temperature: temp,
            heartRate: hr,
            oxygenSaturation: o2,
            weight,
            height,
            bmi,
        },
        medications: plan,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline principal
// ─────────────────────────────────────────────────────────────────────────────

const run = async () => {
    console.log("→ Conectando a la base de datos...");
    await connectDB();

    // 1. Obtener IDs de usuarios existentes
    const [doctorUser] = await db.select().from(users).where(eq(users.role, "doctor")).limit(1);
    const [assistantUser] = await db.select().from(users).where(eq(users.role, "assistant")).limit(1);

    if (!doctorUser || !assistantUser) {
        console.error("✗ Faltan usuarios base. Corre `npm run seed` primero.");
        process.exit(1);
    }

    const doctorId = doctorUser.id;
    const assistantId = assistantUser.id;
    console.log(`✓ Doctor: ${doctorUser.name} (${doctorId.slice(0, 8)}...)`);
    console.log(`✓ Assistant: ${assistantUser.name} (${assistantId.slice(0, 8)}...)`);

    // 2. Aseguradoras
    console.log("\n→ Sembrando aseguradoras...");
    const insurerIds = [];
    for (const ins of INSURERS_DATA) {
        const existing = await db.select().from(insurers).where(eq(insurers.companyName, ins.companyName)).limit(1);
        if (existing.length > 0) {
            insurerIds.push(existing[0].id);
            console.log(`  [skip] ${ins.companyName} ya existe`);
            continue;
        }
        const id = uuidv4();
        await db.insert(insurers).values({
            id,
            companyName: ins.companyName,
            contactName: ins.contactName,
            phone: ins.phone,
            email: ins.email,
            fixedConsultationAmount: ins.amount.toFixed(2),
            status: "active",
        });
        insurerIds.push(id);
        console.log(`  [ok] ${ins.companyName}`);
    }

    // 3. Pacientes (60 nuevos)
    console.log("\n→ Sembrando 60 pacientes...");
    const patientsToCreate = [];
    for (let i = 0; i < 48; i++) {
        // 50% de adultos con aseguradora
        const insurerId = Math.random() < 0.5 ? random(insurerIds) : null;
        patientsToCreate.push(generatePatient(i + 1, false, insurerId));
    }
    for (let i = 0; i < 12; i++) {
        // Menores: 30% con aseguradora
        const insurerId = Math.random() < 0.3 ? random(insurerIds) : null;
        patientsToCreate.push(generatePatient(48 + i + 1, true, insurerId));
    }

    const patientsCreated = [];
    for (const p of patientsToCreate) {
        const existing = await db.select().from(patients).where(eq(patients.identityDocument, p.identityDocument)).limit(1);
        if (existing.length > 0) continue;

        const { age, createdAt, ...insertable } = p;
        await db.insert(patients).values(insertable);
        patientsCreated.push(p);
    }
    console.log(`  [ok] ${patientsCreated.length} pacientes creados`);

    // 4. Generar consultas históricas (2024-01 → 2026-04-23)
    console.log("\n→ Generando consultas, citas y recetas históricas (2024 → 2026-04-23)...");

    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2026, 3, 23); // 23 de abril 2026 inclusive

    let totalAppointments = 0;
    let totalPreclinicals = 0;
    let totalConsultations = 0;
    let totalMedications = 0;

    // Barajar pacientes, cada uno tiene N consultas por mes según perfil
    for (const patient of patientsCreated) {
        // Frecuencia del paciente: crónicos vienen ~1/mes, sanos ~2/año
        const isChronic = patient.personalHistory.includes("DM2") ||
            patient.personalHistory.includes("HTA") ||
            patient.personalHistory.includes("crónica") ||
            patient.personalHistory.includes("hipotiroidismo");
        const consultsPerYear = isChronic ? randInt(8, 14) : randInt(1, 4);

        // Repartir consultas por mes entre startDate y endDate
        let d = new Date(startDate);
        while (d < endDate) {
            const year = d.getFullYear();
            const month = d.getMonth() + 1;

            // Probabilidad de consulta este mes
            const monthlyProb = (consultsPerYear / 12) * seasonalFactor(month);
            if (Math.random() < monthlyProb) {
                const day = randInt(1, 28);
                const hour = randInt(8, 16);
                const minute = random([0, 15, 30, 45]);
                const consultaDateTime = new Date(year, month - 1, day, hour, minute, 0);

                if (consultaDateTime > endDate) break;

                const payload = generateConsultationData(patient, consultaDateTime);

                // 70% con cita previa, 30% walk-in
                let appointmentId = null;
                if (Math.random() < 0.7) {
                    appointmentId = uuidv4();
                    await db.insert(appointments).values({
                        id: appointmentId,
                        patientId: patient.id,
                        date: formatMysqlDate(consultaDateTime),
                        time: `${pad(hour)}:${pad(minute)}`,
                        reason: payload.motivo,
                        status: "done",
                        createdByUserId: assistantId,
                        createdAt: new Date(consultaDateTime.getTime() - 3 * 24 * 60 * 60 * 1000), // creada 3 días antes
                        updatedAt: consultaDateTime,
                    });
                    totalAppointments++;
                }

                // Preclinical
                const preclinicalId = uuidv4();
                await db.insert(preclinicalRecords).values({
                    id: preclinicalId,
                    patientId: patient.id,
                    createdByUserId: assistantId,
                    createdByRole: "assistant",
                    motivo: payload.motivo,
                    bloodPressure: payload.vitals.bloodPressure,
                    temperature: String(payload.vitals.temperature),
                    weight: String(payload.vitals.weight),
                    height: String(payload.vitals.height),
                    heartRate: payload.vitals.heartRate,
                    oxygenSaturation: payload.vitals.oxygenSaturation,
                    bmi: String(payload.vitals.bmi),
                    status: "done",
                    createdAt: consultaDateTime,
                    updatedAt: consultaDateTime,
                });
                totalPreclinicals++;

                // Consulta médica
                const consultationId = uuidv4();
                const useInsurance = patient.insurerId && Math.random() < 0.8;
                const insurerForConsult = useInsurance ? patient.insurerId : null;
                let agreedAmount = null;
                if (insurerForConsult) {
                    const ins = INSURERS_DATA.find((_, idx) => insurerIds[idx] === insurerForConsult);
                    agreedAmount = ins ? ins.amount.toFixed(2) : null;
                }

                await db.insert(medicalConsultations).values({
                    id: consultationId,
                    preclinicalId,
                    patientId: patient.id,
                    insurerId: insurerForConsult,
                    doctorId,
                    agreedAmount,
                    anamnesis: payload.anamnesis,
                    physicalExam: payload.physicalExam,
                    diagnosis: payload.diagnosisText,
                    diagnosisCode: payload.diagnosis.code,
                    diagnosisCodeName: payload.diagnosis.name,
                    labResults: payload.labResults,
                    observations: payload.observations,
                    createdAt: new Date(consultaDateTime.getTime() + 30 * 60 * 1000), // consulta 30 min después de preclinica
                    updatedAt: new Date(consultaDateTime.getTime() + 30 * 60 * 1000),
                });
                totalConsultations++;

                // Medicamentos
                for (const med of payload.medications) {
                    await db.insert(prescribedMedications).values({
                        id: uuidv4(),
                        consultationId,
                        name: med.name,
                        concentration: med.conc || null,
                        concentrationUnit: med.concU || null,
                        dose: med.dose,
                        doseUnit: med.doseU,
                        route: med.route,
                        frequency: med.freq,
                        duration: med.dur,
                        additionalInstructions: Math.random() < 0.3 ? "Tomar después de los alimentos." : null,
                        createdAt: new Date(consultaDateTime.getTime() + 35 * 60 * 1000),
                    });
                    totalMedications++;
                }
            }

            // Avanzar al siguiente mes
            d = new Date(year, month, 1);
        }
    }

    console.log(`\n✓ Datos generados:`);
    console.log(`   • ${patientsCreated.length} pacientes`);
    console.log(`   • ${totalAppointments} citas`);
    console.log(`   • ${totalPreclinicals} registros pre-clínicos`);
    console.log(`   • ${totalConsultations} consultas médicas`);
    console.log(`   • ${totalMedications} medicamentos recetados`);

    // 5. Dejar algunos pacientes EN ESTADO ACTIVO HOY (para que la sala de espera tenga contenido)
    console.log("\n→ Generando 3 pre-clínicas activas para HOY...");
    const today = new Date();
    const activeToday = patientsCreated.slice(0, 3);
    for (const p of activeToday) {
        const when = new Date(today.getFullYear(), today.getMonth(), today.getDate(), randInt(8, 11), random([0, 15, 30]));
        const dx = weightedPick(DIAGNOSES, ["acute"]);
        const preId = uuidv4();
        await db.insert(preclinicalRecords).values({
            id: preId,
            patientId: p.id,
            createdByUserId: assistantId,
            createdByRole: "assistant",
            motivo: `Consulta por ${dx.name.toLowerCase()}.`,
            bloodPressure: `${randInt(110, 140)}/${randInt(70, 90)}`,
            temperature: String(randFloat(36.2, 37.8, 1)),
            weight: String(randFloat(130, 200, 1)),
            height: String(randFloat(1.55, 1.85, 2)),
            heartRate: randInt(68, 92),
            oxygenSaturation: randInt(95, 99),
            bmi: "24.50",
            status: "waiting",
            createdAt: when,
            updatedAt: when,
        });

        // Cita marcada como "present" para ese paciente también
        await db.insert(appointments).values({
            id: uuidv4(),
            patientId: p.id,
            date: formatMysqlDate(when),
            time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
            reason: `Consulta por ${dx.name.toLowerCase()}.`,
            status: "present",
            createdByUserId: assistantId,
            createdAt: new Date(when.getTime() - 24 * 60 * 60 * 1000),
            updatedAt: when,
        });
    }
    console.log("  [ok] 3 pacientes en sala de espera");

    console.log("\n🎉 Seed demo completado con éxito.\n");
    process.exit(0);
};

run().catch((err) => {
    console.error("\n✗ Error en el seed demo:");
    console.error(err);
    process.exit(1);
});
