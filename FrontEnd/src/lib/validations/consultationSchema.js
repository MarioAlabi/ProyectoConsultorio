import { z } from "zod";

export const consultationSchema = z.object({
  anamnesis: z.string().min(1, "La anamnesis es obligatoria."),
  physicalExam: z.string().optional(),
  diagnosis: z.string().min(1, "El diagnostico es obligatorio."),
  labResults: z.string().optional(),
  observations: z.string().optional(),
  billingType: z.enum(["private", "insurance"]).default("private"),
  insurerId: z.string().optional(),
  agreedAmount: z.string().optional(),
  bloodPressure: z.string().optional().or(z.literal("")),
  temperature: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  heartRate: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  oxygenSaturation: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  weight: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  height: z.union([z.string(), z.number()]).optional().or(z.literal("")),

}).superRefine((data, ctx) => {
  if (data.billingType === "insurance" && !data.insurerId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["insurerId"],
      message: "Debe seleccionar una aseguradora.",
    });
  }

  if (data.billingType === "insurance") {
    const agreedAmount = data.agreedAmount?.trim() || "";
    const parsedAmount = Number(agreedAmount);

    if (!agreedAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agreedAmount"],
        message: "Debe indicar el monto cubierto por la aseguradora.",
      });
    } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agreedAmount"],
        message: "El monto cubierto debe ser mayor que cero.",
      });
    }
  }
});

export const medicationSchema = z.object({
  name: z.string().min(1, "El nombre del medicamento es obligatorio."),
  concentration: z.string().optional(),
  concentrationUnit: z.string().optional(),
  dose: z.string().optional(),
  doseUnit: z.string().optional(),
  route: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  additionalInstructions: z.string().optional(),
});