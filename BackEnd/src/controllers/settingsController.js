import * as settingsService from "../services/settingsService.js";

export const updateClinicSettings = async (req, res, next) => {
    try {
        const { clinicName, address, logoBase64 } = req.body;
        if (!clinicName) {
            return res.status(400).json({ success: false, message: "El nombre de la clínica es obligatorio" });
        }
        if (logoBase64 && !logoBase64.startsWith('data:image/png') && !logoBase64.startsWith('data:image/jpeg')) {
            return res.status(400).json({ success: false, message: "El logo debe ser formato PNG o JPG" });
        }

        const updatedSettings = await settingsService.updateSettings(clinicName, address, logoBase64);

        res.status(200).json({
            success: true,
            message: "Configuración actualizada correctamente",
            data: updatedSettings
        });
    } catch (error) {
        next(error);
    }
};

export const getClinicSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getSettings();
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};