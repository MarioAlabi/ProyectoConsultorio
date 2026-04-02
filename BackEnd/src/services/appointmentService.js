import { db } from "../config/db.js";
import { appointments, patients } from "../models/schema.js";
import { eq, and, gte, lte, ne, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Helper: chequear si ya hay una cita activa en esa fecha+hora (excluyendo un id opcional)
const checkTimeConflict = async (date, time, excludeId = null) => {
    const conditions = [
        eq(appointments.date, date),
        eq(appointments.time, time),
        ne(appointments.status, "cancelled"),
    ];
    if (excludeId) {
        conditions.push(ne(appointments.id, excludeId));
    }

    const [existing] = await db
        .select({ id: appointments.id, patientName: patients.fullName })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(and(...conditions))
        .limit(1);

    return existing || null;
};

export const createAppointment = async (data, userId) => {
    const { patientId, date, time, reason } = data;

    if (!patientId || !date || !time) {
        const error = new Error("Paciente, fecha y hora son obligatorios.");
        error.status = 400;
        throw error;
    }

    // CA-07: No permitir citas en fechas pasadas
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
        const error = new Error("No se pueden agendar citas en fechas pasadas.");
        error.status = 400;
        throw error;
    }

    // Verificar que el paciente existe
    const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

    if (!patient) {
        const error = new Error("El paciente no existe.");
        error.status = 404;
        throw error;
    }

    // CA-03: Evitar overbooking - no permitir dos citas en la misma fecha+hora
    const conflict = await checkTimeConflict(date, time);
    if (conflict) {
        const error = new Error(
            `Ya existe una cita a las ${time} del ${date} (paciente: ${conflict.patientName || "desconocido"}). Seleccione otro horario.`
        );
        error.status = 409;
        throw error;
    }

    const newId = uuidv4();

    await db.insert(appointments).values({
        id: newId,
        patientId,
        date,
        time,
        reason: reason || null,
        status: "scheduled",
        createdByUserId: userId,
    });

    return { id: newId };
};

// CA-03: Obtener citas por fecha o rango de fechas
export const getAppointmentsByDate = async (dateStr) => {
    if (!dateStr) {
        const error = new Error("La fecha es obligatoria.");
        error.status = 400;
        throw error;
    }

    const rows = await db
        .select({
            id: appointments.id,
            patientId: appointments.patientId,
            patientName: patients.fullName,
            date: appointments.date,
            time: appointments.time,
            reason: appointments.reason,
            status: appointments.status,
            createdAt: appointments.createdAt,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(eq(appointments.date, dateStr))
        .orderBy(appointments.time);

    return rows;
};

// Obtener citas en un rango de fechas (para vista mensual/semanal)
export const getAppointmentsByRange = async (from, to) => {
    if (!from || !to) {
        const error = new Error("Los parametros 'from' y 'to' son obligatorios.");
        error.status = 400;
        throw error;
    }

    const rows = await db
        .select({
            id: appointments.id,
            patientId: appointments.patientId,
            patientName: patients.fullName,
            date: appointments.date,
            time: appointments.time,
            reason: appointments.reason,
            status: appointments.status,
            createdAt: appointments.createdAt,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(and(gte(appointments.date, from), lte(appointments.date, to)))
        .orderBy(appointments.date, appointments.time);

    return rows;
};

// CA-04 y CA-05: Cambiar estado de la cita
export const updateAppointmentStatus = async (id, newStatus) => {
    const validStatuses = ["scheduled", "present", "cancelled", "done"];
    if (!validStatuses.includes(newStatus)) {
        const error = new Error(`Estado invalido. Debe ser: ${validStatuses.join(", ")}`);
        error.status = 400;
        throw error;
    }

    const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id))
        .limit(1);

    if (!appointment) {
        const error = new Error("Cita no encontrada.");
        error.status = 404;
        throw error;
    }

    // Validar transiciones de estado validas
    const allowedTransitions = {
        scheduled: ["present", "cancelled"],
        present: ["done", "cancelled"],
        cancelled: [],
        done: [],
    };

    if (!allowedTransitions[appointment.status]?.includes(newStatus)) {
        const error = new Error(
            `No se puede cambiar de "${appointment.status}" a "${newStatus}".`
        );
        error.status = 400;
        throw error;
    }

    await db
        .update(appointments)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(appointments.id, id));

    return { id, status: newStatus };
};

// Editar detalles de una cita (fecha, hora, motivo)
export const updateAppointment = async (id, data) => {
    const { date, time, reason } = data;

    const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id))
        .limit(1);

    if (!appointment) {
        const error = new Error("Cita no encontrada.");
        error.status = 404;
        throw error;
    }

    // Solo se pueden editar citas programadas
    if (appointment.status !== "scheduled") {
        const error = new Error("Solo se pueden editar citas con estado 'programada'.");
        error.status = 400;
        throw error;
    }

    const newDate = date || appointment.date;
    const newTime = time || appointment.time;

    // No permitir fechas pasadas
    const today = new Date().toISOString().split("T")[0];
    const dateStr = typeof newDate === "string" ? newDate.split("T")[0] : newDate;
    if (dateStr < today) {
        const error = new Error("No se pueden reprogramar citas a fechas pasadas.");
        error.status = 400;
        throw error;
    }

    // Verificar conflicto de horario (excluyendo esta misma cita)
    if (date || time) {
        const conflict = await checkTimeConflict(dateStr, newTime, id);
        if (conflict) {
            const error = new Error(
                `Ya existe una cita a las ${newTime} del ${dateStr} (paciente: ${conflict.patientName || "desconocido"}). Seleccione otro horario.`
            );
            error.status = 409;
            throw error;
        }
    }

    const updateData = { updatedAt: new Date() };
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (reason !== undefined) updateData.reason = reason || null;

    await db.update(appointments).set(updateData).where(eq(appointments.id, id));

    return { id, date: dateStr, time: newTime };
};

export const bulkCancelAppointments = async (data) => {
    const { date, ids } = data;

    if (!date && (!ids || ids.length === 0)) {
        const error = new Error("Debe proporcionar una fecha o una lista de IDs de citas.");
        error.status = 400;
        throw error;
    }

    let conditions;

    if (ids && ids.length > 0) {
        conditions = and(
            inArray(appointments.id, ids),
            eq(appointments.status, "scheduled")
        );
    } else {
        conditions = and(
            eq(appointments.date, date),
            eq(appointments.status, "scheduled")
        );
    }

    const result = await db
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(conditions);

    return { cancelledCount: result[0]?.affectedRows || 0 };
};
