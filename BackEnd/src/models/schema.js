import { mysqlTable, varchar, text, datetime, boolean, mysqlEnum, int, bigint } from "drizzle-orm/mysql-core";

export const usuarios = mysqlTable("usuarios", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("nombre", { length: 80 }).notNull(), 
    email: varchar("correo", { length: 100 }).notNull().unique(), 
    emailVerified: boolean("correo_verificado").notNull().default(false),
    image: varchar("imagen", { length: 255 }),
    rol: mysqlEnum("rol", ['admin', 'medico', 'asistente']).notNull().default('asistente'),
    nombreUsuario: varchar("nombre_usuario", { length: 30 }).unique(),
    activo: boolean("activo").default(true),
    createdAt: datetime("creado_en").notNull(),
    updatedAt: datetime("actualizado_en").notNull(),
});

export const cuentas = mysqlTable("cuentas", {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("id_cuenta", { length: 100 }).notNull(),
    providerId: varchar("id_proveedor", { length: 20 }).notNull(),
    userId: varchar("usuario_id", { length: 36 }).notNull().references(() => usuarios.id, { onDelete: "cascade" }),
    password: text("contrasena"), 
    createdAt: datetime("creado_en").notNull(),
    updatedAt: datetime("actualizado_en").notNull(),
});

export const sesiones = mysqlTable("sesiones", {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("usuario_id", { length: 36 }).notNull().references(() => usuarios.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: datetime("expira_en").notNull(), 
    ipAddress: varchar("direccion_ip", { length: 45 }),
    userAgent: varchar("agente_usuario", { length: 255 }),
    createdAt: datetime("creado_en").notNull(),
    updatedAt: datetime("actualizado_en").notNull(),
});

export const rateLimit = mysqlTable("rate_limit", {
    id: varchar("id", { length: 36 }).primaryKey(),
    key: text("key").notNull(),
    count: int("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});