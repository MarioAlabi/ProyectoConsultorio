import { createMedicalConsultation,getConsultationByPreclinicalId } from "../services/consultationService.js";
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
            newValues: { preclinicalId, diagnosis: req.body.diagnosis, medicationsCount: req.body.receta?.length || 0 },
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