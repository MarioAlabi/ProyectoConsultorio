import { z } from "zod";

export const consultationSchema = z.object({
  anamnesis: z.string().min(1, "La anamnesis es obligatoria."),
  physicalExam: z.string().optional(),
  diagnosis: z.string().min(1, "El diagnostico es obligatorio."),
  labResults: z.string().optional(),
  observations: z.string().optional(),
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
