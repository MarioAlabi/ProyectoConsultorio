import OpenAI from "openai";

// Configuración del cliente OpenAI usando tu variable de entorno
const openai = new OpenAI({
    apiKey: process.env.SECRET_KEY_GEMINI || process.env.GEMINI_API_KEY,
});

const MODEL_NAME = process.env.AI_MODEL || "gpt-4o-mini";

/**
 * Helper unificado para llamadas a la IA con OpenAI
 */
const callAI = async ({ systemInstruction, userContent, temperature = 0.3, maxTokens = 2048 }) => {
    const apiKey = process.env.SECRET_KEY_GEMINI || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        const error = new Error("La integración con IA no está configurada. Define SECRET_KEY_GEMINI en el servidor.");
        error.status = 503;
        throw error;
    }

    try {
        const response = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userContent }
            ],
            // Forzamos al modelo a responder siempre con un objeto JSON válido
            response_format: { type: "json_object" },
            temperature,
            max_tokens: maxTokens,
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (err) {
        console.error("[AI CLINICAL ERROR]:", err);
        const error = new Error(`Error al contactar al modelo de IA: ${err.message || err}`);
        error.status = 502;
        throw error;
    }
};

// --- INSTRUCCIONES DEL SISTEMA ---

const ICD10_INSTRUCTION = `Eres un codificador clínico experto en CIE-10 (OMS en español).
A partir de un diagnóstico, devuelve un JSON con:
- code: Código CIE-10 (letra + dígitos).
- canonicalName: Nombre oficial.
- confidence: Nivel de confianza (0-1).
- alternatives: Array de { code, canonicalName } si hay ambigüedad.`;

const SUMMARY_INSTRUCTION = `Eres un asistente clínico. Genera un resumen ejecutivo de 3-5 líneas de un paciente.
Menciona edad, género, condiciones crónicas, alergias y patrón reciente.
Devuelve JSON: { "summary": "...", "flags": [{ "severity": "info/warning/critical", "message": "..." }] }.`;

const ANAMNESIS_INSTRUCTION = `Eres un asistente clínico. Redacta un borrador de anamnesis en prosa médica (3-6 líneas).
Basado en motivo de consulta y signos vitales. No inventes síntomas.
Devuelve JSON: { "draft": "...", "suggestedQuestions": ["..."] }.`;

const RX_SAFETY_INSTRUCTION = `Eres un asistente farmacológico. Revisa recetas para detectar riesgos, alergias o interacciones.
Devuelve JSON: { "allClear": boolean, "warnings": [{ "severity": "low/medium/high", "medication": "...", "message": "..." }] }.`;

const HISTORY_EXTRACT_INSTRUCTION = `Asistente de estructuración de datos médicos. 
Convierte texto libre en: { "allergies": [], "chronicConditions": [], "surgeries": [{ "name": "", "year": "" }], "currentMedications": [], "habits": { "smoking": "...", "alcohol": "...", "drugs": "..." } }.`;

const REPORT_NARRATIVE_INSTRUCTION = `Analista de datos clínicos. Redacta párrafos analíticos de reportes estadísticos médicos.
Devuelve JSON: { "narrative": "...", "highlights": ["..."] }.`;

// --- FUNCIONES EXPORTADAS ---

export const suggestIcd10 = async (diagnosisText) => {
    const clean = typeof diagnosisText === "string" ? diagnosisText.trim() : "";
    if (clean.length < 2) throw new Error("Diagnóstico muy corto.");

    return await callAI({
        systemInstruction: ICD10_INSTRUCTION,
        userContent: `Diagnóstico libre: """${clean}"""`,
        temperature: 0.1
    });
};

export const summarizePatient = async ({ patient, consultations }) => {
    if (!patient) throw new Error("Paciente requerido.");

    const payload = {
        paciente: {
            edad: patient.age,
            genero: patient.gender,
            antecedentes: patient.personalHistory || "",
        },
        consultas: (consultations || []).slice(0, 10)
    };

    return await callAI({
        systemInstruction: SUMMARY_INSTRUCTION,
        userContent: `Datos: ${JSON.stringify(payload)}`
    });
};

export const draftAnamnesis = async ({ motivo, signosVitales, antecedentes, edad, genero }) => {
    const payload = { motivo, signosVitales, antecedentes, edad, genero };
    return await callAI({
        systemInstruction: ANAMNESIS_INSTRUCTION,
        userContent: `Datos preclínicos: ${JSON.stringify(payload)}`,
        temperature: 0.4
    });
};

export const checkPrescriptionSafety = async ({ medications, patient }) => {
    if (!medications?.length) throw new Error("La receta está vacía.");
    
    const payload = { medications, patient };
    return await callAI({
        systemInstruction: RX_SAFETY_INSTRUCTION,
        userContent: `Revisa esta receta: ${JSON.stringify(payload)}`,
        temperature: 0.1
    });
};

export const extractStructuredHistory = async (rawHistoryText) => {
    return await callAI({
        systemInstruction: HISTORY_EXTRACT_INSTRUCTION,
        userContent: `Texto: ${rawHistoryText || "(vacío)"}`,
        temperature: 0.1
    });
};

export const analyzeDiagnosticsReport = async ({ byYear, period, totalConsultations }) => {
    const payload = { byYear, period, totalConsultations };
    return await callAI({
        systemInstruction: REPORT_NARRATIVE_INSTRUCTION,
        userContent: `Datos del reporte: ${JSON.stringify(payload)}`,
        temperature: 0.4,
        maxTokens: 2048
    });
};