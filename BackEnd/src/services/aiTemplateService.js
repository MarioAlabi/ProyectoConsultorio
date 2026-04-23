import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PLACEHOLDERS_REFERENCE = [
    "{{paciente.nombre}}",
    "{{paciente.dui}}",
    "{{paciente.expediente}}",
    "{{paciente.edad}}",
    "{{paciente.genero}}",
    "{{paciente.telefono}}",
    "{{paciente.direccion}}",
    "{{medico.nombre}}",
    "{{medico.jvpm}}",
    "{{medico.telefono}}",
    "{{clinica.nombre}}",
    "{{clinica.direccion}}",
    "{{consulta.diagnostico}}",
    "{{consulta.motivo}}",
    "{{fecha.hoy}}",
];

const SYSTEM_INSTRUCTION = `Eres un asistente clínico que redacta plantillas legales y profesionales de documentos médicos en español (El Salvador): constancias e incapacidades.

Reglas estrictas:
1. Devuelve SIEMPRE JSON válido con los campos { type, name, description, bodyTemplate }.
2. "type" debe ser EXACTAMENTE "constancia" o "incapacidad". Usa "incapacidad" para reposos, embarazo, enfermedad, licencias médicas. Usa "constancia" para buena salud, aptitud, asistencia u otras certificaciones.
3. "bodyTemplate" debe ser el documento COMPLETO listo para imprimir, en texto plano con saltos de línea, incluyendo encabezado, cuerpo, datos del paciente/médico y sección de firma.
4. Usa los siguientes placeholders del sistema (son variables que el software reemplazará automáticamente con datos reales). NO inventes los valores: deja los placeholders tal cual.
   Placeholders disponibles del sistema:
${PLACEHOLDERS_REFERENCE.map((p) => `   - ${p}`).join("\n")}
5. Si necesitas variables adicionales específicas del documento (por ejemplo días de incapacidad, fechas de reposo, semanas de embarazo, observaciones), defínelas con el formato {{categoria.variable}} en minúsculas y notación dot, ej: {{incapacidad.dias}}, {{incapacidad.desde}}, {{incapacidad.hasta}}, {{incapacidad.indicaciones}}, {{embarazo.semanas}}, {{embarazo.fechaProbableParto}}, {{constancia.observaciones}}, {{constancia.motivo}}.
6. El "name" debe ser corto y descriptivo (máx 100 caracteres) y "description" una frase de una línea.
7. No agregues firmas reales ni nombres inventados: la firma debe apuntar al placeholder {{medico.nombre}} y JVPM {{medico.jvpm}}.
8. Respeta la estructura legal típica salvadoreña para este tipo de documentos.`;

const ALLOWED_TYPES = new Set(["constancia", "incapacidad"]);

/**
 * Invoca Gemini para generar un borrador de plantilla a partir de un prompt del usuario.
 * @param {string} prompt - Descripción de lo que el médico quiere.
 * @param {{ preferType?: string, extraContext?: string }} [options]
 */
export const draftTemplateWithAI = async (prompt, options = {}) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error("La integración con IA no está configurada. Define GEMINI_API_KEY en el servidor.");
        error.status = 503;
        throw error;
    }

    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (cleanPrompt.length < 5) {
        const error = new Error("Describe el documento que necesitas con al menos 5 caracteres.");
        error.status = 400;
        throw error;
    }

    const userParts = [`Descripción solicitada por el médico:\n"""\n${cleanPrompt}\n"""`];
    if (options.preferType && ALLOWED_TYPES.has(options.preferType)) {
        userParts.push(`Tipo preferido: ${options.preferType}.`);
    }
    if (options.extraContext) {
        userParts.push(`Contexto adicional: ${options.extraContext}`);
    }
    userParts.push("Responde SOLO con JSON válido siguiendo el esquema solicitado.");

    const ai = new GoogleGenAI({ apiKey });

    let response;
    try {
        response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: userParts.join("\n\n"),
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.4,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: {
                            type: Type.STRING,
                            enum: ["constancia", "incapacidad"],
                            description: "Tipo de documento.",
                        },
                        name: {
                            type: Type.STRING,
                            description: "Nombre corto de la plantilla.",
                        },
                        description: {
                            type: Type.STRING,
                            description: "Descripción de una línea.",
                        },
                        bodyTemplate: {
                            type: Type.STRING,
                            description: "Cuerpo completo de la plantilla con placeholders.",
                        },
                    },
                    required: ["type", "name", "bodyTemplate"],
                    propertyOrdering: ["type", "name", "description", "bodyTemplate"],
                },
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

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        const error = new Error("La respuesta del modelo de IA no es JSON válido.");
        error.status = 502;
        throw error;
    }

    const type = String(parsed.type || "").toLowerCase();
    if (!ALLOWED_TYPES.has(type)) {
        const error = new Error(`El modelo devolvió un tipo inválido: "${parsed.type}".`);
        error.status = 502;
        throw error;
    }

    const bodyTemplate = typeof parsed.bodyTemplate === "string" ? parsed.bodyTemplate.trim() : "";
    if (bodyTemplate.length < 20) {
        const error = new Error("El cuerpo generado por la IA es demasiado corto.");
        error.status = 502;
        throw error;
    }

    const name = typeof parsed.name === "string" && parsed.name.trim().length > 0
        ? parsed.name.trim().slice(0, 150)
        : `Plantilla IA (${type})`;

    const description = typeof parsed.description === "string"
        ? parsed.description.trim().slice(0, 255)
        : "";

    // Extraer placeholders detectados para feedback al usuario.
    const placeholders = Array.from(
        new Set(
            [...bodyTemplate.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)].map((m) => m[1].trim())
        )
    );

    return {
        type,
        name,
        description,
        bodyTemplate,
        placeholders,
        model: MODEL_NAME,
    };
};
