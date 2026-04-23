import { db } from "../config/db.js";
import { insurers } from "../models/schema.js";
import { asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const normalizeNullable = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    return String(value).trim();
};

const normalizeAmount = (value) => {
    if (value === "" || value === undefined || value === null) {
        const error = new Error("El monto fijo prenegociado es obligatorio.");
        error.status = 400;
        throw error;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
        const error = new Error("El monto fijo prenegociado debe ser un numero mayor a 0.");
        error.status = 400;
        throw error;
    }

    return parsed.toFixed(2);
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modificada para permitir validaciones parciales en actualizaciones si fuera necesario
export const validateInsurerPayload = (data = {}) => {
    const companyName = normalizeNullable(data.companyName);
    const contactName = normalizeNullable(data.contactName);
    const phone = normalizeNullable(data.phone);
    const email = normalizeNullable(data.email);
    const status = normalizeNullable(data.status) || 'active'; // Por defecto activa

    if (!companyName) {
        const error = new Error("El nombre de la compania es obligatorio.");
        error.status = 400;
        throw error;
    }

    if (!contactName) {
        const error = new Error("El contacto encargado es obligatorio.");
        error.status = 400;
        throw error;
    }

    if (!phone) {
        const error = new Error("El telefono es obligatorio.");
        error.status = 400;
        throw error;
    }

    if (!email) {
        const error = new Error("El correo electronico es obligatorio.");
        error.status = 400;
        throw error;
    }

    if (!emailRegex.test(email)) {
        const error = new Error("El correo electronico no tiene un formato valido.");
        error.status = 400;
        throw error;
    }

    return {
        companyName,
        contactName,
        phone,
        email: email.toLowerCase(),
        fixedConsultationAmount: normalizeAmount(data.fixedConsultationAmount),
        status: status === 'inactive' ? 'inactive' : 'active' // Validar que solo entren estados permitidos
    };
};

export const createInsurer = async (data) => {
    const payload = validateInsurerPayload(data);
    const insurerId = uuidv4();

    await db.insert(insurers).values({
        id: insurerId,
        ...payload,
    });

    return {
        id: insurerId,
        ...payload,
    };
};

// --- NUEVA FUNCIÓN: UPDATE ---
export const updateInsurer = async (id, data) => {
    // Primero verificamos que exista
    const existing = await getInsurerById(id);

    // Si solo estamos actualizando el status (patch), no validamos todo el payload
    // Si estamos actualizando datos generales, validamos
    let payload;
    if (Object.keys(data).length === 1 && data.status) {
        payload = { status: data.status === 'inactive' ? 'inactive' : 'active' };
    } else {
        payload = validateInsurerPayload({ ...existing, ...data });
    }

    await db.update(insurers)
        .set({
            ...payload,
            updatedAt: new Date() // Forzamos el update de la fecha si es necesario
        })
        .where(eq(insurers.id, id));

    return { id, ...payload };
};

export const getInsurers = async () => {
    return await db
        .select()
        .from(insurers)
        .orderBy(asc(insurers.companyName));
};

export const getInsurerById = async (id) => {
    const [insurer] = await db
        .select()
        .from(insurers)
        .where(eq(insurers.id, id))
        .limit(1);

    if (!insurer) {
        const error = new Error("Aseguradora no encontrada.");
        error.status = 404;
        throw error;
    }

    return insurer;
};