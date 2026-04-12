import { createPreclinical, getPreclinicalByStatus, updatePreclinicalStatus, getPreclinicalById, getPreclinicalsByPatientId, getDashboardData  } from "../services/preclinicalService.js";
import { logAudit } from "../services/auditService.js";


export const createPreclinicalController = async (req, res, next) => {
  try {
    const record = await createPreclinical(req.body, req.user);

    logAudit({
      tableName: "preclinical_records",
      recordId: record.id,
      action: "CREATE",
      user: req.user,
      newValues: { patientId: req.body.patientId, motivo: req.body.motivo },
      description: `Registro pre-clínico creado para paciente ID ${req.body.patientId}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getPreclinicalController = async (req, res, next) => {
  try {
    const data = await getPreclinicalByStatus(req.user);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreclinicalStatusController = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const previous = await getPreclinicalById(id);
      const data = await updatePreclinicalStatus(id, req.body);

      logAudit({
        tableName: "preclinical_records",
        recordId: id,
        action: status ? "STATUS_CHANGE" : "UPDATE",
        user: req.user,
        previousValues: { status: previous.status },
        newValues: req.body,
        description: status
          ? `Estado pre-clínico de paciente "${previous.fullName}" cambiado a "${status}"`
          : `Registro pre-clínico de paciente "${previous.fullName}" actualizado`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

export const getPreclinicalByIdController = async (req, res, next) => {
    try {
      const { id } = req.params;
  
      const data = await getPreclinicalById(id);
  
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
};

export const getPreclinicalsByPatientIdController = async (req, res, next) => {
    try {
      const { patientId } = req.params;

      const data = await getPreclinicalsByPatientId(patientId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
};

export const getDashboardController = async (req, res, next) => {
    try {
      const { date } = req.query;
      const data = await getDashboardData(date, req.user);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
};
