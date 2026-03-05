import { db } from "../config/db.js";
import { preclinicalRecords } from "../models/schema.js";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, inArray } from "drizzle-orm";
import { patients } from "../models/schema.js";

const ALLOWED_STATUS = ["waiting", "in_consultation", "done", "cancelled"];

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
    if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) {
      const wKg = w / 2.2046; // lb a kg
      bmi = Number((wKg / (h * h)).toFixed(2));
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

export const getPreclinicalByStatus = async (user) => {
    let statuses = ["waiting"];
    
    if (user.role === "doctor") {
      statuses = ["waiting", "in_consultation"];
    }

    return await db
      .select({
        id: preclinicalRecords.id,
        motivo: preclinicalRecords.motivo,
        status: preclinicalRecords.status,
        createdAt: preclinicalRecords.createdAt,
        patientId: patients.id,
        fullName: patients.fullName,
      })
      .from(preclinicalRecords)
      .leftJoin(patients, eq(preclinicalRecords.patientId, patients.id))
      .where(inArray(preclinicalRecords.status, statuses));
  };

export const updatePreclinicalStatus = async (id, updateData) => {
    const { 
        status, bloodPressure, temperature, weight, height, heartRate, bmi 
    } = updateData;

    const toUpdate = { updatedAt: new Date() };

    if (status) toUpdate.status = status;

    if (bloodPressure !== undefined) toUpdate.bloodPressure = normalizeNullable(bloodPressure);
    if (temperature !== undefined) toUpdate.temperature = normalizeNullable(temperature);
    if (weight !== undefined) toUpdate.weight = normalizeNullable(weight);
    if (height !== undefined) toUpdate.height = normalizeNullable(height);
    if (heartRate !== undefined) toUpdate.heartRate = normalizeNullable(heartRate);
    if (bmi !== undefined) toUpdate.bmi = normalizeNullable(bmi);

    console.log("Intentando guardar en BD:", toUpdate);

    await db
      .update(preclinicalRecords)
      .set(toUpdate)
      .where(eq(preclinicalRecords.id, id));
  
    return { id, status: toUpdate.status || "updated" };
};

export const getPreclinicalById = async (id) => {
    const [record] = await db
      .select({
        id: preclinicalRecords.id,
        motivo: preclinicalRecords.motivo,
        status: preclinicalRecords.status,
        createdAt: preclinicalRecords.createdAt,
  
        bloodPressure: preclinicalRecords.bloodPressure,
        temperature: preclinicalRecords.temperature,
        weight: preclinicalRecords.weight,
        height: preclinicalRecords.height,
        heartRate: preclinicalRecords.heartRate,
        bmi: preclinicalRecords.bmi,
  
        patientId: patients.id,
        fullName: patients.fullName,
        isMinor: patients.isMinor,
        yearOfBirth: patients.yearOfBirth,
        gender: patients.gender,
      })
      .from(preclinicalRecords)
      .leftJoin(patients, eq(preclinicalRecords.patientId, patients.id))
      .where(eq(preclinicalRecords.id, id))
      .limit(1);
  
    if (!record) {
      const error = new Error("Preclínica no encontrada");
      error.status = 404;
      throw error;
    }
  
    return record;
};

export const getPreclinicalsByPatientId = async (patientId) => {
    const records = await db
      .select({
        id: preclinicalRecords.id,
        motivo: preclinicalRecords.motivo,
        status: preclinicalRecords.status,
        createdAt: preclinicalRecords.createdAt,
        bloodPressure: preclinicalRecords.bloodPressure,
        temperature: preclinicalRecords.temperature,
        weight: preclinicalRecords.weight,
        height: preclinicalRecords.height,
        heartRate: preclinicalRecords.heartRate,
        bmi: preclinicalRecords.bmi,
      })
      .from(preclinicalRecords)
      .where(eq(preclinicalRecords.patientId, patientId))
      .orderBy(desc(preclinicalRecords.createdAt));

    return records;
};
                           
