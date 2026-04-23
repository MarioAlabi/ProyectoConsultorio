import { logAudit } from "../services/auditService.js";
import {
    generateDocument,
    getDocumentsByPatient,
    getDocumentById,
} from "../services/generatedDocumentService.js";

export const generateDocumentController = async (req, res, next) => {
    try {
        const { templateId, patientId, consultationId, extras, title } = req.body;
        const result = await generateDocument({
            templateId,
            patientId,
            consultationId: consultationId || null,
            extras: extras || {},
            title,
            doctorId: req.user?.id,
        });

        logAudit({
            tableName: "generated_documents",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: {
                templateId: result.templateId,
                type: result.type,
                patientId: result.patientId,
                consultationId: result.consultationId,
                title: result.title,
            },
            description: `${result.type === "incapacidad" ? "Incapacidad" : "Constancia"} emitida para paciente ${result.patientId}`,
            ipAddress: req.ip,
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const listPatientDocumentsController = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const data = await getDocumentsByPatient(patientId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getDocumentController = async (req, res, next) => {
    try {
        const data = await getDocumentById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
