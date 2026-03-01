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