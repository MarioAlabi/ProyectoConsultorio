import { createPreclinical } from "../services/preclinicalService.js";

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

import { getPreclinicalByStatus } from "../services/preclinicalService.js";

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