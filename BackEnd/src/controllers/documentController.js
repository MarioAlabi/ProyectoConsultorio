import { generateMedicalDocument } from "../services/aiService.js";
import { generateConsultationPdf } from "../services/pdfService.js";
import { db } from "../config/db.js";
import { patients,clinicSettings, users } from "../models/schema.js";
import { eq } from "drizzle-orm";

// =========================================================================
// FUNCIÓN 1: Conecta con OpenAI para redactar el borrador (generateDraft)
// =========================================================================
export const generateDraft = async (req, res, next) => {
    try {
        const { patientId, diagnosis, promptText } = req.body;

        // Buscamos los datos del paciente para darle contexto a la IA
        let patientData = { patientName: "Paciente", patientAge: "No registrada", patientDui: "No registrado" };
        
        if (patientId) {
            const [patientRecord] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
            if (patientRecord) {
                // Cálculo rápido de edad si tienes el dato
                const birthYear = patientRecord.yearOfBirth ? new Date(patientRecord.yearOfBirth).getFullYear() : null;
                const age = birthYear ? new Date().getFullYear() - birthYear : "No registrada";
                
                patientData = {
                    patientName: patientRecord.fullName || "Paciente",
                    patientAge: age,
                    patientDui: patientRecord.identityDocument || "No registrado"
                };
            }
        }

        const clinicalData = {
            ...patientData,
            diagnosis: diagnosis || "No especificado"
        };

        // Llamamos al servicio de IA que configuramos
        const draftText = await generateMedicalDocument(promptText, clinicalData);

        // Devolvemos el texto a React
        res.status(200).json({ success: true, data: { draftText } });

    } catch (error) {
        console.error("Error al generar borrador con IA:", error);
        next(error);
    }
};


export const renderPdfOnly = async (req, res, next) => {
    try {
        const { patientId, finalText } = req.body;
        const doctorId = req.user.id; // ID del doctor logueado

        // 1. Consultamos TODA la data necesaria en paralelo para ser veloces
        const [patientData] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
        const [clinicData] = await db.select().from(clinicSettings).limit(1);
        const [doctorData] = await db.select().from(users).where(eq(users.id, doctorId)).limit(1);

        // 2. Mapeamos los datos asegurándonos de que NADA sea N/A
        const documentParams = {
            // Datos del Paciente
            patientName: patientData?.fullName || "Paciente no identificado",
            patientDui: patientData?.identityDocument || "N/A",
            patientFile: patientData?.fileNumber || "N/A",
            
            // Datos del Médico (desde la tabla users)
            doctorName: doctorData?.name?.toUpperCase() || "MÉDICO TRATANTE",
            doctorJvpm: doctorData?.jvpm || "N/A",
            doctorPhone: doctorData?.phone || clinicData?.phone || "N/A",
            
            // Datos de la Clínica
            clinicName: clinicData?.clinicName?.toUpperCase() || "CONSULTORIO MÉDICO",
            clinicAddress: clinicData?.address?.toUpperCase() || "DIRECCIÓN NO REGISTRADA",
            logoUrl: clinicData?.logoUrl || null,
            
            // Contenido de la IA
            textContent: finalText
        };

        // 3. Generamos el PDF
        const pdfBase64 = await generateConsultationPdf(documentParams);

        res.status(200).json({ 
            success: true, 
            data: { pdfBase64 } 
        });

    } catch (error) {
        console.error("Error en renderizado:", error);
        next(error);
    }
};