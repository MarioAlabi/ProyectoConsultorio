import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/config/db.js";
import consultationRouter from "../src/routes/consultationRoutes.js";
import { createMedicalConsultation, getClinicalHistoryByPatientId, normalizePrescribedMedications } from "../src/services/consultationService.js";

const createSelectStub = (configs, tracker) => {
    let callIndex = 0;

    return (selection) => {
        const config = configs[callIndex++];
        if (!config) {
            throw new Error("No hay configuracion de stub para esta llamada a db.select.");
        }

        const record = {
            selection,
            whereArg: null,
            orderByArg: null,
        };
        tracker.calls.push(record);

        const builder = {
            from(source) {
                record.from = source;
                return builder;
            },
            leftJoin(table, joinOn) {
                record.leftJoin = { table, joinOn };
                return builder;
            },
            where(arg) {
                record.whereArg = arg;
                if (config.resolveOn === "where") {
                    return Promise.resolve(config.rows);
                }
                return builder;
            },
            orderBy(arg) {
                record.orderByArg = arg;
                return Promise.resolve(config.rows);
            },
            limit() {
                return Promise.resolve(config.rows);
            },
        };

        return builder;
    };
};

const getDateParamFromWhere = (whereArg) => {
    const chunks = whereArg?.queryChunks || [];

    for (const chunk of chunks) {
        if (chunk?.queryChunks) {
            const nested = getDateParamFromWhere(chunk);
            if (nested) return nested;
        }

        if (chunk?.value instanceof Date) {
            return chunk.value;
        }
    }

    return null;
};

test("retorna historial ordenado cronologicamente", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    const tracker = { calls: [] };
    db.select = createSelectStub(
        [
            {
                resolveOn: "orderBy",
                rows: [
                    {
                        consultationId: "c-2026",
                        preclinicalId: "p-2026",
                        patientId: "patient-1",
                        diagnosis: "Hipertension arterial",
                        consultationDate: new Date("2026-02-10T10:00:00.000Z"),
                        doctorId: "doctor-1",
                        doctorName: "Dra. Rivera",
                    },
                    {
                        consultationId: "c-2025",
                        preclinicalId: "p-2025",
                        patientId: "patient-1",
                        diagnosis: "Gastritis aguda",
                        consultationDate: new Date("2025-05-20T08:30:00.000Z"),
                        doctorId: "doctor-2",
                        doctorName: "Dr. Lopez",
                    },
                ],
            },
            {
                resolveOn: "where",
                rows: [
                    {
                        id: "m-1",
                        consultationId: "c-2026",
                        name: "Losartan",
                        concentration: "50",
                        concentrationUnit: "mg",
                        dose: "1",
                        doseUnit: "tableta(s)",
                        route: "Oral",
                        frequency: "12",
                        duration: "30",
                        additionalInstructions: "Despues de alimentos",
                    },
                    {
                        id: "m-2",
                        consultationId: "c-2025",
                        name: "Omeprazol",
                        concentration: "20",
                        concentrationUnit: "mg",
                        dose: "1",
                        doseUnit: "capsula(s)",
                        route: "Oral",
                        frequency: "24",
                        duration: "14",
                        additionalInstructions: "Antes del desayuno",
                    },
                ],
            },
        ],
        tracker
    );

    const result = await getClinicalHistoryByPatientId("patient-1");

    assert.equal(result.empty, false);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].consultationId, "c-2026");
    assert.equal(result.items[1].consultationId, "c-2025");
    assert.ok(result.items[0].consultationDate >= result.items[1].consultationDate);
});

test("normaliza medicamentos del payload actual del frontend para persistirlos", () => {
    const result = normalizePrescribedMedications({
        medicamentos: [
            {
                name: "Losartan",
                concentration: "50",
                concentrationUnit: "mg",
                dose: "1",
                doseUnit: "tableta(s)",
                route: "Oral",
                frequency: "12",
                duration: "30",
                additionalInstructions: "Despues de alimentos",
            },
            { name: "   " },
        ],
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Losartan");
    assert.equal(result[0].concentration, "50");
    assert.equal(result[0].doseUnit, "tableta(s)");
    assert.equal(result[0].additionalInstructions, "Despues de alimentos");
});

test("mantiene compatibilidad con el payload legacy receta", () => {
    const result = normalizePrescribedMedications({
        receta: [
            {
                nombre: "Omeprazol",
                concentracion: "20",
                unidadConcentracion: "mg",
                dosis: "1",
                unidadDosis: "capsula(s)",
                via: "Oral",
                frecuencia: "24",
                duracion: "14",
                indicaciones: "Antes del desayuno",
            },
        ],
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Omeprazol");
    assert.equal(result[0].concentrationUnit, "mg");
    assert.equal(result[0].route, "Oral");
    assert.equal(result[0].additionalInstructions, "Antes del desayuno");
});

test("guarda medicamentos correctamente al registrar una consulta", async (t) => {
    const originalTransaction = db.transaction;
    t.after(() => {
        db.transaction = originalTransaction;
    });

    const inserted = {
        consultation: null,
        medications: null,
        preclinicalUpdate: null,
    };

    const tx = {
        select() {
            return {
                from() {
                    return this;
                },
                where() {
                    return this;
                },
                limit() {
                    return Promise.resolve([
                        {
                            id: "preclinical-1",
                            patientId: "patient-1",
                            bloodPressure: "120/80",
                            temperature: "36.5",
                            weight: "160",
                            height: "1.70",
                            heartRate: 80,
                            oxygenSaturation: 98,
                            bmi: "25.0",
                        },
                    ]);
                },
            };
        },
        insert(table) {
            return {
                values(values) {
                    if (Array.isArray(values)) {
                        inserted.medications = values;
                    } else {
                        inserted.consultation = values;
                    }

                    assert.ok(table);
                    return Promise.resolve();
                },
            };
        },
        update() {
            return {
                set(values) {
                    inserted.preclinicalUpdate = values;
                    return {
                        where() {
                            return Promise.resolve();
                        },
                    };
                },
            };
        },
    };

    db.transaction = async (callback) => callback(tx);

    const result = await createMedicalConsultation(
        "preclinical-1",
        {
            anamnesis: "Dolor de cabeza",
            diagnosis: "Hipertension arterial",
            medicamentos: [
                {
                    name: "Losartan",
                    concentration: "50",
                    concentrationUnit: "mg",
                    dose: "1",
                    doseUnit: "tableta(s)",
                    route: "Oral",
                    frequency: "12",
                    duration: "30",
                    additionalInstructions: "Despues de alimentos",
                },
            ],
        },
        "doctor-1"
    );

    assert.ok(result.consultationId);
    assert.equal(inserted.consultation.patientId, "patient-1");
    assert.equal(inserted.consultation.doctorId, "doctor-1");
    assert.equal(inserted.consultation.diagnosis, "Hipertension arterial");
    assert.equal(inserted.medications.length, 1);
    assert.equal(inserted.medications[0].consultationId, result.consultationId);
    assert.equal(inserted.medications[0].name, "Losartan");
    assert.equal(inserted.medications[0].dose, "1");
    assert.equal(inserted.medications[0].frequency, "12");
    assert.equal(inserted.preclinicalUpdate.status, "done");
});

test("retorna diagnostico, fecha, medicamentos y medico responsable", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    const tracker = { calls: [] };
    db.select = createSelectStub(
        [
            {
                resolveOn: "orderBy",
                rows: [
                    {
                        consultationId: "c-fields",
                        preclinicalId: "p-fields",
                        patientId: "patient-fields",
                        anamnesis: "Paciente con controles previos.",
                        physicalExam: "Sin hallazgos agudos.",
                        diagnosis: "Diabetes mellitus tipo 2",
                        labResults: "Glucosa elevada.",
                        observations: "Continuar dieta y control metabolico.",
                        consultationDate: new Date("2026-01-08T09:00:00.000Z"),
                        reason: "Control por glucosa elevada",
                        status: "done",
                        doctorId: "doctor-fields",
                        doctorName: "Dr. Hernandez",
                    },
                ],
            },
            {
                resolveOn: "where",
                rows: [
                    {
                        id: "med-fields",
                        consultationId: "c-fields",
                        name: "Metformina",
                        concentration: "850",
                        concentrationUnit: "mg",
                        dose: "1",
                        doseUnit: "tableta(s)",
                        route: "Oral",
                        frequency: "12",
                        duration: "60",
                        additionalInstructions: "Tomar con alimentos",
                    },
                ],
            },
        ],
        tracker
    );

    const result = await getClinicalHistoryByPatientId("patient-fields");

    assert.equal(result.items[0].diagnosis, "Diabetes mellitus tipo 2");
    assert.equal(result.items[0].anamnesis, "Paciente con controles previos.");
    assert.equal(result.items[0].physicalExam, "Sin hallazgos agudos.");
    assert.equal(result.items[0].labResults, "Glucosa elevada.");
    assert.equal(result.items[0].observations, "Continuar dieta y control metabolico.");
    assert.equal(result.items[0].reason, "Control por glucosa elevada");
    assert.equal(result.items[0].status, "done");
    assert.ok(result.items[0].consultationDate instanceof Date);
    assert.equal(result.items[0].doctor.name, "Dr. Hernandez");
    assert.equal(result.items[0].medications[0].name, "Metformina");
    assert.equal("preclinicalId" in result.items[0], false);
    assert.equal("patientId" in result.items[0], false);
});

test("limita la consulta al rango esperado de 5 anos", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    const tracker = { calls: [] };
    db.select = createSelectStub(
        [
            { resolveOn: "orderBy", rows: [] },
        ],
        tracker
    );

    const before = new Date();
    await getClinicalHistoryByPatientId("patient-2");
    const after = new Date();

    const whereDate = getDateParamFromWhere(tracker.calls[0].whereArg);

    assert.ok(whereDate instanceof Date);

    const lowerBound = new Date(before);
    lowerBound.setFullYear(lowerBound.getFullYear() - 5);

    const upperBound = new Date(after);
    upperBound.setFullYear(upperBound.getFullYear() - 5);

    // La fecha del filtro debe caer dentro de la ventana temporal esperada.
    assert.ok(whereDate >= lowerBound && whereDate <= upperBound);
});

test("responde correctamente cuando no hay historial", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    const tracker = { calls: [] };
    db.select = createSelectStub(
        [
            { resolveOn: "orderBy", rows: [] },
        ],
        tracker
    );

    const result = await getClinicalHistoryByPatientId("patient-empty");

    assert.equal(result.patientId, "patient-empty");
    assert.equal(result.rangeYears, 5);
    assert.equal(result.empty, true);
    assert.equal(result.items.length, 0);
    assert.match(result.message, /No se encontro historial clinico/i);
    assert.equal(tracker.calls.length, 1);
});

test("el flujo historico solo expone operacion GET y no agrega edicion", () => {
    const historyLayer = consultationRouter.stack.find(
        (layer) => layer.route?.path === "/patient/:patientId/history"
    );

    assert.ok(historyLayer, "La ruta de historial clinico debe existir.");
    assert.equal(historyLayer.route.methods.get, true);
    assert.equal(historyLayer.route.methods.post, undefined);
    assert.equal(historyLayer.route.methods.put, undefined);
    assert.equal(historyLayer.route.methods.patch, undefined);
    assert.equal(historyLayer.route.methods.delete, undefined);
});
