import { z } from "zod";

export const documentTemplateSchema = z.object({
  type: z.enum(["constancia", "incapacidad"], { message: "Seleccione un tipo válido." }),
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(150),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  bodyTemplate: z.string().trim().min(10, "El cuerpo de la plantilla es obligatorio."),
  isDefault: z.boolean().optional().default(false),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});
