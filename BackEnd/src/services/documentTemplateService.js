import { db } from "../config/db.js";
import { documentTemplates } from "../models/schema.js";
import { and, asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const TEMPLATE_TYPES = ["constancia", "incapacidad"];
const TEMPLATE_STATUSES = ["active", "inactive"];

const normalizeString = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length === 0 ? null : trimmed;
};

const validateTemplatePayload = (data = {}, { partial = false } = {}) => {
    const type = normalizeString(data.type);
    const name = normalizeString(data.name);
    const description = normalizeString(data.description);
    const bodyTemplate = normalizeString(data.bodyTemplate);
    const status = normalizeString(data.status);
    const isDefault = data.isDefault === true || data.isDefault === "true" || data.isDefault === 1;

    if (!partial || type !== null) {
        if (!type || !TEMPLATE_TYPES.includes(type)) {
            const error = new Error("El tipo debe ser 'constancia' o 'incapacidad'.");
            error.status = 400;
            throw error;
        }
    }

    if (!partial || name !== null) {
        if (!name || name.length < 3) {
            const error = new Error("Nombre obligatorio (mínimo 3 caracteres).");
            error.status = 400;
            throw error;
        }
    }

    if (!partial || bodyTemplate !== null) {
        if (!bodyTemplate || bodyTemplate.length < 10) {
            const error = new Error("El cuerpo es obligatorio (mínimo 10 caracteres).");
            error.status = 400;
            throw error;
        }
    }

    const payload = {};
    if (type !== null) payload.type = type;
    if (name !== null) payload.name = name;
    if (bodyTemplate !== null) payload.bodyTemplate = bodyTemplate;
    if (description !== null) payload.description = description;
    if (status !== null && TEMPLATE_STATUSES.includes(status)) payload.status = status;
    if (data.isDefault !== undefined) payload.isDefault = !!isDefault;

    return payload;
};

export const getTemplates = async ({ type, includeInactive = false } = {}) => {
    const conditions = [];
    if (type && TEMPLATE_TYPES.includes(type)) {
        conditions.push(eq(documentTemplates.type, type));
    }
    if (!includeInactive) {
        conditions.push(eq(documentTemplates.status, "active"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db
        .select()
        .from(documentTemplates)
        .where(whereClause)
        .orderBy(asc(documentTemplates.type), asc(documentTemplates.name));
};

export const getTemplateById = async (id) => {
    const [template] = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
    if (!template) {
        const error = new Error("Plantilla no encontrada.");
        error.status = 404;
        throw error;
    }
    return template;
};

export const createTemplate = async (data, userId) => {
    const payload = validateTemplatePayload(data);
    const templateId = uuidv4();

    await db.transaction(async (tx) => {
        if (payload.isDefault) {
            await tx.update(documentTemplates)
                .set({ isDefault: false })
                .where(eq(documentTemplates.type, payload.type));
        }

        await tx.insert(documentTemplates).values({
            id: templateId,
            ...payload,
            createdByUserId: userId || null,
        });
    });

    return await getTemplateById(templateId);
};

export const updateTemplate = async (id, data) => {
    const existing = await getTemplateById(id);
    const payload = validateTemplatePayload(data, { partial: true });

    await db.transaction(async (tx) => {
        if (payload.isDefault === true) {
            const typeToUse = payload.type || existing.type;
            await tx.update(documentTemplates)
                .set({ isDefault: false })
                .where(eq(documentTemplates.type, typeToUse));
        }

        await tx.update(documentTemplates)
            .set({ ...payload, updatedAt: new Date() })
            .where(eq(documentTemplates.id, id));
    });

    return await getTemplateById(id);
};

export const toggleTemplateStatus = async (id, status) => {
    await getTemplateById(id);
    await db.update(documentTemplates).set({ status, updatedAt: new Date() }).where(eq(documentTemplates.id, id));
    return await getTemplateById(id);
};

export const deleteTemplate = async (id) => {
    await getTemplateById(id);
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
    return { id };
};

export { TEMPLATE_TYPES, TEMPLATE_STATUSES };