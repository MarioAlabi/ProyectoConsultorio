import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Correo electronico invalido."),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
  role: z.enum(["admin", "doctor", "assistant"], { message: "Seleccione un rol." }),
});

export const editUserSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Correo electronico invalido."),
  password: z.union([z.literal(""), z.string().min(6, "Minimo 6 caracteres.")]).optional(),
  role: z.enum(["admin", "doctor", "assistant"], { message: "Seleccione un rol." }),
});

export const loginSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Correo invalido."),
  password: z.string().min(1, "La contrasena es obligatoria."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contrasena actual es obligatoria."),
  newPassword: z.string().min(6, "La nueva contrasena debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirma la nueva contrasena."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contrasenas no coinciden.",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirma la contrasena."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Correo invalido."),
});
