import { db } from "../config/db.js";
import { preclinicalRecords, appointments } from "../models/schema.js";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, inArray, and, gte, lte, sql } from "drizzle-orm";
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
  const [existingRecord] = await db
    .select()
    .from(preclinicalRecords)
    .where(
      and(
        eq(preclinicalRecords.patientId, data.patientId),
        eq(preclinicalRecords.status, "waiting")
      )
    )
    .limit(1);
  if (existingRecord) {
    const error = new Error("El paciente ya se encuentra en la sala de espera (Estado: Esperando).");
    error.status = 409;
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
    oxygenSaturation: normalizeNullable(data.oxygenSaturation),
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

  // Filtrar solo registros del dia actual (CA-02)
  const today = new Date().toISOString().split("T")[0];
  const dayStart = `${today} 00:00:00`;
  const dayEnd = `${today} 23:59:59`;

  return await db
    .select({
      id: preclinicalRecords.id,
      motivo: preclinicalRecords.motivo,
      status: preclinicalRecords.status,
      createdAt: preclinicalRecords.createdAt,
      patientId: patients.id,
      fullName: patients.fullName,
      responsibleName: patients.responsibleName,
      isMinor: patients.isMinor,
    })
    .from(preclinicalRecords)
    .leftJoin(patients, eq(preclinicalRecords.patientId, patients.id))
    .where(
      and(
        inArray(preclinicalRecords.status, statuses),
        gte(preclinicalRecords.createdAt, sql`${dayStart}`),
        lte(preclinicalRecords.createdAt, sql`${dayEnd}`)
      )
    );
};

export const updatePreclinicalStatus = async (id, updateData) => {
  const {
    status, bloodPressure, temperature, weight, height, heartRate, oxygenSaturation, bmi
  } = updateData;

  const toUpdate = { updatedAt: new Date() };

  if (status) toUpdate.status = status;

  if (bloodPressure !== undefined) toUpdate.bloodPressure = normalizeNullable(bloodPressure);
  if (temperature !== undefined) toUpdate.temperature = normalizeNullable(temperature);
  if (weight !== undefined) toUpdate.weight = normalizeNullable(weight);
  if (height !== undefined) toUpdate.height = normalizeNullable(height);
  if (heartRate !== undefined) toUpdate.heartRate = normalizeNullable(heartRate);
  if (oxygenSaturation !== undefined) toUpdate.oxygenSaturation = normalizeNullable(oxygenSaturation);
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
      oxygenSaturation: preclinicalRecords.oxygenSaturation,
      bmi: preclinicalRecords.bmi,

      patientId: patients.id,
      fullName: patients.fullName,
      isMinor: patients.isMinor,
      responsibleName: patients.responsibleName,
      identityDocument: patients.identityDocument,
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
      oxygenSaturation: preclinicalRecords.oxygenSaturation,
      bmi: preclinicalRecords.bmi,
    })
    .from(preclinicalRecords)
    .where(eq(preclinicalRecords.patientId, patientId))
    .orderBy(desc(preclinicalRecords.createdAt));

  return records;
};

/**
 * Dashboard del doctor: contadores y lista de pacientes del dia con info de citas.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD (default: hoy)
 * @param {object} user - Usuario autenticado
 */
export const getDashboardData = async (dateStr, user) => {
  const date = dateStr || new Date().toISOString().split("T")[0];
  const dayStart = `${date} 00:00:00`;
  const dayEnd = `${date} 23:59:59`;

  // 1) Obtener todos los registros preclinicos del dia
  const preclinicalRows = await db
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
      oxygenSaturation: preclinicalRecords.oxygenSaturation,
      bmi: preclinicalRecords.bmi,
      patientId: patients.id,
      patientName: patients.fullName,
      patientDob: patients.yearOfBirth,
      isMinor: patients.isMinor,
      responsibleName: patients.responsibleName,
      gender: patients.gender,
      fileNumber: patients.fileNumber,
    })
    .from(preclinicalRecords)
    .leftJoin(patients, eq(preclinicalRecords.patientId, patients.id))
    .where(
      and(
        gte(preclinicalRecords.createdAt, sql`${dayStart}`),
        lte(preclinicalRecords.createdAt, sql`${dayEnd}`)
      )
    )
    .orderBy(preclinicalRecords.createdAt);

  // 2) Obtener las citas del dia
  const appointmentRows = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: patients.fullName,
      date: appointments.date,
      time: appointments.time,
      reason: appointments.reason,
      status: appointments.status,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.date, date))
    .orderBy(appointments.time);

  const appointmentsByPatient = {};
  for (const apt of appointmentRows) {
    if (!appointmentsByPatient[apt.patientId]) {
      appointmentsByPatient[apt.patientId] = [];
    }
    appointmentsByPatient[apt.patientId].push(apt);
  }

  const enrichedPatients = preclinicalRows.map((row) => {
    const patientAppointments = appointmentsByPatient[row.patientId] || [];
    const activeAppointment = patientAppointments.find(
      (a) => a.status === "present" || a.status === "done"
    ) || patientAppointments.find(
      (a) => a.status === "scheduled"
    );

    return {
      ...row,
      hasAppointment: patientAppointments.length > 0,
      appointmentTime: activeAppointment?.time || null,
      appointmentStatus: activeAppointment?.status || null,
      appointmentId: activeAppointment?.id || null,
    };
  });

  const pending = enrichedPatients.filter((p) => p.status === "waiting").length;
  const inConsultation = enrichedPatients.filter((p) => p.status === "in_consultation").length;
  const done = enrichedPatients.filter((p) => p.status === "done").length;
  const cancelled = enrichedPatients.filter((p) => p.status === "cancelled").length;
  const withAppointment = enrichedPatients.filter((p) => p.hasAppointment).length;
  const withoutAppointment = enrichedPatients.filter((p) => !p.hasAppointment).length;

  let filteredAppointments = appointmentRows;
  if (user.role === "doctor") {
    filteredAppointments = appointmentRows.filter(
      (a) => a.status !== "scheduled"
    );
  }

  return {
    date,
    counters: {
      pending,
      inConsultation,
      done,
      cancelled,
      total: pending + inConsultation + done + cancelled,
      dailyLoad: pending + inConsultation + done,
      withAppointment,
      withoutAppointment,
    },
    patients: enrichedPatients,
    appointments: filteredAppointments,
  };
};
