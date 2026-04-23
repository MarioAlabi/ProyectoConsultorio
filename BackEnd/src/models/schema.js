import { mysqlTable, varchar, text, datetime, boolean, int, bigint, longtext, uniqueIndex, date, mysqlEnum, timestamp, decimal } from "drizzle-orm/mysql-core";
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
    dui: varchar("dui", { length: 10 }).unique(), // Formato 00000000-0
    phone: varchar("phone", { length: 20 }),
    address: text("address"), // Opcional (sin .notNull())
    hiringDate: date("hiring_date"),
    isNurse: boolean("is_nurse").default(false),
    jvpm: varchar("jvpm", { length: 20 }).unique(),
    jvpe: varchar("jvpe", { length: 20 }).unique(),
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
export const insurers = mysqlTable("insurers", {
    id: varchar("id", { length: 36 }).primaryKey(),
    companyName: varchar("company_name", { length: 150 }).notNull(),
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    fixedConsultationAmount: decimal("fixed_consultation_amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active / inactive
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
    insurerId: varchar("insurer_id", { length: 36 }).references(() => insurers.id, { onDelete: "set null" }),
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

export const medicalConsultations = mysqlTable("medical_consultations", {
    id: varchar("id", { length: 36 }).primaryKey(),
    preclinicalId: varchar("preclinical_id", { length: 36 })
        .notNull()
        .references(() => preclinicalRecords.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id", { length: 36 })
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    insurerId: varchar("insurer_id", { length: 36 })
        .references(() => insurers.id, { onDelete: "set null" }),
    doctorId: varchar("doctor_id", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    agreedAmount: decimal("agreed_amount", { precision: 10, scale: 2 }),
    anamnesis: text("anamnesis"),
    physicalExam: text("physical_exam"),
    diagnosis: text("diagnosis"),
    diagnosisCode: varchar("diagnosis_code", { length: 10 }),
    diagnosisCodeName: varchar("diagnosis_code_name", { length: 255 }),
    labResults: text("lab_results"),
    observations: text("observations"),
    documents: varchar("documents", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const prescribedMedications = mysqlTable("prescribed_medications", {
    id: varchar("id", { length: 36 }).primaryKey(),
    consultationId: varchar("consultation_id", { length: 36 })
        .notNull()
        .references(() => medicalConsultations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    concentration: varchar("concentration", { length: 50 }),
    concentrationUnit: varchar("concentration_unit", { length: 20 }),
    dose: varchar("dose", { length: 50 }),
    doseUnit: varchar("dose_unit", { length: 50 }),
    route: varchar("route", { length: 50 }),
    frequency: varchar("frequency", { length: 50 }),
    duration: varchar("duration", { length: 50 }),
    additionalInstructions: text("additional_instructions"),

    createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = mysqlTable("audit_logs", {
    id: varchar("id", { length: 36 }).primaryKey(),
    tableName: varchar("table_name", { length: 50 }).notNull(),
    recordId: varchar("record_id", { length: 36 }).notNull(),
    action: mysqlEnum("action", ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"]).notNull(),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    userName: varchar("user_name", { length: 80 }).notNull(),
    userRole: varchar("user_role", { length: 20 }).notNull(),
    previousValues: text("previous_values"),
    newValues: text("new_values"),
    description: varchar("description", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = mysqlTable("appointments", {
    id: varchar("id", { length: 36 }).primaryKey(),
    patientId: varchar("patient_id", { length: 36 })
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    time: varchar("time", { length: 10 }).notNull(),
    reason: text("reason"),
    status: mysqlEnum("status", ["scheduled", "present", "cancelled", "done"])
        .notNull()
        .default("scheduled"),
    createdByUserId: varchar("created_by_user_id", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const clinicSettings = mysqlTable("clinic_settings", {
    id: int("id").primaryKey(),
    clinicName: varchar("clinic_name", { length: 255 }).notNull(),
    address: varchar("address", { length: 100 }),
    logoUrl: longtext("logo_url"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const consultationDocuments = mysqlTable("consultation_documents", {
    id: varchar("id", { length: 36 }).primaryKey(),
    consultationId: varchar("consultation_id", { length: 36 })
        .notNull() 
        .references(() => medicalConsultations.id, { onDelete: "cascade" }),
    patientId: varchar("patient_id", { length: 36 })
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    documentType: mysqlEnum("document_type", [
        "prescription", 
        "sick_leave",   
        "certificate",  
        "other"        
    ]).notNull(),
    
    textContent: longtext("text_content"), 
    pdfBase64: longtext("pdf_base64"),     
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const documentTemplates = mysqlTable("document_templates", {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: mysqlEnum("type", ["constancia", "incapacidad"]).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 255 }),
    bodyTemplate: text("body_template").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
    createdByUserId: varchar("created_by_user_id", { length: 36 })
        .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const generatedDocuments = mysqlTable("generated_documents", {
    id: varchar("id", { length: 36 }).primaryKey(),
    templateId: varchar("template_id", { length: 36 })
        .references(() => documentTemplates.id, { onDelete: "set null" }),
    type: mysqlEnum("type", ["constancia", "incapacidad"]).notNull(),
    patientId: varchar("patient_id", { length: 36 })
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    consultationId: varchar("consultation_id", { length: 36 })
        .references(() => medicalConsultations.id, { onDelete: "set null" }),
    doctorId: varchar("doctor_id", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    content: longtext("content").notNull(),
    metadata: text("metadata"), // JSON con los valores usados para rellenar la plantilla.
    createdAt: timestamp("created_at").defaultNow(),
});
