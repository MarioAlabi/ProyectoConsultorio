import * as appointmentService from "../services/appointmentService.js";

export const create = async (req, res, next) => {
    try {
        const result = await appointmentService.createAppointment(req.body, req.user.id);
        res.status(201).json({ success: true, message: "Cita agendada con exito", data: result });
    } catch (error) {
        next(error);
    }
};

export const getByDate = async (req, res, next) => {
    try {
        const { date, from, to } = req.query;

        let data;
        if (from && to) {
            data = await appointmentService.getAppointmentsByRange(from, to);
        } else if (date) {
            data = await appointmentService.getAppointmentsByDate(date);
        } else {
            const today = new Date().toISOString().split("T")[0];
            data = await appointmentService.getAppointmentsByDate(today);
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const changeStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const result = await appointmentService.updateAppointmentStatus(req.params.id, status);
        res.status(200).json({ success: true, message: "Estado actualizado", data: result });
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await appointmentService.updateAppointment(req.params.id, req.body);
        res.status(200).json({ success: true, message: "Cita actualizada", data: result });
    } catch (error) {
        next(error);
    }
};
