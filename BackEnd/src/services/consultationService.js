import { db } from "../config/db.js";
import { medicalConsultations, prescribedMedications, preclinicalRecords } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
    if (data.receta && data.receta.length > 0) {
        const medsToInsert = data.receta.map((med) => ({
            id: uuidv4(),
            consultationId: consultationId,
            name: med.nombre,
            concentration: med.concentracion || null,
            concentrationUnit: med.unidadConcentracion || null,
            dose: med.dosis || null,
            doseUnit: med.unidadDosis || null,
            route: med.via || null,
            frequency: med.frecuencia || null,
            duration: med.duracion || null,
            additionalInstructions: med.indicaciones || null,
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