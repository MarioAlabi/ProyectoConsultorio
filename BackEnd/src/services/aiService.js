import 'dotenv/config'; 
import { generateText } from './aiClient.js';

export const generateMedicalDocument = async (doctorPrompt, clinicalData) => {
    const systemPrompt = `Eres un médico especialista redactando documentos clínicos formales en El Salvador.

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
5. PROHIBIDO: No agregues líneas para firmas, ni la fecha de hoy, ni el nombre de la clínica, ni saludos finales ("Atentamente"). El sistema ya inyecta todo eso en el PDF automáticamente. Entrega SOLO el párrafo central.`;

    try {
        return await generateText({
            systemInstruction: systemPrompt,
            prompt: `SOLICITUD ESPECÍFICA DEL MÉDICO: "${doctorPrompt}"`,
            temperature: 0.2,
        });
    } catch (error) {
        console.error("🔴 Error al redactar documento médico con IA:", error.message);
        throw new Error(`No se pudo generar el documento con IA (${error.message || "Error desconocido"}).`);
    }
};