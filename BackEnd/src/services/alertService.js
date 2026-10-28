import 'dotenv/config';
import { Resend } from 'resend';

/**
 * Servicio Centralizado de Alertas Críticas por Correo
 *
 * Envía notificaciones de alta prioridad al Administrador del Sistema
 * únicamente ante fallas que requieran intervención humana (claves vencidas,
 * modelos descontinuados, cuota agotada o pérdida de base de datos).
 *
 * Incluye mecanismo de enfriamiento (cooldown) para evitar saturación de la bandeja
 * y proteger la cuota de la cuenta de Resend.
 */

const getResendClient = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    return new Resend(key);
};

// Registro en memoria de la última vez que se envió cada tipo de alerta
const lastSentTimestamps = new Map();

/**
 * Retorna los minutos de enfriamiento configurados en .env o 120 (2 horas) por defecto
 */
const getCooldownMs = () => {
    const minutes = parseInt(process.env.ALERT_COOLDOWN_MINUTES || "120", 10);
    return (isNaN(minutes) ? 120 : minutes) * 60 * 1000;
};

/**
 * Plantilla HTML profesional para alertas del sistema
 */
const buildAlertEmailHtml = ({ title, severity = 'critical', details, actionNeeded, alertKey }) => {
    const isCritical = severity === 'critical';
    const headerColor = isCritical ? '#dc2626' : '#d97706';
    const badgeBg = isCritical ? '#fee2e2' : '#fef3c7';
    const badgeText = isCritical ? '#991b1b' : '#92400e';
    const badgeLabel = isCritical ? 'ALERTA CRÍTICA' : 'ADVERTENCIA';
    const timestamp = new Date().toLocaleString('es-SV', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'America/El_Salvador'
    });

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; line-height: 1.5; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background: ${headerColor}; padding: 24px 28px; color: #ffffff; }
            .header h1 { margin: 8px 0 0; font-size: 20px; font-weight: 700; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${badgeBg}; color: ${badgeText}; }
            .body { padding: 28px; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 20px 0 8px; }
            .details-box { background: #f1f5f9; border-radius: 8px; padding: 14px 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #334155; word-break: break-all; margin: 0; }
            .action-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px; margin: 12px 0; color: #1e40af; font-size: 14px; }
            .action-box strong { display: block; margin-bottom: 4px; color: #1e3a8a; }
            .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="badge">${badgeLabel}</span>
                <h1>${title}</h1>
            </div>
            <div class="body">
                <div class="section-title">¿Qué sucedió?</div>
                <div class="details-box">${details}</div>

                <div class="section-title">Acción Inmediata Requerida</div>
                <div class="action-box">
                    <strong>Paso a seguir:</strong>
                    ${actionNeeded}
                </div>
            </div>
            <div class="footer">
                Sistema de Consultorio Médico • Notificación enviada el ${timestamp}<br/>
                <em>Tipo de alerta: ${alertKey} (Próxima notificación throttled por ${Math.round(getCooldownMs() / 60000)} min)</em>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Envío genérico con control de cooldown
 */
export const sendAdminAlert = async ({
    alertKey,
    subject,
    title,
    details,
    actionNeeded,
    severity = 'critical',
}) => {
    try {
        const adminEmail = process.env.ADMIN_ALERT_EMAIL;
        const resendKey = process.env.RESEND_API_KEY;

        if (!resendKey) {
            console.warn(`[ALERT SERVICE] No se envió alerta '${alertKey}' porque RESEND_API_KEY no está configurada.`);
            return { sent: false, reason: 'missing_resend_key' };
        }

        if (!adminEmail) {
            console.warn(`[ALERT SERVICE] No se envió alerta '${alertKey}' porque ADMIN_ALERT_EMAIL no está configurada.`);
            return { sent: false, reason: 'missing_admin_email' };
        }

        // Validación de Cooldown / Enfriamiento
        const now = Date.now();
        const cooldownMs = getCooldownMs();
        const lastSent = lastSentTimestamps.get(alertKey);

        if (lastSent && (now - lastSent) < cooldownMs) {
            const minutesLeft = Math.ceil((cooldownMs - (now - lastSent)) / 60000);
            console.log(`[ALERT SERVICE] Alerta '${alertKey}' silenciada temporalmente. Periodo de enfriamiento activo (quedan ${minutesLeft} min).`);
            return { sent: false, reason: 'cooldown_active', minutesLeft };
        }

        const resend = getResendClient();
        const fromEmail = process.env.RESEND_EMAIL_FROM || "onboarding@resend.dev";

        console.log(`[ALERT SERVICE] Despachando correo de alerta '${alertKey}' hacia ${adminEmail}...`);

        const emailResult = await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `⚠️ [Consultorio] ${subject}`,
            html: buildAlertEmailHtml({ title, severity, details, actionNeeded, alertKey }),
        });

        if (emailResult.error) {
            console.error(`[ALERT SERVICE] Error devuelto por Resend al enviar alerta '${alertKey}':`, emailResult.error);
            return { sent: false, error: emailResult.error };
        }

        lastSentTimestamps.set(alertKey, now);
        console.log(`[ALERT SERVICE] Alerta '${alertKey}' entregada exitosamente (ID: ${emailResult.data?.id}).`);
        return { sent: true, id: emailResult.data?.id };
    } catch (err) {
        console.error(`[ALERT SERVICE] Excepción no controlada enviando alerta '${alertKey}':`, err);
        return { sent: false, error: err };
    }
};

/**
 * 1. Alerta: Clave de Google Gemini Vencida o Inválida (HTTP 401 / 403)
 */
export const notifyAiKeyInvalid = async (error) => {
    return await sendAdminAlert({
        alertKey: 'gemini_key_invalid',
        severity: 'critical',
        subject: 'Clave de Google Gemini Inválida o Vencida',
        title: 'Error de Autenticación con Google AI Studio',
        details: `Google rechazó las solicitudes de Inteligencia Artificial. Mensaje: ${error?.message || 'API_KEY_INVALID'}.`,
        actionNeeded: 'Ingresa a <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>, genera una nueva API Key y actualiza <code>GEMINI_API_KEY</code> en tu archivo <code>BackEnd/.env</code>.',
    });
};

/**
 * 2. Alerta: Modelo de Gemini Descontinuado o Deprecado (HTTP 404)
 */
export const notifyAiModelDeprecated = async (modelName, error) => {
    return await sendAdminAlert({
        alertKey: 'gemini_model_deprecated',
        severity: 'critical',
        subject: `Modelo de IA Descontinuado: ${modelName || 'gemini-2.5-flash'}`,
        title: 'El modelo configurado ya no está disponible en Google',
        details: `La API de Google informó que el modelo '${modelName}' no fue encontrado o fue deprecado. Error: ${error?.message || 'Model not found'}.`,
        actionNeeded: `Abre el archivo <code>BackEnd/.env</code> y actualiza la variable <code>GEMINI_MODEL</code> al modelo vigente (por ejemplo: <code>gemini-2.5-flash-lite</code> o <code>gemini-3.0-flash</code>). No necesitas tocar código.`,
    });
};

/**
 * 3. Alerta: Cuota o Límite de IA Agotado (HTTP 429)
 */
export const notifyAiQuotaExceeded = async (error) => {
    return await sendAdminAlert({
        alertKey: 'gemini_quota_exceeded',
        severity: 'warning',
        subject: 'Límite de Solicitudes de IA Agotado (Quota Exceeded)',
        title: 'Cuota diaria o por minuto de Google Gemini alcanzada',
        details: `Se recibió un error 429 de Google AI Studio. Mensaje: ${error?.message || 'RESOURCE_EXHAUSTED'}.`,
        actionNeeded: 'Las funciones de IA se pausarán temporalmente hasta que Google reinicie tu ventana de cuota (o puedes habilitar facturación en Google Cloud para cuotas mayores).',
    });
};

/**
 * 4. Alerta: Pérdida de Conexión a la Base de Datos (MariaDB / NAS)
 */
export const notifyDatabaseConnectionLost = async (error) => {
    return await sendAdminAlert({
        alertKey: 'database_connection_lost',
        severity: 'critical',
        subject: 'Pérdida de Conexión con la Base de Datos',
        title: 'No se puede comunicar con MariaDB en el NAS',
        details: `El servidor no pudo establecer comunicación con el host de datos (${process.env.DB_HOST}:${process.env.DB_PORT}). Error: ${error?.message || error}.`,
        actionNeeded: 'Verifica que el NAS esté encendido, que el servicio MariaDB esté corriendo y que la conexión VPN de Tailscale esté activa.',
    });
};

/**
 * 5. Alerta: Falla en el Motor de Impresión PDF / Puppeteer
 */
export const notifyPdfEngineFailure = async (error) => {
    return await sendAdminAlert({
        alertKey: 'pdf_engine_failure',
        severity: 'critical',
        subject: 'Fallo al Generar Documento PDF / Impresión',
        title: 'Error en el motor Chromium de impresión médica',
        details: `Puppeteer no pudo renderizar o imprimir el documento clínico. Error: ${error?.message || error}.`,
        actionNeeded: 'Verifica que Google Chrome esté instalado en <code>/usr/bin/google-chrome</code> en el servidor Linux y cuente con permisos de ejecución.',
    });
};

export default {
    sendAdminAlert,
    notifyAiKeyInvalid,
    notifyAiModelDeprecated,
    notifyAiQuotaExceeded,
    notifyDatabaseConnectionLost,
    notifyPdfEngineFailure,
};
