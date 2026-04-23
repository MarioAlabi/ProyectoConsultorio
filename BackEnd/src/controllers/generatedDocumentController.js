import { logAudit } from "../services/auditService.js";
import {
    generateDocument,
    getDocumentsByPatient,
    getDocumentById,
} from "../services/generatedDocumentService.js";

export const generateDocumentController = async (req, res, next) => {
    try {
        const { templateId, patientId, consultationId, extras, title } = req.body;
        
        // El servicio ya genera el texto Y el PDF en Base64
        const result = await generateDocument({
            templateId,
            patientId,
            consultationId: consultationId || null,
            extras: extras || {},
            title,
            doctorId: req.user?.id,
        });

        // Auditoría obligatoria (CSSP El Salvador)
        logAudit({
            tableName: "generated_documents",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: {
                templateId: result.templateId,
                title: result.title,
                patientId: result.patientId
            },
            description: `Documento "${result.title}" emitido para paciente`,
            ipAddress: req.ip,
        });

        // Enviamos el resultado que incluye el pdfBase64 para el Front
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
