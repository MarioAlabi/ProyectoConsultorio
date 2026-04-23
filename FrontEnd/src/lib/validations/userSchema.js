import { z } from "zod";

// 1. Creamos los campos base que comparten Crear y Editar
const baseUserSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Correo electronico invalido."),
  role: z.enum(["admin", "doctor", "assistant"], { message: "Seleccione un rol." }),
  
  dui: z.string().regex(/^\d{8}-\d$/, "Formato inválido (Ej: 00000000-0)"),
  phone: z.string().regex(/^\d{4}-\d{4}$/, "Formato inválido (Ej: 7777-7777)"),
  address: z.string().optional(),
  hiringDate: z.string().min(1, "La fecha de contratación es obligatoria."),
  
  isNurse: z.boolean().optional(),
  jvpm: z.string().optional(),
  jvpe: z.string().optional(),
});

// 2. Regla de Validación Condicional para JVPM y JVPE
const validateJuntas = (data, ctx) => {
  // Si el rol es DOCTOR, el JVPM no puede estar vacío
  if (data.role === "doctor" && (!data.jvpm || data.jvpm.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El JVPM es obligatorio para los médicos.",
      path: ["jvpm"],
    });
  }
  
  // Si el rol es ASSISTANT y es enfermera, el JVPE no puede estar vacío
  if (data.role === "assistant" && data.isNurse && (!data.jvpe || data.jvpe.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El JVPE es obligatorio para el personal de enfermería.",
      path: ["jvpe"],
    });
  }
};

// --- ESQUEMAS PARA ADMINISTRAR USUARIOS ---

export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
}).superRefine(validateJuntas);

export const editUserSchema = baseUserSchema.extend({
  password: z.union([z.literal(""), z.string().min(6, "Minimo 6 caracteres.")]).optional(),
}).superRefine(validateJuntas);


// --- ESQUEMAS DE AUTENTICACIÓN (Intactos) ---

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