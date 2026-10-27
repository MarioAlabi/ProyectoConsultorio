import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import alertService from './alertService.js';

const dispatchAiAlerts = (err, modelName) => {
    const msg = (err?.message || "").toLowerCase();
    const status = err?.status;

    if (status === 401 || status === 403 || msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("forbidden")) {
        alertService.notifyAiKeyInvalid(err).catch(() => {});
    } else if (status === 404 || msg.includes("not found") || msg.includes("deprecated") || msg.includes("is not found for api version")) {
        alertService.notifyAiModelDeprecated(modelName, err).catch(() => {});
    } else if (status === 429 || msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("rate limit")) {
        alertService.notifyAiQuotaExceeded(err).catch(() => {});
    }
};

/**
 * AI Gateway / Adaptador Centralizado de Inteligencia Artificial
 *
 * Soporta de forma nativa e intercambiable:
 * 1. 'gemini': Google AI Studio (Gemini 2.5 Flash, etc.)
 * 2. 'openai': OpenAI Cloud (GPT-4o-mini, GPT-4o, etc.)
 * 3. 'ollama': Modelos locales/on-premise (Llama 3.2, Mistral, Meditron, etc.)
 *
 * Configuración en .env:
 * - AI_PROVIDER: 'gemini' (default) | 'openai' | 'ollama'
 * - GEMINI_API_KEY o SECRET_KEY_GEMINI: Clave de Google AI Studio
 * - OPENAI_API_KEY: Clave de OpenAI
 * - OLLAMA_BASE_URL: URL base de Ollama (ej. 'http://localhost:11434/v1' o IP del NAS)
 * - OLLAMA_MODEL: Nombre del modelo en Ollama (ej. 'llama3.2', 'meditron')
 */

export { Type };

// Clientes singleton reutilizables para optimizar conexiones HTTP (Keep-Alive)
let geminiClientInstance = null;
let openaiClientInstance = null;
let ollamaClientInstance = null;

const getProvider = () => {
    const forced = process.env.AI_PROVIDER?.toLowerCase()?.trim();
    if (forced === 'gemini' || forced === 'openai' || forced === 'ollama') {
        return forced;
    }
    // Detección automática: Si hay clave de Gemini, Gemini es el proveedor prioritario
    const geminiKey = process.env.GEMINI_API_KEY || process.env.SECRET_KEY_GEMINI;
    if (geminiKey) return 'gemini';
    if (process.env.OLLAMA_BASE_URL) return 'ollama';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return 'gemini';
};

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.SECRET_KEY_GEMINI;
    if (!apiKey) {
        const error = new Error("La integración con Google Gemini no está configurada. Define GEMINI_API_KEY en el archivo .env.");
        error.status = 503;
        throw error;
    }
    if (!geminiClientInstance) {
        geminiClientInstance = new GoogleGenAI({ apiKey });
    }
    return geminiClientInstance;
};

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY || (process.env.SECRET_KEY_GEMINI?.startsWith('sk-') ? process.env.SECRET_KEY_GEMINI : null);
    if (!apiKey) {
        const error = new Error("La integración con OpenAI no está configurada. Define OPENAI_API_KEY en el archivo .env.");
        error.status = 503;
        throw error;
    }
    if (!openaiClientInstance) {
        openaiClientInstance = new OpenAI({ apiKey });
    }
    return openaiClientInstance;
};

const getOllamaClient = () => {
    const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
    if (!ollamaClientInstance) {
        // Ollama expone compatibilidad nativa con la API de OpenAI
        ollamaClientInstance = new OpenAI({
            baseURL,
            apiKey: "ollama", // Valor dummy requerido por el SDK
        });
    }
    return ollamaClientInstance;
};

/**
 * Reintento automático para manejar picos transitorios de demanda (503 / 429)
 */
const withRetry = async (fn, maxRetries = 2, delayMs = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const isTransient = err.status === 503 || err.status === 429 || (err.message && (err.message.includes("high demand") || err.message.includes("Spikes in demand")));
            if (isTransient && attempt <= maxRetries) {
                console.warn(`[AI CLIENT] Servidor con alta demanda (${err.status || 503}). Reintento ${attempt}/${maxRetries} en ${delayMs * attempt}ms...`);
                await new Promise((r) => setTimeout(r, delayMs * attempt));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
};

/**
 * Limpia y parsea respuestas JSON devueltas por modelos de IA,
 * eliminando backticks markdown y asegurando objetos válidos.
 */
export const parseAndCleanJson = (raw) => {
    if (!raw || typeof raw !== 'string') {
        throw new Error("El modelo de IA no devolvió contenido.");
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
            try {
                return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
            } catch {}
        }

        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            try {
                return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
            } catch {}
        }

        console.error("[AI CLIENT] JSON inválido devuelto por la IA. Muestra:", cleaned.slice(0, 300));
        const error = new Error("La respuesta del modelo de IA no es un JSON válido.");
        error.status = 502;
        error.cause = firstErr;
        throw error;
    }
};

/**
 * Genera texto libre (para redacción de documentos, notas clínicas, etc.)
 */
export const generateText = async ({
    systemInstruction = "",
    prompt = "",
    temperature = 0.2,
    maxTokens = 2048,
    model = null,
}) => {
    const provider = getProvider();

    // Flujo para Ollama (Local / NAS)
    if (provider === 'ollama') {
        const client = getOllamaClient();
        const modelName = model || process.env.OLLAMA_MODEL || "llama3.2";
        const messages = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });

        return await withRetry(async () => {
            try {
                const res = await client.chat.completions.create({
                    model: modelName,
                    messages,
                    temperature,
                });
                return (res.choices[0]?.message?.content || "").trim();
            } catch (err) {
                console.error("[AI CLIENT - Ollama Text Error]:", err);
                const error = new Error(`Error en Ollama (${modelName}): ${err.message || err}`);
                error.status = err.status || 502;
                throw error;
            }
        });
    }

    // Flujo para OpenAI Cloud
    if (provider === 'openai') {
        const client = getOpenAIClient();
        const modelName = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
        const messages = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });

        return await withRetry(async () => {
            try {
                const res = await client.chat.completions.create({
                    model: modelName,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                });
                return (res.choices[0]?.message?.content || "").trim();
            } catch (err) {
                console.error("[AI CLIENT - OpenAI Text Error]:", err);
                const error = new Error(`Error en OpenAI: ${err.message || err}`);
                error.status = err.status || 502;
                throw error;
            }
        });
    }

    // Flujo por defecto: Google Gemini
    const client = getGeminiClient();
    const modelName = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";

    return await withRetry(async () => {
        try {
            let res;
            try {
                res = await client.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction || undefined,
                        temperature,
                        maxOutputTokens: maxTokens,
                        thinkingConfig: {
                            thinkingBudget: 0,
                        },
                    },
                });
            } catch (initialErr) {
                // Si un modelo futuro no soporta thinkingConfig, reintentamos de forma transparente sin esa propiedad
                if (initialErr?.message?.toLowerCase()?.includes("thinking")) {
                    res = await client.models.generateContent({
                        model: modelName,
                        contents: prompt,
                        config: {
                            systemInstruction: systemInstruction || undefined,
                            temperature,
                            maxOutputTokens: maxTokens,
                        },
                    });
                } else {
                    throw initialErr;
                }
            }

            const text = res?.text;
            if (!text) {
                throw new Error("El modelo de Gemini no devolvió texto.");
            }
            return text.trim();
        } catch (err) {
            console.error("[AI CLIENT - Gemini Text Error]:", err);
            dispatchAiAlerts(err, modelName);
            const error = new Error(`Error en Gemini: ${err.message || err}`);
            error.status = err.status || 502;
            throw error;
        }
    });
};

/**
 * Genera datos estructurados en formato JSON (para CIE-10, resúmenes, plantillas, etc.)
 */
export const generateJson = async ({
    systemInstruction = "",
    prompt = "",
    schema = null,
    temperature = 0.2,
    maxTokens = 2048,
    model = null,
}) => {
    const provider = getProvider();

    // Flujo para Ollama (Local / NAS)
    if (provider === 'ollama') {
        const client = getOllamaClient();
        const modelName = model || process.env.OLLAMA_MODEL || "llama3.2";
        const fullSystem = `${systemInstruction}\n\nResponde exclusivamente con un objeto JSON válido (sin markdown ni texto explicativo).`.trim();
        const messages = [
            { role: "system", content: fullSystem },
            { role: "user", content: prompt }
        ];

        return await withRetry(async () => {
            try {
                const res = await client.chat.completions.create({
                    model: modelName,
                    messages,
                    response_format: { type: "json_object" },
                    temperature,
                });
                const rawContent = res.choices[0]?.message?.content || "";
                return parseAndCleanJson(rawContent);
            } catch (err) {
                console.error("[AI CLIENT - Ollama JSON Error]:", err);
                const error = new Error(`Error en Ollama (${modelName}): ${err.message || err}`);
                error.status = err.status || 502;
                throw error;
            }
        });
    }

    // Flujo para OpenAI Cloud
    if (provider === 'openai') {
        const client = getOpenAIClient();
        const modelName = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
        const messages = [];
        const fullSystem = `${systemInstruction}\n\nResponde obligatoriamente en formato JSON válido.`.trim();
        messages.push({ role: "system", content: fullSystem });
        messages.push({ role: "user", content: prompt });

        return await withRetry(async () => {
            try {
                const res = await client.chat.completions.create({
                    model: modelName,
                    messages,
                    response_format: { type: "json_object" },
                    temperature,
                    max_tokens: maxTokens,
                });
                const rawContent = res.choices[0]?.message?.content || "";
                return parseAndCleanJson(rawContent);
            } catch (err) {
                console.error("[AI CLIENT - OpenAI JSON Error]:", err);
                const error = new Error(`Error en OpenAI: ${err.message || err}`);
                error.status = err.status || 502;
                throw error;
            }
        });
    }

    // Flujo por defecto: Google Gemini
    const client = getGeminiClient();
    const modelName = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const config = {
        systemInstruction: `${systemInstruction}\n\nResponde exclusivamente con un objeto JSON válido (sin formato markdown ni texto extra).`.trim(),
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        thinkingConfig: {
            thinkingBudget: 0,
        },
    };

    if (schema) {
        config.responseJsonSchema = schema;
    }

    return await withRetry(async () => {
        try {
            let res;
            try {
                res = await client.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config,
                });
            } catch (initialErr) {
                if (initialErr?.message?.toLowerCase()?.includes("thinking")) {
                    const fallbackConfig = { ...config };
                    delete fallbackConfig.thinkingConfig;
                    res = await client.models.generateContent({
                        model: modelName,
                        contents: prompt,
                        config: fallbackConfig,
                    });
                } else {
                    throw initialErr;
                }
            }

            const raw = res?.text;
            return parseAndCleanJson(raw);
        } catch (err) {
            console.error("[AI CLIENT - Gemini JSON Error]:", err);
            dispatchAiAlerts(err, modelName);
            const error = new Error(`Error en Gemini: ${err.message || err}`);
            error.status = err.status || 502;
            throw error;
        }
    });
};

export default {
    generateText,
    generateJson,
    parseAndCleanJson,
    Type,
};
