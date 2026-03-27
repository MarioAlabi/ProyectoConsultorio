import { z } from "zod";

const optionalNumber = (min, max, label) =>
  z.union([
    z.literal(""),
    z.string().refine((v) => {
      const n = Number(v);
      return !isNaN(n) && n >= min && n <= max;
    }, `${label} debe estar entre ${min} y ${max}.`),
  ]).optional();

export const preclinicalSchema = z.object({
  patientId: z.string().min(1, "Debe seleccionar un paciente."),
  motivo: z.string().min(3, "El motivo de consulta es obligatorio (min. 3 caracteres)."),
  bloodPressure: z.union([
    z.literal(""),
    z.string().regex(/^\d{2,3}\s*\/\s*\d{2,3}$/, "Formato: 120/80"),
  ]).optional(),
  temperature: optionalNumber(30, 45, "La temperatura"),
  weight: optionalNumber(1, 1500, "El peso"),
  height: optionalNumber(0.3, 3, "La estatura"),
  heartRate: optionalNumber(20, 250, "La frecuencia cardiaca"),
  oxygenSaturation: optionalNumber(0, 100, "La saturacion de oxigeno"),
});
