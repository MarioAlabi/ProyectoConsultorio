import { db } from "../config/db.js";
import { insurers, medicalConsultations, patients, prescribedMedications, preclinicalRecords, users } from "../models/schema.js";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getInsurerById } from "./insurerService.js";

export const normalizePrescribedMedications = (data = {}) => {
    const source = Array.isArray(data.medicamentos)
        ? data.medicamentos
        : Array.isArray(data.receta)
            ? data.receta
            : [];

    // Acepta el formato actual del frontend y el formato legacy "receta".
    return source
        .map((med) => ({
            name: med.name || med.nombre || "",
            concentration: med.concentration || med.concentracion || null,
            concentrationUnit: med.concentrationUnit || med.unidadConcentracion || null,
            dose: med.dose || med.dosis || null,
            doseUnit: med.doseUnit || med.unidadDosis || null,
            route: med.route || med.via || null,
            frequency: med.frequency || med.frecuencia || null,
            duration: med.duration || med.duracion || null,
            additionalInstructions: med.additionalInstructions || med.indicaciones || null,
        }))
        .filter((med) => med.name.trim().length > 0);
};

const normalizeBillingType = (billingType) => {
    if (typeof billingType !== "string" || billingType.trim().length === 0) {
        return "private";
    }

    const normalized = billingType.trim().toLowerCase();
    if (normalized === "particular" || normalized === "normal") return "private";
    if (normalized === "aseguradora") return "insurance";
    return normalized;
};

const normalizeAmount = (value) => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
    }

    if (typeof value !== "string") {
        return NaN;
    }

    const cleaned = value.replace(/\$/g, "").replace(/,/g, "").trim();
    if (!cleaned) return NaN;

    return Number(cleaned);
};

const resolveConsultationCoverage = async (data = {}) => {
    const billingType = normalizeBillingType(data.billingType);

    if (!["private", "insurance"].includes(billingType)) {
        const error = new Error("El tipo de atencion debe ser 'Normal' o 'Aseguradora'.");
        error.status = 400;
        throw error;
    }

    if (billingType === "private") {
        return {
            insurerId: null,
            agreedAmount: null,
            billingType: "private",
        };
    }

    const insurerId = typeof data.insurerId === "string" ? data.insurerId.trim() : "";
    if (!insurerId) {
        const error = new Error("Debe seleccionar una aseguradora para esta consulta.");
        error.status = 400;
        throw error;
    }

    const insurer = await getInsurerById(insurerId);
    const customAgreedAmount = data.agreedAmount;
    const hasCustomAgreedAmount =
        customAgreedAmount !== undefined &&
        customAgreedAmount !== null &&
        `${customAgreedAmount}`.trim().length > 0;

    let agreedAmount = insurer.fixedConsultationAmount;
    if (hasCustomAgreedAmount) {
        const parsedAmount = normalizeAmount(customAgreedAmount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            const error = new Error("El monto cubierto por la aseguradora debe ser mayor que cero.");
            error.status = 400;
            throw error;
        }

        agreedAmount = parsedAmount.toFixed(2);
    }

    return {
        insurerId: insurer.id,
        agreedAmount,
        billingType: "insurance",
    };
};

const buildDateRange = (from, to) => {
    if (!from || !to) {
        const error = new Error("Las fechas desde y hasta son obligatorias.");
        error.status = 400;
        throw error;
    }

    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        const error = new Error("El rango de fechas no tiene un formato valido.");
        error.status = 400;
        throw error;
    }

    if (fromDate > toDate) {
        const error = new Error("La fecha inicial no puede ser mayor que la fecha final.");
        error.status = 400;
        throw error;
    }

    return {
        fromDate,
        toDate,
        fromDateTime: `${from} 00:00:00`,
        toDateTime: `${to} 23:59:59`,
    };
};

export const createMedicalConsultation = async (preclinicalId, data, doctorId) => {
    return await db.transaction(async (tx) => {
    const [preclinical] = await tx
        .select()
        .from(preclinicalRecords)
        .where(eq(preclinicalRecords.id, preclinicalId))
        .limit(1);

    if (!preclinical) {
        const error = new Error("Registro de pre-clínica no encontrado.");
        error.status = 404;
        throw error;
    }
    const consultationCoverage = await resolveConsultationCoverage(data);

    const consultationId = uuidv4();
    await tx.insert(medicalConsultations).values({
        id: consultationId,
        preclinicalId: preclinicalId,
        patientId: preclinical.patientId,
        insurerId: consultationCoverage.insurerId,
        doctorId: doctorId,
        agreedAmount: consultationCoverage.agreedAmount,
        anamnesis: data.anamnesis || null,
        physicalExam: data.physicalExam || null,
        diagnosis: data.diagnosis || null,
        labResults: data.labResults || null,
        observations: data.observations || null,
        documents: data.documents || null, 
    });

    const medications = normalizePrescribedMedications(data);
    if (medications.length > 0) {
        const medsToInsert = medications.map((med) => ({
            id: uuidv4(),
            consultationId: consultationId,
            name: med.name.trim(),
            concentration: med.concentration,
            concentrationUnit: med.concentrationUnit,
            dose: med.dose,
            doseUnit: med.doseUnit,
            route: med.route,
            frequency: med.frequency,
            duration: med.duration,
            additionalInstructions: med.additionalInstructions,
            }));
        await tx.insert(prescribedMedications).values(medsToInsert);
    }
    const sanitizeValue = (val) => (val === "" || val === null ? null : val);

    await tx.update(preclinicalRecords)
        .set({
            status: "done",
            
            bloodPressure: data.bloodPressure !== undefined ? sanitizeValue(data.bloodPressure) : preclinical.bloodPressure,
            temperature: data.temperature !== undefined ? sanitizeValue(data.temperature) : preclinical.temperature,
            weight: data.weight !== undefined ? sanitizeValue(data.weight) : preclinical.weight,
            height: data.height !== undefined ? sanitizeValue(data.height) : preclinical.height,
            heartRate: data.heartRate !== undefined ? sanitizeValue(data.heartRate) : preclinical.heartRate,
            oxygenSaturation: data.oxygenSaturation !== undefined ? sanitizeValue(data.oxygenSaturation) : preclinical.oxygenSaturation,
            bmi: data.bmi !== undefined ? sanitizeValue(data.bmi) : preclinical.bmi,
            updatedAt: new Date(),
        })
        .where(eq(preclinicalRecords.id, preclinicalId));

    return {
        consultationId,
        message: "Consulta guardada exitosamente",
        insurerId: consultationCoverage.insurerId,
        agreedAmount: consultationCoverage.agreedAmount === null ? null : Number(consultationCoverage.agreedAmount),
        billingType: consultationCoverage.billingType,
    };
    });
};
export const getConsultationByPreclinicalId = async (preclinicalId) => {
    const [consultation] = await db
        .select({
            id: medicalConsultations.id,
            preclinicalId: medicalConsultations.preclinicalId,
            patientId: medicalConsultations.patientId,
            doctorId: medicalConsultations.doctorId,
            insurerId: medicalConsultations.insurerId,
            agreedAmount: medicalConsultations.agreedAmount,
            anamnesis: medicalConsultations.anamnesis,
            physicalExam: medicalConsultations.physicalExam,
            diagnosis: medicalConsultations.diagnosis,
            labResults: medicalConsultations.labResults,
            observations: medicalConsultations.observations,
            documents: medicalConsultations.documents,
            createdAt: medicalConsultations.createdAt,
            updatedAt: medicalConsultations.updatedAt,
            insurerCompanyName: insurers.companyName,
        })
        .from(medicalConsultations)
        .leftJoin(insurers, eq(medicalConsultations.insurerId, insurers.id))
        .where(eq(medicalConsultations.preclinicalId, preclinicalId))
        .limit(1);

    if (!consultation) {
        const error = new Error("No se encontró el detalle de la consulta para este registro.");
        error.status = 404;
        throw error;
    }
    const medications = await db
        .select()
        .from(prescribedMedications)
        .where(eq(prescribedMedications.consultationId, consultation.id));
    const { insurerCompanyName, ...consultationData } = consultation;

    return {
        ...consultationData,
        insurer: consultationData.insurerId ? {
            id: consultationData.insurerId,
            companyName: insurerCompanyName,
        } : null,
        receta: medications, 
    };
};

export const getClinicalHistoryByPatientId = async (patientId) => {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    // Trae las consultas historicas del paciente con su medico responsable y cobertura aplicada.
    const consultationRows = await db
        .select({
            consultationId: medicalConsultations.id,
            anamnesis: medicalConsultations.anamnesis,
            physicalExam: medicalConsultations.physicalExam,
            diagnosis: medicalConsultations.diagnosis,
            labResults: medicalConsultations.labResults,
            observations: medicalConsultations.observations,
            consultationDate: medicalConsultations.createdAt,
            reason: preclinicalRecords.motivo,
            status: preclinicalRecords.status,
            doctorId: medicalConsultations.doctorId,
            doctorName: users.name,
            insurerId: medicalConsultations.insurerId,
            insurerName: insurers.companyName,
            agreedAmount: medicalConsultations.agreedAmount,
        })
        .from(medicalConsultations)
        .leftJoin(users, eq(medicalConsultations.doctorId, users.id))
        .leftJoin(preclinicalRecords, eq(medicalConsultations.preclinicalId, preclinicalRecords.id))
        .leftJoin(insurers, eq(medicalConsultations.insurerId, insurers.id))
        .where(
            and(
                eq(medicalConsultations.patientId, patientId),
                gte(medicalConsultations.createdAt, fiveYearsAgo)
            )
        )
        .orderBy(desc(medicalConsultations.createdAt));

    if (consultationRows.length === 0) {
        return {
            patientId,
            rangeYears: 5,
            empty: true,
            message: "No se encontro historial clinico para este paciente en los ultimos 5 anos.",
            items: [],
        };
    }

    const consultationIds = consultationRows.map((row) => row.consultationId);

    // Obtiene todos los medicamentos asociados a las consultas del rango.
    const medicationRows = await db
        .select({
            id: prescribedMedications.id,
            consultationId: prescribedMedications.consultationId,
            name: prescribedMedications.name,
            concentration: prescribedMedications.concentration,
            concentrationUnit: prescribedMedications.concentrationUnit,
            dose: prescribedMedications.dose,
            doseUnit: prescribedMedications.doseUnit,
            route: prescribedMedications.route,
            frequency: prescribedMedications.frequency,
            duration: prescribedMedications.duration,
            additionalInstructions: prescribedMedications.additionalInstructions,
        })
        .from(prescribedMedications)
        .where(inArray(prescribedMedications.consultationId, consultationIds));

    const medicationsByConsultation = new Map();
    for (const medication of medicationRows) {
        const current = medicationsByConsultation.get(medication.consultationId) || [];
        current.push(medication);
        medicationsByConsultation.set(medication.consultationId, current);
    }

    // Devuelve solo campos de lectura para evitar reutilizar este flujo como edicion.
    const items = consultationRows.map((row) => ({
        consultationId: row.consultationId,
        anamnesis: row.anamnesis,
        physicalExam: row.physicalExam,
        diagnosis: row.diagnosis,
        labResults: row.labResults,
        observations: row.observations,
        consultationDate: row.consultationDate,
        reason: row.reason,
        status: row.status,
        doctor: {
            id: row.doctorId,
            name: row.doctorName || "Medico no disponible",
        },
        coverage: row.insurerId
            ? {
                type: "insurance",
                insurerId: row.insurerId,
                insurerName: row.insurerName || "Aseguradora no disponible",
                agreedAmount: row.agreedAmount === null ? null : Number(row.agreedAmount),
            }
            : {
                type: "private",
                insurerId: null,
                insurerName: null,
                agreedAmount: null,
            },
        medications: medicationsByConsultation.get(row.consultationId) || [],
    }));

    return {
        patientId,
        rangeYears: 5,
        empty: false,
        items,
    };
};

export const getInsurerConsultationReport = async ({ insurerId, from, to }) => {
    if (!insurerId) {
        const error = new Error("La aseguradora es obligatoria.");
        error.status = 400;
        throw error;
    }

    const insurer = await getInsurerById(insurerId);
    const { fromDateTime, toDateTime } = buildDateRange(from, to);

    const rows = await db
        .select({
            consultationId: medicalConsultations.id,
            consultationDate: medicalConsultations.createdAt,
            patientId: patients.id,
            patientName: patients.fullName,
            identityDocument: patients.identityDocument,
            diagnosis: medicalConsultations.diagnosis,
            agreedAmount: medicalConsultations.agreedAmount,
        })
        .from(medicalConsultations)
        .leftJoin(patients, eq(medicalConsultations.patientId, patients.id))
        .where(
            and(
                eq(medicalConsultations.insurerId, insurerId),
                gte(medicalConsultations.createdAt, sql`${fromDateTime}`),
                lte(medicalConsultations.createdAt, sql`${toDateTime}`)
            )
        )
        .orderBy(asc(medicalConsultations.createdAt));

    const items = rows.map((row) => ({
        consultationId: row.consultationId,
        consultationDate: row.consultationDate,
        patientId: row.patientId,
        patientName: row.patientName,
        identityDocument: row.identityDocument,
        diagnosis: row.diagnosis,
        agreedAmount: row.agreedAmount,
    }));

    const totalAmount = items.reduce((sum, item) => sum + Number(item.agreedAmount || 0), 0);

    return {
        insurer: {
            id: insurer.id,
            companyName: insurer.companyName,
            fixedConsultationAmount: insurer.fixedConsultationAmount,
        },
        filters: { from, to },
        empty: items.length === 0,
        items,
        summary: {
            totalPatients: items.length,
            totalAmount: totalAmount.toFixed(2),
        },
    };
};
