import {
    suggestIcd10,
    summarizePatient,
    draftAnamnesis,
    checkPrescriptionSafety,
    extractStructuredHistory,
    analyzeDiagnosticsReport,
} from "../services/aiClinicalService.js";
import { getPatientById } from "../services/patientService.js";
import { getClinicalHistoryByPatientId } from "../services/consultationService.js";
import { calcularEdadFromDate } from "../utils/ageCalc.js";
import { logAudit } from "../services/auditService.js";

const auditAIUsage = (req, operation, meta = {}) => {
    try {
        logAudit({
            tableName: "ai_usage",
            recordId: req.user?.id || "anon",
            action: "CREATE",
            user: req.user,
            newValues: { operation, ...meta },
            description: `Uso de IA: ${operation}`,
            ipAddress: req.ip,
        });
    } catch (err) {
        console.warn("[AI audit] failed:", err.message);
    }
};

export const suggestIcd10Controller = async (req, res, next) => {
    try {
        const { diagnosis } = req.body || {};
        const result = await suggestIcd10(diagnosis);
        auditAIUsage(req, "suggest_icd10", { inputLen: (diagnosis || "").length });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const summarizePatientController = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await getPatientById(patientId);
        const history = await getClinicalHistoryByPatientId(patientId);

        const age = patient.yearOfBirth ? calcularEdadFromDate(patient.yearOfBirth) : null;
        const result = await summarizePatient({
            patient: { ...patient, age },
            consultations: history?.items || [],
        });
        auditAIUsage(req, "summarize_patient", { patientId });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const draftAnamnesisController = async (req, res, next) => {
    try {
        const { motivo, signosVitales, antecedentes, edad, genero } = req.body || {};
        const result = await draftAnamnesis({ motivo, signosVitales, antecedentes, edad, genero });
        auditAIUsage(req, "draft_anamnesis");
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const checkPrescriptionSafetyController = async (req, res, next) => {
    try {
        const { medications, patient } = req.body || {};
        const result = await checkPrescriptionSafety({ medications, patient });
        auditAIUsage(req, "check_prescription", { medCount: medications?.length || 0 });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const extractHistoryController = async (req, res, next) => {
    try {
        const { text } = req.body || {};
        const result = await extractStructuredHistory(text);
        auditAIUsage(req, "extract_history");
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const analyzeReportController = async (req, res, next) => {
    try {
        const { byYear, period, totalConsultations } = req.body || {};
        const result = await analyzeDiagnosticsReport({ byYear, period, totalConsultations });
        auditAIUsage(req, "analyze_report");
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
