import { generateJson, Type } from "./aiClient.js";

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
2. "type" debe ser EXACTAMENTE "constancia" o "incapacidad". Usa "incapacidad" para reposos, licencias médicas. Usa "constancia" para buena salud, aptitud, asistencia.
3. "bodyTemplate" debe ser el documento COMPLETO listo para imprimir, en texto plano con saltos de línea.
4. Usa los siguientes placeholders del sistema. NO inventes valores:
${PLACEHOLDERS_REFERENCE.map((p) => `   - ${p}`).join("\n")}
5. Si necesitas variables adicionales (días de incapacidad, fechas, observaciones), defínelas con el formato {{categoria.variable}} en minúsculas, ej: {{incapacidad.dias}}, {{constancia.observaciones}}.
6. El "name" debe ser corto y descriptivo y "description" una frase de una línea.
7. No agregues firmas reales, usa {{medico.nombre}} y JVPM {{medico.jvpm}}.`;

const ALLOWED_TYPES = new Set(["constancia", "incapacidad"]);

export const draftTemplateWithAI = async (prompt, options = {}) => {
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (cleanPrompt.length < 5) {
        const error = new Error("Describe el documento que necesitas con al menos 5 caracteres.");
        error.status = 400;
        throw error;
    }

    let userContent = `Descripción solicitada por el médico:\n"""\n${cleanPrompt}\n"""\n`;
    if (options.preferType && ALLOWED_TYPES.has(options.preferType)) {
        userContent += `Tipo preferido: ${options.preferType}.\n`;
    }
    if (options.extraContext) {
        userContent += `Contexto adicional: ${options.extraContext}\n`;
    }

    const parsed = await generateJson({
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: userContent,
        temperature: 0.4,
        maxTokens: 2048,
        schema: {
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
        },
    });

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

    // Extraer placeholders detectados para feedback al usuario
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
    };
};