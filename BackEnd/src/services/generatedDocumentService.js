import { db } from "../config/db.js";
import {
    generatedDocuments,
    documentTemplates,
    patients,
    medicalConsultations,
    users,
    clinicSettings,
} from "../models/schema.js";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById } from "./documentTemplateService.js";
import { generateConsultationPdf } from "./pdfService.js"; // Importamos el motor Puppeteer

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

const formatDate = (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric" });
};

const calcAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
    return String(age);
};

// Mapeo exhaustivo para que no llegue nada como N/A
const buildVariableMap = ({ patient, doctor, clinic, consultation, extras = {} }) => {
    const map = {
        "paciente.nombre": patient?.fullName || "",
        "paciente.dui": patient?.identityDocument || "",
        "paciente.expediente": patient?.fileNumber || "",
        "paciente.edad": calcAge(patient?.yearOfBirth),
        "paciente.genero": patient?.gender === "male" ? "Masculino" : "Femenino",
        "paciente.telefono": patient?.phone || "",
        "paciente.direccion": patient?.address || "",
        "medico.nombre": doctor?.name || "",
        "medico.jvpm": doctor?.jvpm || "",
        "medico.telefono": doctor?.phone || "",
        "clinica.nombre": clinic?.clinicName || "Consultorio Médico",
        "clinica.direccion": clinic?.address || "Santa Ana",
        "consulta.diagnostico": consultation?.diagnosis || "",
        "consulta.motivo": consultation?.reason || "",
        "fecha.hoy": formatDate(new Date()),
    };

    // Agregamos las variables libres (extras) que el doctor llenó en el modal
    for (const [key, value] of Object.entries(extras || {})) {
        if (value !== undefined && value !== null) map[key] = String(value);
    }
    return map;
};

export const renderTemplate = (bodyTemplate, variables = {}) => {
    if (typeof bodyTemplate !== "string") return "";
    return bodyTemplate.replace(VARIABLE_REGEX, (match, key) => {
        const trimmed = key.trim();
        return variables[trimmed] ?? match;
    });
};

export const extractPlaceholders = (bodyTemplate) => {
    const found = new Set();
    let m;
    VARIABLE_REGEX.lastIndex = 0;
    while ((m = VARIABLE_REGEX.exec(bodyTemplate)) !== null) found.add(m[1].trim());
    return Array.from(found);
};

export const generateDocument = async ({ templateId, patientId, consultationId = null, extras = {}, doctorId, title }) => {
    // 1. Cargar toda la data necesaria
    const template = await getTemplateById(templateId);
    if (template.status !== "active") throw new Error("Plantilla inactiva.");

    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
    const [doctor] = await db.select().from(users).where(eq(users.id, doctorId)).limit(1);
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    const [consultation] = consultationId 
        ? await db.select().from(medicalConsultations).where(eq(medicalConsultations.id, consultationId)).limit(1)
        : [null];

    // 2. Procesar el texto (Merge de variables)
    const variables = buildVariableMap({ patient, doctor, clinic, consultation, extras });
    const renderedContent = renderTemplate(template.bodyTemplate, variables);

    // 3. Generar el PDF profesional con Puppeteer (Formato Santa Ana)
    const resolvedTitle = title || (template.type === "incapacidad" ? "INCAPACIDAD MÉDICA" : "CONSTANCIA MÉDICA");
    
    const pdfBase64 = await generateConsultationPdf({
        title: resolvedTitle,
        patientName: patient?.fullName,
        doctorName: doctor?.name?.toUpperCase(),
        doctorJvpm: doctor?.jvpm,
        doctorPhone: doctor?.phone || clinic?.phone,
        clinicName: clinic?.clinicName?.toUpperCase(),
        clinicAddress: clinic?.address,
        logoUrl: clinic?.logoUrl,
        textContent: renderedContent
    });

    // 4. Guardar registro en la BD
    const id = uuidv4();
    await db.insert(generatedDocuments).values({
        id,
        templateId: template.id,
        type: template.type,
        patientId: patient.id,
        consultationId: consultation?.id || null,
        doctorId,
        title: resolvedTitle,
        content: renderedContent,
        metadata: JSON.stringify({ variables }),
    });

    return {
        id,
        title: resolvedTitle,
        content: renderedContent,
        pdfBase64, // Enviamos el PDF listo para imprimir
        patientId: patient.id
    };
};

export const getDocumentsByPatient = async (patientId) => {
    return await db
        .select({
            id: generatedDocuments.id,
            type: generatedDocuments.type,
            title: generatedDocuments.title,
            createdAt: generatedDocuments.createdAt,
            doctorName: users.name,
        })
        .from(generatedDocuments)
        .leftJoin(users, eq(generatedDocuments.doctorId, users.id))
        .where(eq(generatedDocuments.patientId, patientId))
        .orderBy(desc(generatedDocuments.createdAt));
};

export const getDocumentById = async (id) => {
    const [doc] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id)).limit(1);
    return doc;
};