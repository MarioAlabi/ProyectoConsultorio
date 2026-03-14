import { createMedicalConsultation } from "../services/consultationService.js";

export const createConsultationController = async (req, res, next) => {
    try {
        const { preclinicalId } = req.params;
        const doctorId = req.user.id; 
        const result = await createMedicalConsultation(preclinicalId, req.body, doctorId);
        res.status(201).json({
        success: true,
        data: result,
        });
    } catch (error) {
        next(error); 
    }
};