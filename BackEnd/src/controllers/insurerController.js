import { logAudit } from "../services/auditService.js";
import { createInsurer, getInsurerById, getInsurers,updateInsurer } from "../services/insurerService.js";

export const createInsurerController = async (req, res, next) => {
    try {
        const result = await createInsurer(req.body);

        logAudit({
            tableName: "insurers",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: result,
            description: `Aseguradora "${result.companyName}" creada`,
            ipAddress: req.ip,
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getInsurersController = async (req, res, next) => {
    try {
        const data = await getInsurers();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getInsurerController = async (req, res, next) => {
    try {
        const data = await getInsurerById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateInsurerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await updateInsurer(id, req.body); // Necesitas crear esta función en service

        logAudit({
            tableName: "insurers",
            recordId: id,
            action: "UPDATE",
            user: req.user,
            newValues: result,
            description: `Aseguradora "${result.companyName}" actualizada`,
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const toggleInsurerStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' o 'inactive'
        const result = await updateInsurer(id, { status });

        logAudit({
            tableName: "insurers",
            recordId: id,
            action: "STATUS_CHANGE",
            user: req.user,
            newValues: { status },
            description: `Aseguradora ${result.companyName} cambiada a ${status}`,
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
};