import * as appointmentService from "../services/appointmentService.js";
import { logAudit } from "../services/auditService.js";

export const create = async (req, res, next) => {
    try {
        const result = await appointmentService.createAppointment(req.body, req.user.id);

        logAudit({
            tableName: "appointments",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: { patientId: req.body.patientId, date: req.body.date, time: req.body.time, reason: req.body.reason },
            description: `Cita creada para paciente ID ${req.body.patientId} el ${req.body.date} a las ${req.body.time}`,
            ipAddress: req.ip,
        });

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

        logAudit({
            tableName: "appointments",
            recordId: req.params.id,
            action: "STATUS_CHANGE",
            user: req.user,
            previousValues: { status: result.previousStatus },
            newValues: { status },
            description: `Estado de cita ${req.params.id} cambiado a "${status}"`,
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, message: "Estado actualizado", data: result });
    } catch (error) {
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await appointmentService.updateAppointment(req.params.id, req.body);

        logAudit({
            tableName: "appointments",
            recordId: req.params.id,
            action: "UPDATE",
            user: req.user,
            newValues: req.body,
            description: `Cita ${req.params.id} actualizada (${req.body.date || ""} ${req.body.time || ""})`.trim(),
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, message: "Cita actualizada", data: result });
    } catch (error) {
        next(error);
    }
};

export const bulkCancel = async (req, res, next) => {
    try {
        const result = await appointmentService.bulkCancelAppointments(req.body);

        logAudit({
            tableName: "appointments",
            recordId: req.body.date || "bulk",
            action: "STATUS_CHANGE",
            user: req.user,
            newValues: { status: "cancelled", count: result.cancelledCount },
            description: `${result.cancelledCount} cita(s) cancelada(s) masivamente${req.body.date ? ` para fecha ${req.body.date}` : ""}`,
            ipAddress: req.ip,
        });

        res.status(200).json({
            success: true,
            message: `${result.cancelledCount} cita(s) cancelada(s) exitosamente.`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
