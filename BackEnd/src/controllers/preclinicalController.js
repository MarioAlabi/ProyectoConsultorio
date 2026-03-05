import { createPreclinical, getPreclinicalByStatus, updatePreclinicalStatus, getPreclinicalById, getPreclinicalsByPatientId  } from "../services/preclinicalService.js";


export const createPreclinicalController = async (req, res, next) => {
  try {
    const record = await createPreclinical(req.body, req.user);
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
  
      const data = await updatePreclinicalStatus(id, status);
  
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
