import { db } from "../config/db.js";
import { preclinicalRecords } from "../models/schema.js";
import { v4 as uuidv4 } from "uuid";

const normalizeNullable = (value) => {
  if (value === "" || value === undefined) return null;
  return value;
};

export const createPreclinical = async (data, user) => {
  if (!data?.motivo || String(data.motivo).trim().length === 0) {
    const error = new Error("El motivo de atención es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!data?.patientId) {
    const error = new Error("patientId es obligatorio.");
    error.status = 400;
    throw error;
  }

  const weight = normalizeNullable(data.weight);
  const height = normalizeNullable(data.height);
  let bmi = null;

  if (weight !== null && height !== null) {
    const w = Number(weight);
    const h = Number(height);
    if (!Number.isNaN(w) && !Number.isNaN(h) && h > 0) {
      bmi = Number((w / (h * h)).toFixed(2));
    }
  }

  const newRecord = {
    id: uuidv4(),
    patientId: data.patientId,
    createdByUserId: user.id,
    createdByRole: user.role,
    motivo: String(data.motivo).trim(),
    bloodPressure: normalizeNullable(data.bloodPressure),
    temperature: normalizeNullable(data.temperature),
    weight: weight,
    height: height,
    heartRate: normalizeNullable(data.heartRate),
    bmi, 
    status: "waiting", 
  };

  await db.insert(preclinicalRecords).values(newRecord);
  return newRecord;
};