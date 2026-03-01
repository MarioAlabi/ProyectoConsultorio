import { createPreclinical, getPreclinicalByStatus, updatePreclinicalStatus, getPreclinicalById  } from "../services/preclinicalService.js";


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
    const status = req.query.status || "waiting";
    const data = await getPreclinicalByStatus(status);

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
