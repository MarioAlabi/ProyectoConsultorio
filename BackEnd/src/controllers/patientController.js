import * as patientService from "../services/patientService.js";

export const createPatient = async (req, res, next) => {
    try {
        const result = await patientService.registerPatient(req.body);
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
        const result = await patientService.updatePatient(req.params.id, req.body);
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
};

export const changeStatus = async (req, res, next) => {
    try {
        const { status } = req.body; 
        const result = await patientService.setPatientStatus(req.params.id, status);
        res.status(200).json({ success: true, message: `Status updated to ${status}`, data: result });
    } catch (error) { next(error); }
};