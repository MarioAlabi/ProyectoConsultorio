import { generateMedicalDocument } from "../services/aiService.js";
import { db } from "../config/db.js";
import { clinicSettings, patients, users } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { generateConsultationPdf } from "../services/pdfService.js";

// 1. Pide borrador usando solo ID del paciente y Diagnóstico
export const generateDraft = async (req, res, next) => {
    try {
        const { patientId, diagnosis, promptText } = req.body;

        if (!patientId || !promptText || !diagnosis) {
            return res.status(400).json({ success: false, message: "Faltan datos (Asegúrese de haber escrito un diagnóstico)." });
        }

        const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);

        const birthYear = new Date(patient.yearOfBirth).getFullYear();
        const age = new Date().getFullYear() - birthYear;

        const clinicalData = {
            patientName: patient.fullName,
            patientDui: patient.identityDocument,
            patientAge: age,
            diagnosis: diagnosis
        };

        const aiGeneratedText = await generateMedicalDocument(promptText, clinicalData);

        res.status(200).json({
            success: true,
            data: { draftText: aiGeneratedText }
        });

    } catch (error) {
        next(error);
    }
};

// 2. Solo dibuja el PDF con Puppeteer y lo devuelve (NO lo guarda aún)
export const renderPdfOnly = async (req, res, next) => {
    try {
        const { patientId, finalText } = req.body;

        if (!patientId || !finalText) {
            return res.status(400).json({ success: false, message: "Faltan datos para generar el PDF." });
        }

        const [settings] = await db.select().from(clinicSettings).limit(1);
        const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
        // req.user.id viene de tu token JWT
        const [doctor] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);

        const pdfBase64 = await generateConsultationPdf({
            patientName: patient.fullName,
            patientDui: patient.identityDocument,
            fileNumber: patient.fileNumber,
            doctorName: doctor.name,
            doctorJvpm: doctor.jvpm,
            doctorSpecialty: doctor.specialty,
            finalText
        }, settings);

        res.status(200).json({
            success: true,
            data: { pdfBase64 }
        });

    } catch (error) {
        next(error);
    }
};