import { db } from "../config/db.js";
import { patients } from "../models/schema.js";
import { eq, and, ne, or, like } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export const registerPatient = async (data) => {
    const duiRegex = /^\d{8}-\d{1}$/;
    if (!duiRegex.test(data.identityDocument)) {
        const error = new Error("El formato del DUI debe ser 12345678-9");
        error.status = 400;
        throw error;
    }
    if (!data.isMinor) {
        const [existingAdult] = await db.select()
            .from(patients)
            .where(and(
                eq(patients.identityDocument, data.identityDocument),
                eq(patients.isMinor, 0) 
            ))
            .limit(1);

        if (existingAdult) {
            const error = new Error("Ya existe un paciente adulto registrado con este documento.");
            error.status = 409;
            throw error;
        }
    }
    const year = new Date().getFullYear();
    const fileNumber = `EXP-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = uuidv4();

    await db.insert(patients).values({
        id: newId,
        fullName: data.fullName,
        yearOfBirth: data.dateOfBirth,
        identityDocument: data.identityDocument,
        gender: data.gender,
        phone: data.phone || null,
        address: data.address || null,
        fileNumber: fileNumber,
        isMinor: data.isMinor ? 1 : 0,
        responsibleName: data.isMinor ? data.responsibleName : null,
        personalHistory: data.personalHistory || null,
        familyHistory: data.familyHistory || null,
        insurerId: data.insurerId && String(data.insurerId).trim().length > 0 ? data.insurerId : null,
        status: "active"
    });
    return { id: newId, fileNumber };
};
export const getAllPatients = async (searchQuery = "") => {
    if (searchQuery) {
        return await db.select().from(patients).where(
            or(
                like(patients.fullName, `%${searchQuery}%`),
                like(patients.identityDocument, `%${searchQuery}%`),
                like(patients.fileNumber, `%${searchQuery}%`)
            )
        );
    }
    return await db.select().from(patients);
};
export const getPatientById = async (id) => {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    
    if (!patient) {
        const error = new Error("Patient not found.");
        error.status = 404;
        throw error;
    }
    return patient;
};
export const updatePatient = async (id, updateData) => {
    
    const [currentPatient] = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    
    if (!currentPatient) {
        const error = new Error("Paciente no encontrado.");
        error.status = 404;
        throw error;
    }
    const isMinor = updateData.isMinor !== undefined ? updateData.isMinor : currentPatient.isMinor;

    if (!isMinor) {
        const [duiConflict] = await db.select()
            .from(patients)
            .where(and(
                eq(patients.identityDocument, updateData.identityDocument || currentPatient.identityDocument),
                eq(patients.isMinor, 0),
                ne(patients.id, id) 
            ))
            .limit(1);

        if (duiConflict) {
            const error = new Error("El DUI ingresado ya pertenece a otro paciente adulto.");
            error.status = 409;
            throw error;
        }
    }
    const finalUpdate = {
        ...updateData,
        yearOfBirth: updateData.dateOfBirth || currentPatient.yearOfBirth,
        personalHistory: updateData.personalHistory || currentPatient.personalHistory,
        familyHistory: updateData.familyHistory || currentPatient.familyHistory,
        responsibleName: isMinor ? (updateData.responsibleName || currentPatient.responsibleName) : null,
        updatedAt: new Date()
    };
    // Normaliza insurerId: cadena vacía -> null (desvincular aseguradora).
    if (updateData.insurerId !== undefined) {
        const trimmed = typeof updateData.insurerId === "string" ? updateData.insurerId.trim() : updateData.insurerId;
        finalUpdate.insurerId = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    delete finalUpdate.dateOfBirth;
    await db.update(patients)
        .set(finalUpdate)
        .where(eq(patients.id, id));

    return { id, message: "Información actualizada correctamente" };
};
export const setPatientStatus = async (id, newStatus) => {
    await getPatientById(id);

    await db.update(patients)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(patients.id, id));

    return { id, status: newStatus };
};
