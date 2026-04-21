import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/config/db.js";
import consultationRouter from "../src/routes/consultationRoutes.js";
import { createMedicalConsultation, getClinicalHistoryByPatientId, getInsurerConsultationReport, normalizePrescribedMedications } from "../src/services/consultationService.js";
import { createInsurer } from "../src/services/insurerService.js";

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

    let selectCall = 0;
    const tx = {
        select() {
            selectCall += 1;
            return {
                from() {
                    return this;
                },
                leftJoin() {
                    return this;
                },
                where() {
                    return this;
                },
                limit() {
                    if (selectCall === 1) {
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
                    }

                    return Promise.resolve([
                        {
                            patientId: "patient-1",
                            insurerId: "insurer-1",
                            insurerCompanyName: "Seguros Vida",
                            fixedConsultationAmount: "25.00",
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
    assert.equal(inserted.consultation.insurerId, "insurer-1");
    assert.equal(inserted.consultation.agreedAmount, "25.00");
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

test("crea aseguradoras con los campos requeridos", async (t) => {
    const originalInsert = db.insert;
    t.after(() => {
        db.insert = originalInsert;
    });

    let inserted = null;
    db.insert = () => ({
        values(values) {
            inserted = values;
            return Promise.resolve();
        },
    });

    const result = await createInsurer({
        companyName: "Seguros Vida",
        contactName: "Ana Lopez",
        phone: "7777-8888",
        email: "contacto@segurosvida.com",
        fixedConsultationAmount: "25",
    });

    assert.ok(result.id);
    assert.equal(inserted.companyName, "Seguros Vida");
    assert.equal(inserted.contactName, "Ana Lopez");
    assert.equal(inserted.email, "contacto@segurosvida.com");
    assert.equal(inserted.fixedConsultationAmount, "25.00");
});

test("valida que la aseguradora tenga correo valido", async () => {
    await assert.rejects(
        () => createInsurer({
            companyName: "Seguros Vida",
            contactName: "Ana Lopez",
            phone: "7777-8888",
            email: "correo-invalido",
            fixedConsultationAmount: "25.00",
        }),
        (error) => {
            assert.equal(error.status, 400);
            assert.match(error.message, /correo electronico/i);
            return true;
        }
    );
});

test("valida que el monto fijo sea mayor a cero", async () => {
    await assert.rejects(
        () => createInsurer({
            companyName: "Seguros Vida",
            contactName: "Ana Lopez",
            phone: "7777-8888",
            email: "contacto@segurosvida.com",
            fixedConsultationAmount: "0",
        }),
        (error) => {
            assert.equal(error.status, 400);
            assert.match(error.message, /monto fijo prenegociado/i);
            return true;
        }
    );
});

test("genera reporte filtrado por aseguradora y rango de fechas", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    const tracker = { calls: [] };
    db.select = createSelectStub(
        [
            {
                rows: [
                    {
                        id: "insurer-1",
                        companyName: "Seguros Vida",
                        fixedConsultationAmount: "25.00",
                    },
                ],
            },
            {
                resolveOn: "orderBy",
                rows: [
                    {
                        consultationId: "consult-1",
                        consultationDate: new Date("2026-04-05T10:00:00.000Z"),
                        patientId: "patient-1",
                        patientName: "Juan Perez",
                        identityDocument: "12345678-9",
                        diagnosis: "Hipertension arterial",
                        agreedAmount: "25.00",
                    },
                    {
                        consultationId: "consult-2",
                        consultationDate: new Date("2026-04-08T09:15:00.000Z"),
                        patientId: "patient-2",
                        patientName: "Maria Lopez",
                        identityDocument: "98765432-1",
                        diagnosis: "Gastritis",
                        agreedAmount: "25.00",
                    },
                ],
            },
        ],
        tracker
    );

    const result = await getInsurerConsultationReport({
        insurerId: "insurer-1",
        from: "2026-04-01",
        to: "2026-04-30",
    });

    assert.equal(result.insurer.companyName, "Seguros Vida");
    assert.equal(result.empty, false);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].patientName, "Juan Perez");
    assert.equal(result.items[1].identityDocument, "98765432-1");
    assert.equal(result.summary.totalPatients, 2);
    assert.equal(result.summary.totalAmount, "50.00");
    assert.equal(tracker.calls.length, 2);
});

test("retorna reporte vacio cuando no hay consultas para la aseguradora", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    db.select = createSelectStub(
        [
            {
                rows: [
                    {
                        id: "insurer-empty",
                        companyName: "Aseguradora Vacia",
                        fixedConsultationAmount: "30.00",
                    },
                ],
            },
            {
                resolveOn: "orderBy",
                rows: [],
            },
        ],
        { calls: [] }
    );

    const result = await getInsurerConsultationReport({
        insurerId: "insurer-empty",
        from: "2026-04-01",
        to: "2026-04-30",
    });

    assert.equal(result.empty, true);
    assert.deepEqual(result.items, []);
    assert.equal(result.summary.totalPatients, 0);
    assert.equal(result.summary.totalAmount, "0.00");
});

test("rechaza reporte sin aseguradora", async () => {
    await assert.rejects(
        () => getInsurerConsultationReport({
            insurerId: "",
            from: "2026-04-01",
            to: "2026-04-30",
        }),
        (error) => {
            assert.equal(error.status, 400);
            assert.match(error.message, /aseguradora es obligatoria/i);
            return true;
        }
    );
});

test("rechaza reporte con rango de fechas invalido", async (t) => {
    const originalSelect = db.select;
    t.after(() => {
        db.select = originalSelect;
    });

    db.select = createSelectStub(
        [
            {
                rows: [
                    {
                        id: "insurer-1",
                        companyName: "Seguros Vida",
                        fixedConsultationAmount: "25.00",
                    },
                ],
            },
        ],
        { calls: [] }
    );

    await assert.rejects(
        () => getInsurerConsultationReport({
            insurerId: "insurer-1",
            from: "2026-04-30",
            to: "2026-04-01",
        }),
        (error) => {
            assert.equal(error.status, 400);
            assert.match(error.message, /fecha inicial/i);
            return true;
        }
    );
});

test("regla de negocio: consulta particular se guarda sin aseguradora ni monto", async (t) => {
    const originalTransaction = db.transaction;
    t.after(() => {
        db.transaction = originalTransaction;
    });

    const inserted = {
        consultation: null,
    };

    let selectCall = 0;
    const tx = {
        select() {
            selectCall += 1;
            return {
                from() {
                    return this;
                },
                leftJoin() {
                    return this;
                },
                where() {
                    return this;
                },
                limit() {
                    if (selectCall === 1) {
                        return Promise.resolve([
                            {
                                id: "preclinical-particular",
                                patientId: "patient-particular",
                                bloodPressure: "120/80",
                                temperature: "36.5",
                                weight: "160",
                                height: "1.70",
                                heartRate: 80,
                                oxygenSaturation: 98,
                                bmi: "25.0",
                            },
                        ]);
                    }

                    return Promise.resolve([
                        {
                            patientId: "patient-particular",
                            insurerId: null,
                            insurerCompanyName: null,
                            fixedConsultationAmount: null,
                        },
                    ]);
                },
            };
        },
        insert() {
            return {
                values(values) {
                    if (!Array.isArray(values)) {
                        inserted.consultation = values;
                    }
                    return Promise.resolve();
                },
            };
        },
        update() {
            return {
                set() {
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

    await createMedicalConsultation(
        "preclinical-particular",
        {
            anamnesis: "Control general",
            diagnosis: "Paciente estable",
            medicamentos: [],
        },
        "doctor-1"
    );

    assert.equal(inserted.consultation.insurerId, null);
    assert.equal(inserted.consultation.agreedAmount, null);
});

test("expone la ruta de reporte por aseguradora como solo lectura", () => {
    const reportLayer = consultationRouter.stack.find(
        (layer) => layer.route?.path === "/reports/by-insurer"
    );

    assert.ok(reportLayer, "La ruta de reporte por aseguradora debe existir.");
    assert.equal(reportLayer.route.methods.get, true);
    assert.equal(reportLayer.route.methods.post, undefined);
    assert.equal(reportLayer.route.methods.put, undefined);
    assert.equal(reportLayer.route.methods.patch, undefined);
    assert.equal(reportLayer.route.methods.delete, undefined);
});
