import 'dotenv/config'; 
import OpenAI from 'openai';

// Leemos la misma variable que ya tenías para no romper tu .env
// Solo asegúrate de que el valor ahora sea tu llave de OpenAI (sk-...)
const apiKey = process.env.SECRET_KEY_GEMINI;

if (!apiKey) {
    console.error("🔴 ALERTA: La variable SECRET_KEY_GEMINI no se encontró en el archivo .env");
}

// Instanciamos el cliente de OpenAI
const openai = new OpenAI({ apiKey: apiKey });

export const generateMedicalDocument = async (doctorPrompt, clinicalData) => {
    try {
        // En OpenAI se separa el "Comportamiento" (System) de la "Petición" (User)
        const systemPrompt = `
            Eres un médico especialista redactando documentos clínicos formales en El Salvador.
            
            DATOS DEL PACIENTE:
            - Nombre: ${clinicalData.patientName}
            - Documento de Identidad (DUI): ${clinicalData.patientDui || 'No especificado'}
            - Edad: ${clinicalData.patientAge} años
            
            DATOS CLÍNICOS ACTUALES:
            - Diagnóstico principal: ${clinicalData.diagnosis || 'No especificado'}
            
            REGLAS DE REDACCIÓN MÉDICA:
            1. ESTILO TRADICIONAL: Evita palabras legales como "El infrascrito". 
            2. Usa fórmulas de cortesía médica. 
               - Si es constancia/incapacidad, inicia con frases como: "Por este medio hago constar que he evaluado en esta clínica al paciente..." o "Por medio de la presente se hace constar que el paciente...".
               - Si es receta, ve directo al tratamiento.
            3. Integra el diagnóstico y los días de reposo (si se solicitan) de forma natural en el párrafo.
            4. Escribe en tercera persona del singular o primera persona de forma profesional.
            5. PROHIBIDO: No agregues líneas para firmas, ni la fecha de hoy, ni el nombre de la clínica, ni saludos finales ("Atentamente"). El sistema ya inyecta todo eso en el PDF automáticamente. Entrega SOLO el párrafo central.
        `;

        // Hacemos la llamada al modelo más rápido y económico
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `SOLICITUD ESPECÍFICA DEL MÉDICO: "${doctorPrompt}"` }
            ],
            temperature: 0.2, // Baja temperatura para mantenerlo formal y poco creativo
        });

        // Retornamos solo el texto generado
        return response.choices[0].message.content;

    } catch (error) {
        console.error("🔴 Error DETALLADO conectando con OpenAI:");
        console.error(error);
        throw new Error("No se pudo generar el documento con IA. Revise la consola del servidor para más detalles.");
    }
};