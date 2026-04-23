import { z } from "zod";

const duiRegex = /^\d{8}-\d{1}$/;

export const patientSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es obligatoria."),
  identityDocument: z.string().regex(duiRegex, "El DUI debe tener formato 12345678-9."),
  gender: z.enum(["male", "female"], { message: "Seleccione el genero." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  isMinor: z.boolean().optional().default(false),
  responsibleName: z.string().optional(),
  personalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  insurerId: z.string().optional().or(z.literal("")),
}).refine(
  (data) => !data.isMinor || (data.responsibleName && data.responsibleName.trim().length > 0),
  { message: "El nombre del responsable es obligatorio para menores.", path: ["responsibleName"] }
);
