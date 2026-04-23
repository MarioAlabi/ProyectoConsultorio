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

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

const formatDate = (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric" });
};

const calcAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
    return String(age);
};

const buildVariableMap = ({ patient, doctor, clinic, consultation, extras = {} }) => {
    const map = {
        "paciente.nombre": patient?.fullName || "",
        "paciente.dui": patient?.identityDocument || "",
        "paciente.expediente": patient?.fileNumber || "",
        "paciente.edad": calcAge(patient?.yearOfBirth),
        "paciente.genero": patient?.gender === "male" ? "Masculino" : patient?.gender === "female" ? "Femenino" : "",
        "paciente.telefono": patient?.phone || "",
        "paciente.direccion": patient?.address || "",
        "paciente.responsable": patient?.responsibleName || "",
        "medico.nombre": doctor?.name || "",
        "medico.jvpm": doctor?.jvpm || "",
        "medico.telefono": doctor?.phone || "",
        "medico.correo": doctor?.email || "",
        "clinica.nombre": clinic?.clinicName || "",
        "clinica.direccion": clinic?.address || "",
        "consulta.diagnostico": consultation?.diagnosis || "",
        "consulta.motivo": consultation?.reason || consultation?.motivo || "",
        "fecha.hoy": formatDate(new Date()),
    };

    for (const [key, value] of Object.entries(extras || {})) {
        if (value === undefined || value === null) continue;
        map[key] = String(value);
    }
    return map;
};

export const renderTemplate = (bodyTemplate, variables = {}) => {
    if (typeof bodyTemplate !== "string") return "";
    return bodyTemplate.replace(VARIABLE_REGEX, (match, key) => {
        const trimmed = key.trim();
        if (Object.prototype.hasOwnProperty.call(variables, trimmed)) {
            return variables[trimmed] ?? "";
        }
        return match;
    });
};

export const extractPlaceholders = (bodyTemplate) => {
    if (typeof bodyTemplate !== "string") return [];
    const found = new Set();
    let m;
    VARIABLE_REGEX.lastIndex = 0;
    while ((m = VARIABLE_REGEX.exec(bodyTemplate)) !== null) {
        found.add(m[1].trim());
    }
    return Array.from(found);
};

const loadPatientOrThrow = async (patientId) => {
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
    if (!patient) {
        const error = new Error("Paciente no encontrado.");
        error.status = 404;
        throw error;
    }
    return patient;
};

const loadConsultation = async (consultationId) => {
    if (!consultationId) return null;
    const [consultation] = await db
        .select()
        .from(medicalConsultations)
        .where(eq(medicalConsultations.id, consultationId))
        .limit(1);
    return consultation || null;
};

const loadDoctor = async (doctorId) => {
    const [doctor] = await db.select().from(users).where(eq(users.id, doctorId)).limit(1);
    return doctor || null;
};

const loadClinic = async () => {
    const [clinic] = await db.select().from(clinicSettings).where(eq(clinicSettings.id, 1)).limit(1);
    return clinic || null;
};

export const generateDocument = async ({
    templateId,
    patientId,
    consultationId = null,
    extras = {},
    doctorId,
    title,
}) => {
    if (!templateId) {
        const error = new Error("Debe especificar la plantilla a utilizar.");
        error.status = 400;
        throw error;
    }
    if (!patientId) {
        const error = new Error("Debe especificar el paciente.");
        error.status = 400;
        throw error;
    }
    if (!doctorId) {
        const error = new Error("No se pudo identificar al médico emisor.");
        error.status = 400;
        throw error;
    }

    const template = await getTemplateById(templateId);
    if (template.status !== "active") {
        const error = new Error("La plantilla seleccionada no está activa.");
        error.status = 400;
        throw error;
    }

    const [patient, consultation, doctor, clinic] = await Promise.all([
        loadPatientOrThrow(patientId),
        loadConsultation(consultationId),
        loadDoctor(doctorId),
        loadClinic(),
    ]);

    const variables = buildVariableMap({ patient, doctor, clinic, consultation, extras });
    const content = renderTemplate(template.bodyTemplate, variables);

    const id = uuidv4();
    const resolvedTitle = (typeof title === "string" && title.trim().length > 0)
        ? title.trim()
        : `${template.type === "incapacidad" ? "Incapacidad" : "Constancia"} - ${patient.fullName}`;

    await db.insert(generatedDocuments).values({
        id,
        templateId: template.id,
        type: template.type,
        patientId: patient.id,
        consultationId: consultation?.id || null,
        doctorId,
        title: resolvedTitle,
        content,
        metadata: JSON.stringify({ variables, templateName: template.name }),
    });

    return {
        id,
        templateId: template.id,
        type: template.type,
        patientId: patient.id,
        consultationId: consultation?.id || null,
        doctorId,
        title: resolvedTitle,
        content,
        variables,
        template: {
            id: template.id,
            name: template.name,
            type: template.type,
        },
    };
};

export const getDocumentsByPatient = async (patientId) => {
    return await db
        .select({
            id: generatedDocuments.id,
            templateId: generatedDocuments.templateId,
            type: generatedDocuments.type,
            title: generatedDocuments.title,
            content: generatedDocuments.content,
            consultationId: generatedDocuments.consultationId,
            doctorId: generatedDocuments.doctorId,
            doctorName: users.name,
            createdAt: generatedDocuments.createdAt,
            templateName: documentTemplates.name,
        })
        .from(generatedDocuments)
        .leftJoin(users, eq(generatedDocuments.doctorId, users.id))
        .leftJoin(documentTemplates, eq(generatedDocuments.templateId, documentTemplates.id))
        .where(eq(generatedDocuments.patientId, patientId))
        .orderBy(desc(generatedDocuments.createdAt));
};

export const getDocumentById = async (id) => {
    const [doc] = await db
        .select()
        .from(generatedDocuments)
        .where(eq(generatedDocuments.id, id))
        .limit(1);
    if (!doc) {
        const error = new Error("Documento no encontrado.");
        error.status = 404;
        throw error;
    }
    return doc;
};
