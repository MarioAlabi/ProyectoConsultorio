import * as auditService from "../services/auditService.js";

export const getAuditLogs = async (req, res, next) => {
    try {
        const {
            tableName, action, userId, recordId,
            search, from, to, page, limit,
        } = req.query;

        const result = await auditService.getAuditLogs({
            tableName,
            action,
            userId,
            recordId,
            search,
            from,
            to,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getAuditLogsByRecord = async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const data = await auditService.getAuditLogsByRecord(recordId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getAuditLogsByPatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const data = await auditService.getAuditLogsByPatient(patientId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
