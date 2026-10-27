import { generateJson, Type } from "./aiClient.js";

// --- INSTRUCCIONES DEL SISTEMA ---

const ICD10_INSTRUCTION = `Eres un codificador clínico experto en CIE-10 (OMS en español).
A partir de un diagnóstico, devuelve un JSON con:
- code: Código CIE-10 (letra + dígitos).
- canonicalName: Nombre oficial.
- confidence: Nivel de confianza (0-1).
- alternatives: Array de { code, canonicalName } si hay ambigüedad.`;

const SUMMARY_INSTRUCTION = `Eres un asistente clínico. Genera un resumen ejecutivo de 3-5 líneas de un paciente.
Menciona edad, género, condiciones crónicas, alergias y patrón reciente.
Devuelve JSON: { "summary": "...", "flags": [{ "severity": "info"|"warning"|"critical", "message": "..." }] }.`;

const ANAMNESIS_INSTRUCTION = `Eres un asistente clínico. Redacta un borrador de anamnesis en prosa médica (3-6 líneas).
Basado en motivo de consulta y signos vitales. No inventes síntomas.
Devuelve JSON: { "draft": "...", "suggestedQuestions": ["..."] }.`;

const RX_SAFETY_INSTRUCTION = `Eres un asistente farmacológico que revisa recetas antes de que el médico las imprima.
Detectas problemas críticos como:
- Contraindicaciones por alergia documentada en antecedentes.
- Dosis inapropiadas para la edad (pediátrica / adulto mayor).
- Interacciones importantes entre los medicamentos de la misma receta.
- Ausencia de indicaciones específicas (frecuencia, duración).

Reglas:
1. NO reemplazas la revisión del médico, solo alertas riesgos evidentes.
2. Si no detectas nada, devuelve warnings: [] y allClear: true.
3. Severidad: "high" (contraindicación absoluta, alergia), "medium" (revisar dosis/frecuencia), "low" (sugerencia menor).
4. Sé específico: menciona el nombre del medicamento y la razón del warning.
5. NO inventes interacciones sin evidencia farmacológica conocida.`;

const HISTORY_EXTRACT_INSTRUCTION = `Eres un asistente que convierte texto libre de antecedentes médicos en datos estructurados.
El texto puede mezclar alergias, enfermedades crónicas, cirugías previas, hábitos y medicamentos actuales.

Reglas:
1. Extrae SOLO lo que está en el texto. NO infieras ni completes.
2. Normaliza nombres comunes (ej. "DM2" → "Diabetes mellitus tipo 2").
3. Si detectas años entre paréntesis o fechas, inclúyelos.
4. "habits" es un objeto con campos opcionales smoking, alcohol, drugs. Valores: "never", "former", "current", "unknown".
5. Si el texto está vacío o no contiene antecedentes, devuelve todos los arrays vacíos.`;

const REPORT_NARRATIVE_INSTRUCTION = `Eres un analista de datos clínicos que redacta resúmenes ejecutivos de reportes estadísticos.
A partir de contadores de diagnósticos agrupados por año, escribes un párrafo analítico (3-6 líneas) que destaque:
- Diagnósticos más frecuentes en el período.
- Tendencias notables (incrementos/decrementos año a año, expresados en porcentaje).
- Patrones estacionales o demográficos si son evidentes en los datos.

Reglas:
1. Usa español médico claro y profesional, tono de reporte ejecutivo.
2. Incluye cifras concretas (porcentajes, conteos).
3. NO hagas recomendaciones clínicas; solo describe lo observado.
4. Si los datos son muy escasos (<5 registros), menciónalo.`;

// --- FUNCIONES EXPORTADAS ---

export const suggestIcd10 = async (diagnosisText) => {
    const clean = typeof diagnosisText === "string" ? diagnosisText.trim() : "";
    if (clean.length < 2) throw new Error("Diagnóstico muy corto.");

    return await generateJson({
        systemInstruction: ICD10_INSTRUCTION,
        prompt: `Diagnóstico libre: """${clean}"""`,
        temperature: 0.1,
        maxTokens: 1024,
        schema: {
            type: Type.OBJECT,
            properties: {
                code: { type: Type.STRING },
                canonicalName: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                alternatives: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            code: { type: Type.STRING },
                            canonicalName: { type: Type.STRING },
                        },
                        required: ["code", "canonicalName"],
                    },
                },
            },
            required: ["code", "canonicalName"],
        },
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
        consultas: (consultations || []).slice(0, 10),
    };

    return await generateJson({
        systemInstruction: SUMMARY_INSTRUCTION,
        prompt: `Datos del paciente:\n${JSON.stringify(payload, null, 2)}`,
        temperature: 0.3,
        maxTokens: 1500,
        schema: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                flags: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            severity: { type: Type.STRING, enum: ["info", "warning", "critical"] },
                            message: { type: Type.STRING },
                        },
                        required: ["severity", "message"],
                    },
                },
            },
            required: ["summary"],
        },
    });
};

export const draftAnamnesis = async ({ motivo, signosVitales, antecedentes, edad, genero }) => {
    const payload = { motivo, signosVitales, antecedentes, edad, genero };
    return await generateJson({
        systemInstruction: ANAMNESIS_INSTRUCTION,
        prompt: `Datos preclínicos:\n${JSON.stringify(payload, null, 2)}`,
        temperature: 0.4,
        maxTokens: 1500,
        schema: {
            type: Type.OBJECT,
            properties: {
                draft: { type: Type.STRING, description: "Borrador de anamnesis en prosa." },
                suggestedQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Preguntas que el médico puede explorar.",
                },
            },
            required: ["draft"],
        },
    });
};

export const checkPrescriptionSafety = async ({ medications, patient }) => {
    if (!Array.isArray(medications) || medications.length === 0) {
        const error = new Error("La receta está vacía, no hay nada que revisar.");
        error.status = 400;
        throw error;
    }

    const payload = {
        paciente: {
            edad: patient?.age ?? null,
            genero: patient?.gender || null,
            esMenor: !!patient?.isMinor,
            antecedentesPersonales: patient?.personalHistory || "",
            antecedentesFamiliares: patient?.familyHistory || "",
        },
        receta: medications.map((m) => ({
            nombre: m.name,
            concentracion: `${m.concentration || ""} ${m.concentrationUnit || ""}`.trim(),
            dosis: `${m.doseAmount || m.dose || ""} ${m.doseUnit || ""}`.trim(),
            via: m.route,
            frecuencia: `${m.frequencyAmount || ""} ${m.frequencyUnit || ""}`.trim() || m.frequency,
            duracion: `${m.durationAmount || ""} ${m.durationUnit || ""}`.trim() || m.duration,
            indicaciones: m.additionalInstructions || "",
        })),
    };

    return await generateJson({
        systemInstruction: RX_SAFETY_INSTRUCTION,
        prompt: `Revisa la siguiente receta:\n${JSON.stringify(payload, null, 2)}`,
        temperature: 0.1,
        maxTokens: 2048,
        schema: {
            type: Type.OBJECT,
            properties: {
                allClear: { type: Type.BOOLEAN },
                warnings: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                            medication: { type: Type.STRING },
                            message: { type: Type.STRING },
                        },
                        required: ["severity", "message"],
                    },
                },
            },
            required: ["allClear", "warnings"],
        },
    });
};

export const extractStructuredHistory = async (rawHistoryText) => {
    const clean = typeof rawHistoryText === "string" ? rawHistoryText.trim() : "";

    return await generateJson({
        systemInstruction: HISTORY_EXTRACT_INSTRUCTION,
        prompt: `Texto a estructurar:\n"""${clean || "(vacío)"}"""`,
        temperature: 0.1,
        maxTokens: 1500,
        schema: {
            type: Type.OBJECT,
            properties: {
                allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
                chronicConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                surgeries: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            year: { type: Type.STRING },
                        },
                        required: ["name"],
                    },
                },
                currentMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
                habits: {
                    type: Type.OBJECT,
                    properties: {
                        smoking: { type: Type.STRING, enum: ["never", "former", "current", "unknown"] },
                        alcohol: { type: Type.STRING, enum: ["never", "former", "current", "unknown"] },
                        drugs: { type: Type.STRING, enum: ["never", "former", "current", "unknown"] },
                    },
                },
            },
            required: ["allergies", "chronicConditions", "surgeries", "currentMedications"],
        },
    });
};

export const analyzeDiagnosticsReport = async ({ byYear, period, totalConsultations }) => {
    const compactByYear = (byYear || []).map((y) => ({
        year: y.year,
        total: y.total,
        topDiagnoses: (y.diagnoses || [])
            .slice(0, 5)
            .map((d) => ({ code: d.code, name: d.name, count: d.count })),
    }));

    const payload = {
        periodo: period,
        totalConsultas: totalConsultations,
        resumenAnual: compactByYear,
    };

    return await generateJson({
        systemInstruction: REPORT_NARRATIVE_INSTRUCTION,
        prompt: `Datos del reporte:\n${JSON.stringify(payload, null, 2)}`,
        temperature: 0.4,
        maxTokens: 2048,
        schema: {
            type: Type.OBJECT,
            properties: {
                narrative: { type: Type.STRING, description: "Párrafo analítico de 3-6 líneas." },
                highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3-5 puntos destacados en bullets cortos.",
                },
            },
            required: ["narrative"],
        },
    });
};