import 'dotenv/config'; 
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.SECRET_KEY_GEMINI;

if (!apiKey) {
    console.error("🔴 ALERTA: La variable SECRET_KEY_GEMINI no se encontró en el archivo .env");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateMedicalDocument = async (doctorPrompt, clinicalData) => {
    try {
        const context = `
            Eres un médico especialista redactando documentos clínicos en El Salvador.
            
            DATOS DEL PACIENTE:
            - Nombre: ${clinicalData.patientName}
            - Documento (DUI): ${clinicalData.patientDui || 'No registrado'}
            - Edad: ${clinicalData.patientAge} años
            
            DATOS DE LA CONSULTA:
            - Diagnóstico principal: ${clinicalData.diagnosis || 'No especificado'}
            
            INSTRUCCIÓN DEL MÉDICO:
            "${doctorPrompt}"

            REGLAS DE REDACCIÓN MÉDICA:
            1. ESTILO TRADICIONAL: Evita palabras de abogado como "El infrascrito" o "certifica". 
            2. Usa fórmulas de cortesía médica clásicas. 
               - Si es constancia/incapacidad, inicia con frases como: "Por este medio hago constar que he evaluado en esta clínica al paciente..." o "Por medio de la presente se hace constar que el paciente...".
               - Si es receta, ve directo al grano indicando el tratamiento y las medidas generales.
            3. Integra el diagnóstico y los días de reposo (si se solicitan) de forma natural en el párrafo.
            4. Escribe en tercera persona del singular o primera persona de forma profesional.
            5. PROHIBIDO: No agregues líneas para firmas, ni la fecha de hoy, ni el nombre de la clínica, ni saludos finales ("Atentamente"). El sistema ya inyecta todo eso en el PDF automáticamente. Entrega SOLO el párrafo central.
        `;

        // Lógica de reintento "a prueba de balas" (Máximo 3 intentos)
        let retries = 3;
        let response;

        while (retries > 0) {
            try {
                // CAMBIO CRÍTICO: Usamos el modelo moderno soportado por la API
                response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash', 
                    contents: context,
                    config: {
                        temperature: 0.2, 
                    }
                });
                break; // Si tiene éxito, rompemos el bucle de reintentos
            } catch (apiError) {
                // Si el servidor está saturado (503), esperamos y reintentamos
                if (apiError.status === 503 && retries > 1) {
                    console.log(`Servidor de Google saturado (503). Reintentando en 2 segundos... (Quedan ${retries - 1} intentos)`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    retries--;
                } else {
                    throw apiError; // Si es otro error (como 404 o llave inválida), lo lanzamos
                }
            }
        }

        return response.text;

    } catch (error) {
        console.error("🔴 Error DETALLADO conectando con Gemini:");
        console.error(error);
        throw new Error("No se pudo generar el documento con IA. Revise la consola del servidor para más detalles.");
    }
};