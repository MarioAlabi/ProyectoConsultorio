import { mysqlTable, varchar, text, datetime, boolean, int, bigint, uniqueIndex, date, mysqlEnum, timestamp, decimal  } from "drizzle-orm/mysql-core";
export const users = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 255 }),
    role: varchar("role", { length: 20 }).notNull().default("assistant"),
    banned: boolean("banned").notNull().default(false),
    banReason: varchar("ban_reason", { length: 255 }),
    banExpires: datetime("ban_expires"),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const accounts = mysqlTable("accounts", {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 100 }).notNull(),
    providerId: varchar("provider_id", { length: 20 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    password: text("password"),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const sessions = mysqlTable("sessions", {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: datetime("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    impersonatedBy: varchar("impersonated_by", { length: 36 }),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const verifications = mysqlTable("verifications", {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at").notNull(),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const rateLimit = mysqlTable("rate_limit", {
    id: varchar("id", { length: 36 }).primaryKey(),
    key: text("key").notNull(),
    count: int("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const patients = mysqlTable("patients", {
    id: varchar("id", { length: 36 }).primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    yearOfBirth: date("year_of_birth").notNull(),
    identityDocument: varchar("identity_document", { length: 20 }).notNull(),
    gender: mysqlEnum("gender", ["male", "female"]).notNull(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    fileNumber: varchar("file_number", { length: 20 }).notNull().unique(),
    isMinor: int("is_minor").default(0), 
    responsibleName: varchar("responsible_name", { length: 100 }), 
    personalHistory: varchar("personal_history", { length: 200 }), 
    familyHistory: varchar("family_history", { length: 200 }),
    status: varchar("status", { length: 50 }).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const preclinicalRecords = mysqlTable("preclinical_records", {
    id: varchar("id", { length: 36 }).primaryKey(),
    patientId: varchar("patient_id", { length: 36 })
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    createdByUserId: varchar("created_by_user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdByRole: varchar("created_by_role", { length: 20 }).notNull(), 
    motivo: text("motivo").notNull(),
    bloodPressure: varchar("blood_pressure", { length: 20 }), 
    temperature: decimal("temperature", { precision: 5, scale: 2 }),  
    weight: decimal("weight", { precision: 6, scale: 2 }),             
    height: decimal("height", { precision: 4, scale: 2 }),              
    heartRate: int("heart_rate"),
    oxygenSaturation: int("oxygen_saturation"),                                       
    bmi: decimal("bmi", { precision: 5, scale: 2 }), 
    status: mysqlEnum("status", ["waiting", "in_consultation", "done", "cancelled"])
      .notNull()
      .default("waiting"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  });