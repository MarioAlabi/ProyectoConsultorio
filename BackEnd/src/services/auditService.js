import { db } from "../config/db.js";
import { auditLogs, users, patients } from "../models/schema.js";
import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Nombres legibles para las tablas auditadas.
 */
const TABLE_LABELS = {
    patients: "Paciente",
    preclinical_records: "Registro Pre-clínico",
    medical_consultations: "Consulta Médica",
    prescribed_medications: "Medicamento Recetado",
    insurers: "Aseguradora",
    appointments: "Cita",
};

/**
 * Nombres legibles para las acciones.
 */
const ACTION_LABELS = {
    CREATE: "Creación",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    STATUS_CHANGE: "Cambio de Estado",
};

/**
 * Registra una entrada de auditoría. Esta función es fire-and-forget:
 * no lanza errores para no interrumpir la operación principal.
 *
 * @param {object} params
 * @param {string} params.tableName - Nombre de la tabla afectada
 * @param {string} params.recordId - ID del registro afectado
 * @param {"CREATE"|"UPDATE"|"DELETE"|"STATUS_CHANGE"} params.action
 * @param {object} params.user - { id, name, role }
 * @param {object|null} [params.previousValues] - Estado anterior (para UPDATE/STATUS_CHANGE)
 * @param {object|null} [params.newValues] - Estado nuevo
 * @param {string} [params.description] - Descripción legible del cambio
 * @param {string} [params.ipAddress] - IP del cliente
 */
export const logAudit = async ({
    tableName,
    recordId,
    action,
    user,
    previousValues = null,
    newValues = null,
    description = null,
    ipAddress = null,
}) => {
    try {
        await db.insert(auditLogs).values({
            id: uuidv4(),
            tableName,
            recordId,
            action,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousValues: previousValues ? JSON.stringify(previousValues) : null,
            newValues: newValues ? JSON.stringify(newValues) : null,
            description: description || buildDescription(tableName, action, user.name),
            ipAddress,
        });
    } catch (err) {
        console.error("[AuditLog] Error al guardar registro de auditoría:", err.message);
    }
};

/**
 * Construye una descripción automática para el log.
 */
function buildDescription(tableName, action, userName) {
    const tableLabel = TABLE_LABELS[tableName] || tableName;
    const actionLabel = ACTION_LABELS[action] || action;
    return `${actionLabel} de ${tableLabel} por ${userName}`;
}

/**
 * Obtiene los registros de auditoría con filtros y paginación.
 * Solo accesible para administradores.
 *
 * @param {object} filters
 * @param {string} [filters.tableName]
 * @param {string} [filters.action]
 * @param {string} [filters.userId]
 * @param {string} [filters.recordId]
 * @param {string} [filters.search] - Búsqueda por nombre de usuario o descripción
 * @param {string} [filters.from] - Fecha inicio (YYYY-MM-DD)
 * @param {string} [filters.to] - Fecha fin (YYYY-MM-DD)
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=50]
 */
export const getAuditLogs = async (filters = {}) => {
    const {
        tableName,
        action,
        userId,
        recordId,
        search,
        from,
        to,
        page = 1,
        limit = 50,
    } = filters;

    const conditions = [];

    if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (recordId) conditions.push(eq(auditLogs.recordId, recordId));

    if (search) {
        conditions.push(
            or(
                like(auditLogs.userName, `%${search}%`),
                like(auditLogs.description, `%${search}%`)
            )
        );
    }

    if (from) {
        conditions.push(gte(auditLogs.createdAt, sql`${`${from} 00:00:00`}`));
    }
    if (to) {
        conditions.push(lte(auditLogs.createdAt, sql`${`${to} 23:59:59`}`));
    }

    const offset = (page - 1) * limit;
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
        db
            .select({
                id: auditLogs.id,
                tableName: auditLogs.tableName,
                recordId: auditLogs.recordId,
                action: auditLogs.action,
                userId: auditLogs.userId,
                userName: auditLogs.userName,
                userRole: auditLogs.userRole,
                previousValues: auditLogs.previousValues,
                newValues: auditLogs.newValues,
                description: auditLogs.description,
                ipAddress: auditLogs.ipAddress,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .where(whereClause)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql`COUNT(*)` })
            .from(auditLogs)
            .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
        data: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Obtiene el historial de auditoría de un registro específico.
 * Útil para ver toda la trazabilidad de un expediente.
 */
export const getAuditLogsByRecord = async (recordId) => {
    return await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.recordId, recordId))
        .orderBy(desc(auditLogs.createdAt));
};

/**
 * Obtiene el historial completo de auditoría de un paciente (expediente).
 * Incluye logs de todas las tablas relacionadas al paciente.
 */
export const getAuditLogsByPatient = async (patientId) => {
    return await db
        .select()
        .from(auditLogs)
        .where(
            or(
                // Cambios directos en el paciente
                and(
                    eq(auditLogs.tableName, "patients"),
                    eq(auditLogs.recordId, patientId)
                ),
                // Cualquier registro que referencie al paciente via newValues/previousValues
                like(auditLogs.newValues, `%${patientId}%`),
                like(auditLogs.previousValues, `%${patientId}%`)
            )
        )
        .orderBy(desc(auditLogs.createdAt));
};
