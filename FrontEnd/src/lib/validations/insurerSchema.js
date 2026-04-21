import { z } from "zod";

export const insurerSchema = z.object({
  companyName: z.string().min(2, "El nombre de la compania es obligatorio."),
  contactName: z.string().min(2, "El contacto encargado es obligatorio."),
  phone: z.string().min(8, "El telefono es obligatorio."),
  email: z.string().email("El correo electronico no es valido."),
  fixedConsultationAmount: z
    .string()
    .min(1, "El monto fijo es obligatorio.")
    .refine((value) => {
      const normalized = Number(value);
      return !Number.isNaN(normalized) && normalized > 0;
    }, "El monto fijo debe ser mayor a 0."),
});
