import { createMedicalConsultation, getClinicalHistoryByPatientId, getConsultationByPreclinicalId, getInsurerConsultationReport, normalizePrescribedMedications } from "../services/consultationService.js";
import { logAudit } from "../services/auditService.js";

export const createConsultationController = async (req, res, next) => {
    try {
        const { preclinicalId } = req.params;
        const doctorId = req.user.id; 
        const result = await createMedicalConsultation(preclinicalId, req.body, doctorId);

        logAudit({
            tableName: "medical_consultations",
            recordId: result.consultationId,
            action: "CREATE",
            user: req.user,
            newValues: {
                preclinicalId,
                diagnosis: req.body.diagnosis,
                medicationsCount: normalizePrescribedMedications(req.body).length,
                billingType: result.billingType,
                insurerId: result.insurerId,
                agreedAmount: result.agreedAmount,
            },
            description: `Consulta médica creada para pre-clínica ${preclinicalId}`,
            ipAddress: req.ip,
        });

        res.status(201).json({ success: true, data: result,});
    } catch (error) {
        next(error); 
    }
};
export const getConsultationController = async (req, res, next) => {
    try {
        const { preclinicalId } = req.params;
        const data = await getConsultationByPreclinicalId(preclinicalId);
        res.status(200).json({ success: true, data,});
        } catch (error) {
        next(error); 
    }
};

export const getClinicalHistoryController = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const data = await getClinicalHistoryByPatientId(patientId);

        // Este flujo es solo lectura para historial clinico.
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getInsurerConsultationReportController = async (req, res, next) => {
    try {
        const { insurerId, from, to } = req.query;
        const data = await getInsurerConsultationReport({ insurerId, from, to });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
