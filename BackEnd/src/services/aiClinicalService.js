import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const requireApiKey = () => {
    // Acepta ambos nombres de variable para compatibilidad:
    // - SECRET_KEY_GEMINI (convención del flujo documentService/aiService)
    // - GEMINI_API_KEY    (convención original de aiTemplateService)
    const apiKey = process.env.SECRET_KEY_GEMINI || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error("La integración con IA no está configurada. Define SECRET_KEY_GEMINI en el servidor.");
        error.status = 503;
        throw error;
    }
    return apiKey;
};

const callGemini = async ({ systemInstruction, userContent, schema, temperature = 0.3, maxOutputTokens = 1024 }) => {
    const apiKey = requireApiKey();
    const ai = new GoogleGenAI({ apiKey });

    let response;
    try {
        response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: userContent,
            config: {
                systemInstruction,
                temperature,
                maxOutputTokens,
                responseMimeType: "application/json",
                responseJsonSchema: schema,
            },
        });
    } catch (err) {
        const error = new Error(`Error al contactar al modelo de IA: ${err.message || err}`);
        error.status = 502;
        throw error;
    }

    const raw = response?.text;
    if (!raw) {
        const error = new Error("El modelo de IA no devolvió contenido.");
        error.status = 502;
        throw error;
    }

    const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (firstErr) {
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const candidate = cleaned.slice(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(candidate);
            } catch {
            }
        }
        console.error("[AI] JSON inválido devuelto por Gemini. Raw (primeros 500 chars):", cleaned.slice(0, 500));
        const error = new Error("La respuesta del modelo de IA no es JSON válido.");
        error.status = 502;
        error.cause = firstErr;
        throw error;
    }
};


const ICD10_INSTRUCTION = `Eres un codificador clínico experto en CIE-10 (ICD-10, versión OMS en español).
A partir de un texto libre de diagnóstico escrito por un médico salvadoreño, debes devolver:
- El código CIE-10 más probable (formato: letra + dígitos, ej. E11.9, J45.9, I10).
- El nombre canónico oficial en español del diagnóstico.
- Un nivel de confianza entre 0 y 1.
- Hasta 3 alternativas si hay ambigüedad.

Reglas:
1. Usa siempre códigos CIE-10 válidos de la OMS (no inventes códigos).
2. Si el texto es ambiguo o incompleto, devuelve la mejor aproximación y baja la confianza.
3. NO interpretes abreviaturas sin evidencia clara (ej. "DM2" = Diabetes mellitus tipo 2 = E11.9).
4. Para diagnósticos compuestos (ej. "HTA + DM2"), devuelve el principal y lista el otro en alternatives.
5. Si el texto no es un diagnóstico médico, devuelve confidence: 0 y un código vacío.`;

export const suggestIcd10 = async (diagnosisText) => {
    const clean = typeof diagnosisText === "string" ? diagnosisText.trim() : "";
    if (clean.length < 2) {
        const error = new Error("Diagnóstico muy corto para analizar.");
        error.status = 400;
        throw error;
    }

    return await callGemini({
        systemInstruction: ICD10_INSTRUCTION,
        userContent: `Diagnóstico libre: """${clean}"""\n\nResponde SOLO con JSON válido (sin markdown, sin texto extra).`,
        temperature: 0.1, // más determinista para codificación
        maxOutputTokens: 1024,
        schema: {
            type: Type.OBJECT,
            properties: {
                code: { type: Type.STRING, description: "Código CIE-10 (ej. E11.9)." },
                canonicalName: { type: Type.STRING, description: "Nombre oficial del diagnóstico." },
                confidence: { type: Type.NUMBER, description: "Nivel de confianza 0-1." },
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
            required: ["code", "canonicalName", "confidence"],
        },
    });
};


const SUMMARY_INSTRUCTION = `Eres un asistente clínico que produce resúmenes ejecutivos de pacientes para médicos de consulta externa.
A partir del perfil del paciente y su historial de consultas, genera un "patient at a glance": un párrafo breve (máx 5 líneas) que permita al médico entender el paciente en 10 segundos.

Reglas:
1. Sé conciso, factual, en español médico claro.
2. Menciona edad, género, condiciones crónicas relevantes, alergias, última consulta y patrón reciente.
3. NO inventes datos. Si no hay información, omite esa sección.
4. NO des recomendaciones clínicas, solo describe el estado actual.
5. Devuelve también una lista corta de "flags" (banderas rojas) si detectas algo que el médico debe notar: alergias, condiciones crónicas no controladas, múltiples consultas recientes por el mismo motivo.`;

export const summarizePatient = async ({ patient, consultations }) => {
    if (!patient) {
        const error = new Error("Paciente requerido para generar resumen.");
        error.status = 400;
        throw error;
    }

    const consultaSample = (consultations || []).slice(0, 10).map((c) => ({
        fecha: c.consultationDate,
        motivo: c.reason || c.motivo || "",
        diagnostico: c.diagnosis || "",
        medicamentos: (c.medications || []).map((m) => m.name).filter(Boolean),
    }));

    const payload = {
        paciente: {
            edad: patient.age,
            genero: patient.gender,
            esMenor: !!patient.isMinor,
            antecedentesPersonales: patient.personalHistory || "",
            antecedentesFamiliares: patient.familyHistory || "",
        },
        ultimasConsultas: consultaSample,
    };

    return await callGemini({
        systemInstruction: SUMMARY_INSTRUCTION,
        userContent: `Datos del paciente:\n${JSON.stringify(payload, null, 2)}\n\nResponde SOLO con JSON válido (sin markdown, sin texto extra).`,
        temperature: 0.3,
        maxOutputTokens: 1500,
        schema: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "Resumen de 3-5 líneas del paciente." },
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

// ─── 3. Borrador de anamnesis ──────────────────────────────────────────────────

const ANAMNESIS_INSTRUCTION = `Eres un asistente clínico que redacta borradores de anamnesis para que el médico los revise y complete. NO reemplazas al médico; solo le das un punto de partida.

Reglas:
1. Escribe en prosa clínica estructurada (3-6 líneas), en español médico.
2. Parte del motivo de consulta y los signos vitales capturados en preclínica.
3. Referencia antecedentes relevantes si los hay.
4. Incluye preguntas sugeridas que el médico puede explorar (ej. "Se sugiere indagar tiempo de evolución y factores desencadenantes").
5. NO hagas diagnósticos. NO inventes síntomas que el paciente no reportó.
6. Al final, indica que es un borrador generado por IA que requiere validación médica.`;

export const draftAnamnesis = async ({ motivo, signosVitales, antecedentes, edad, genero }) => {
    const clean = typeof motivo === "string" ? motivo.trim() : "";
    if (clean.length < 3) {
        const error = new Error("El motivo de consulta es requerido para generar un borrador.");
        error.status = 400;
        throw error;
    }

    const payload = {
        motivoConsulta: clean,
        edad: edad ?? null,
        genero: genero || null,
        signosVitales: signosVitales || null,
        antecedentesPersonales: antecedentes?.personal || "",
        antecedentesFamiliares: antecedentes?.familiares || "",
    };

    return await callGemini({
        systemInstruction: ANAMNESIS_INSTRUCTION,
        userContent: `Datos preclínicos:\n${JSON.stringify(payload, null, 2)}\n\nGenera un borrador de anamnesis. Responde SOLO con JSON válido (sin markdown, sin texto extra).`,
        temperature: 0.4,
        maxOutputTokens: 1500,
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

    return await callGemini({
        systemInstruction: RX_SAFETY_INSTRUCTION,
        userContent: `Revisa la siguiente receta:\n${JSON.stringify(payload, null, 2)}\n\nResponde SOLO con JSON válido (sin markdown, sin texto extra).`,
        temperature: 0.1,
        maxOutputTokens: 2048,
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


const HISTORY_EXTRACT_INSTRUCTION = `Eres un asistente que convierte texto libre de antecedentes médicos en datos estructurados.
El texto puede mezclar alergias, enfermedades crónicas, cirugías previas, hábitos y medicamentos actuales.

Reglas:
1. Extrae SOLO lo que está en el texto. NO infieras ni completes.
2. Normaliza nombres comunes (ej. "DM2" → "Diabetes mellitus tipo 2").
3. Si detectas años entre paréntesis o fechas, inclúyelos.
4. "habits" es un objeto con campos opcionales smoking, alcohol, drugs. Valores: "never", "former", "current", "unknown".
5. Si el texto está vacío o no contiene antecedentes, devuelve todos los arrays vacíos.`;

export const extractStructuredHistory = async (rawHistoryText) => {
    const clean = typeof rawHistoryText === "string" ? rawHistoryText.trim() : "";

    return await callGemini({
        systemInstruction: HISTORY_EXTRACT_INSTRUCTION,
        userContent: `Texto a estructurar:\n"""${clean || "(vacío)"}"""\n\nResponde SOLO con JSON válido (sin markdown, sin texto extra).`,
        temperature: 0.1,
        maxOutputTokens: 1500,
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

    return await callGemini({
        systemInstruction: REPORT_NARRATIVE_INSTRUCTION,
        userContent: `Datos del reporte:\n${JSON.stringify(payload, null, 2)}\n\nResponde SOLO con JSON válido que cumpla el esquema (sin texto extra, sin markdown).`,
        temperature: 0.4,
        maxOutputTokens: 2048,
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
            propertyOrdering: ["narrative", "highlights"],
        },
    });
};
