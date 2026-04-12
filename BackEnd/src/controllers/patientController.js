import * as patientService from "../services/patientService.js";
import { logAudit } from "../services/auditService.js";

export const createPatient = async (req, res, next) => {
    try {
        const result = await patientService.registerPatient(req.body);

        logAudit({
            tableName: "patients",
            recordId: result.id,
            action: "CREATE",
            user: req.user,
            newValues: { ...req.body, fileNumber: result.fileNumber },
            description: `Expediente ${result.fileNumber} creado para paciente "${req.body.fullName}"`,
            ipAddress: req.ip,
        });

        res.status(201).json({ success: true, message: "Patient registered successfully", data: result });
    } catch (error) { next(error); }
};
export const getPatients = async (req, res, next) => {
    try {
        const { q } = req.query; 
        const data = await patientService.getAllPatients(q);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

export const getPatient = async (req, res, next) => {
    try {
        const data = await patientService.getPatientById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

export const updatePatient = async (req, res, next) => {
    try {
        const previous = await patientService.getPatientById(req.params.id);
        const result = await patientService.updatePatient(req.params.id, req.body);

        logAudit({
            tableName: "patients",
            recordId: req.params.id,
            action: "UPDATE",
            user: req.user,
            previousValues: previous,
            newValues: req.body,
            description: `Expediente ${previous.fileNumber} actualizado para paciente "${previous.fullName}"`,
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
};

export const changeStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const previous = await patientService.getPatientById(req.params.id);
        const result = await patientService.setPatientStatus(req.params.id, status);

        logAudit({
            tableName: "patients",
            recordId: req.params.id,
            action: "STATUS_CHANGE",
            user: req.user,
            previousValues: { status: previous.status },
            newValues: { status },
            description: `Estado de paciente "${previous.fullName}" (${previous.fileNumber}) cambiado de "${previous.status}" a "${status}"`,
            ipAddress: req.ip,
        });

        res.status(200).json({ success: true, message: `Status updated to ${status}`, data: result });
    } catch (error) { next(error); }
};