import { logAudit } from "../services/auditService.js";
import {
    createTemplate,
    deleteTemplate,
    getTemplateById,
    getTemplates,
    toggleTemplateStatus,
    updateTemplate,
} from "../services/documentTemplateService.js";
import { extractPlaceholders } from "../services/generatedDocumentService.js";
import { draftTemplateWithAI } from "../services/aiTemplateService.js";

export const listTemplatesController = async (req, res, next) => {
    try {
        const { type, includeInactive } = req.query;
        const data = await getTemplates({
            type,
            includeInactive: includeInactive === "true" || includeInactive === "1",
        });
        const enriched = data.map((t) => ({
            ...t,
            placeholders: extractPlaceholders(t.bodyTemplate),
        }));
        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        next(error);
    }
};

export const getTemplateController = async (req, res, next) => {
    try {
        const data = await getTemplateById(req.params.id);
        res.status(200).json({
            success: true,
            data: { ...data, placeholders: extractPlaceholders(data.bodyTemplate) },
        });
    } catch (error) {
        next(error);
    }
};

export const createTemplateController = async (req, res, next) => {
    try {
        const result = await createTemplate(req.body, req.user?.id);
        logAudit({
            tableName: "document_templates",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: result,
            description: `Plantilla "${result.name}" (${result.type}) creada`,
            ipAddress: req.ip,
        });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const updateTemplateController = async (req, res, next) => {
    try {
        const previous = await getTemplateById(req.params.id);
        const result = await updateTemplate(req.params.id, req.body);
        logAudit({
            tableName: "document_templates",
            recordId: req.params.id,
            action: "UPDATE",
            user: req.user,
            previousValues: previous,
            newValues: result,
            description: `Plantilla "${result.name}" (${result.type}) actualizada`,
            ipAddress: req.ip,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const toggleTemplateStatusController = async (req, res, next) => {
    try {
        const { status } = req.body;
        const result = await toggleTemplateStatus(req.params.id, status);
        logAudit({
            tableName: "document_templates",
            recordId: req.params.id,
            action: "STATUS_CHANGE",
            user: req.user,
            newValues: { status },
            description: `Plantilla "${result.name}" cambiada a ${status}`,
            ipAddress: req.ip,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const draftTemplateWithAIController = async (req, res, next) => {
    try {
        const { prompt, preferType, extraContext } = req.body || {};
        const result = await draftTemplateWithAI(prompt, { preferType, extraContext });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplateController = async (req, res, next) => {
    try {
        const previous = await getTemplateById(req.params.id);
        const result = await deleteTemplate(req.params.id);
        logAudit({
            tableName: "document_templates",
            recordId: req.params.id,
            action: "DELETE",
            user: req.user,
            previousValues: previous,
            description: `Plantilla "${previous.name}" eliminada`,
            ipAddress: req.ip,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
