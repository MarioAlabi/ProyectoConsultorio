import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Debe seleccionar un paciente."),
  date: z.string().min(1, "La fecha es obligatoria.").refine((val) => {
    const today = new Date().toISOString().split("T")[0];
    return val >= today;
  }, "No se pueden agendar citas en fechas pasadas."),
  time: z.string().min(1, "La hora es obligatoria."),
  reason: z.string().optional(),
});
