import { db } from "../config/db.js";
import { medicalConsultations, prescribedMedications, preclinicalRecords, users } from "../models/schema.js";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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

    const consultationId = uuidv4();
    await tx.insert(medicalConsultations).values({
        id: consultationId,
        preclinicalId: preclinicalId,
        patientId: preclinical.patientId,
        doctorId: doctorId,
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
    await tx.update(preclinicalRecords)
        .set({
            status: "done",
            bloodPressure: data.bloodPressure !== undefined ? data.bloodPressure : preclinical.bloodPressure,
            temperature: data.temperature !== undefined ? data.temperature : preclinical.temperature,
            weight: data.weight !== undefined ? data.weight : preclinical.weight,
            height: data.height !== undefined ? data.height : preclinical.height,
            heartRate: data.heartRate !== undefined ? data.heartRate : preclinical.heartRate,
            oxygenSaturation: data.oxygenSaturation !== undefined ? data.oxygenSaturation : preclinical.oxygenSaturation,
            bmi: data.bmi !== undefined ? data.bmi : preclinical.bmi,
            updatedAt: new Date(),
        })
        .where(eq(preclinicalRecords.id, preclinicalId));

    return { consultationId, message: "Consulta guardada exitosamente" };
    });
};
export const getConsultationByPreclinicalId = async (preclinicalId) => {
    const [consultation] = await db
        .select()
        .from(medicalConsultations)
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
    return {
        ...consultation,
        receta: medications, 
    };
};

export const getClinicalHistoryByPatientId = async (patientId) => {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    // Trae las consultas historicas del paciente con su medico responsable.
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
        })
        .from(medicalConsultations)
        .leftJoin(users, eq(medicalConsultations.doctorId, users.id))
        .leftJoin(preclinicalRecords, eq(medicalConsultations.preclinicalId, preclinicalRecords.id))
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
        medications: medicationsByConsultation.get(row.consultationId) || [],
    }));

    return {
        patientId,
        rangeYears: 5,
        empty: false,
        items,
    };
};
