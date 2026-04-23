import 'dotenv/config';
import { v4 as uuidv4 } from "uuid";
import { connectDB, db } from "./config/db.js";
import { documentTemplates } from "./models/schema.js";
import { eq } from "drizzle-orm";

const FOOTER = `
_______________________________
Dr./Dra. {{medico.nombre}}
JVPM: {{medico.jvpm}}
Teléfono: {{medico.telefono}}`;

const HEADER = `{{clinica.nombre}}
{{clinica.direccion}}

Fecha de emisión: {{fecha.hoy}}`;

const PATIENT_BLOCK = `Nombre: {{paciente.nombre}}
Documento de identidad: {{paciente.dui}}
Expediente: {{paciente.expediente}}
Edad: {{paciente.edad}} años`;

const DEFAULT_TEMPLATES = [
    // ── Incapacidades ──────────────────────────────────────────────
    {
        type: "incapacidad",
        name: "Incapacidad por enfermedad común",
        description: "Incapacidad laboral por padecimiento o enfermedad diagnosticada (gripe, infecciones virales, etc.).",
        isDefault: true,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR ENFERMEDAD COMÚN

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Fue evaluado(a) en esta consulta y presenta diagnóstico médico que amerita reposo y retiro temporal de sus labores habituales.

Diagnóstico: {{consulta.diagnostico}}

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones médicas: {{incapacidad.indicaciones}}

Se extiende la presente a solicitud del(la) interesado(a) para los fines que estime convenientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por embarazo (pre/post natal)",
        description: "Incapacidad por maternidad, descanso pre y post natal.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD PRE/POST NATAL

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que la paciente:

${PATIENT_BLOCK}

Se encuentra en estado de gestación, con {{embarazo.semanas}} semanas de embarazo al día de hoy y fecha probable de parto el {{embarazo.fechaProbableParto}}.

Por tal motivo, se le otorga incapacidad por maternidad conforme a la normativa vigente:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Diagnóstico / observaciones: {{consulta.diagnostico}}

Indicaciones médicas: {{incapacidad.indicaciones}}

Se extiende la presente para los fines legales y laborales correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por accidente laboral",
        description: "Incapacidad originada por accidente ocurrido en el lugar de trabajo o durante la jornada laboral.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR ACCIDENTE LABORAL

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Empleador / lugar de trabajo: {{accidente.empleador}}
Fecha y hora del accidente: {{accidente.fechaHora}}
Lugar donde ocurrió: {{accidente.lugar}}
Descripción del mecanismo de lesión: {{accidente.mecanismo}}

Diagnóstico: {{consulta.diagnostico}}
Región anatómica afectada: {{accidente.region}}

En atención a la naturaleza y severidad de las lesiones, se otorga incapacidad para realizar labores habituales:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones médicas y rehabilitación: {{incapacidad.indicaciones}}

Se extiende la presente para los trámites ante el empleador, ISSS y demás instancias correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por accidente común",
        description: "Incapacidad por accidente no laboral (doméstico, tránsito, deportivo, etc.).",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR ACCIDENTE COMÚN

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Fecha del accidente: {{accidente.fechaHora}}
Tipo de accidente: {{accidente.tipo}}
Descripción: {{accidente.mecanismo}}

Diagnóstico: {{consulta.diagnostico}}
Región anatómica afectada: {{accidente.region}}

Se otorga incapacidad médica para reposo y recuperación:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones médicas: {{incapacidad.indicaciones}}

Se extiende la presente a solicitud del(la) interesado(a) para los fines que estime convenientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad postquirúrgica",
        description: "Reposo y recuperación tras intervención quirúrgica ambulatoria u hospitalaria.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POSTQUIRÚRGICA

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Procedimiento realizado: {{cirugia.procedimiento}}
Fecha de la cirugía: {{cirugia.fecha}}
Centro hospitalario: {{cirugia.centro}}
Médico tratante / cirujano: {{cirugia.cirujano}}

Diagnóstico postoperatorio: {{consulta.diagnostico}}

Dada la naturaleza del procedimiento y el tiempo habitual de convalecencia, se otorga incapacidad médica:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Próxima cita de control: {{cirugia.proximoControl}}

Se extiende la presente para los fines laborales y administrativos correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por enfermedad respiratoria aguda",
        description: "Incapacidad corta por gripe, influenza, COVID-19, bronquitis u otras infecciones respiratorias.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR ENFERMEDAD RESPIRATORIA

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Fue evaluado(a) por cuadro clínico compatible con infección respiratoria aguda, con sintomatología y hallazgos que ameritan reposo domiciliario para evitar complicaciones y contagio a terceros.

Diagnóstico: {{consulta.diagnostico}}
Sintomatología principal: {{respiratorio.sintomas}}

Se otorga incapacidad laboral con aislamiento en domicilio:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Señales de alarma que ameritan reconsulta inmediata: dificultad respiratoria, fiebre persistente >38.5°C por más de 72h, dolor torácico, saturación <94%.

Se extiende la presente para los fines que estime convenientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por gastroenteritis aguda",
        description: "Incapacidad corta por cuadro gastrointestinal agudo (diarrea, vómitos, intoxicación alimentaria).",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR CUADRO GASTROINTESTINAL

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Presenta cuadro clínico de gastroenteritis aguda / síndrome diarreico con compromiso del estado general, ameritando reposo, hidratación y tratamiento ambulatorio.

Diagnóstico: {{consulta.diagnostico}}

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Recomendaciones: hidratación oral abundante, dieta blanda fraccionada, evitar manipulación de alimentos y contacto estrecho hasta remisión de síntomas.

Se extiende la presente para los fines laborales correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por trauma musculoesquelético / fractura",
        description: "Incapacidad por esguinces, fracturas, lumbalgias u otras lesiones osteomusculares.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR LESIÓN MUSCULOESQUELÉTICA

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Presenta lesión osteomuscular / traumática que limita la movilidad y capacidad de ejecutar sus labores habituales.

Diagnóstico: {{consulta.diagnostico}}
Región anatómica comprometida: {{lesion.region}}
Estudios complementarios: {{lesion.estudios}}
Tratamiento prescrito: {{lesion.tratamiento}}

Se otorga incapacidad laboral por reposo y rehabilitación:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Restricción funcional: {{lesion.restriccion}}

Se extiende la presente para los fines laborales y de rehabilitación correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por salud mental",
        description: "Incapacidad por trastornos de ansiedad, depresión, estrés laboral o crisis emocional.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR CONDICIÓN DE SALUD MENTAL

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Fue evaluado(a) en consulta y presenta diagnóstico que compromete su estado emocional y funcional, requiriendo retiro temporal del entorno laboral para su recuperación.

Diagnóstico: {{consulta.diagnostico}}

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Plan de seguimiento: {{saludMental.seguimiento}}

Por la naturaleza del padecimiento, se solicita discreción y manejo confidencial de este documento.

Se extiende la presente para los fines laborales que correspondan.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por hospitalización / convalecencia",
        description: "Reposo domiciliario posterior a internamiento o procedimiento médico prolongado.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR CONVALECENCIA

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Estuvo hospitalizado(a) en {{hospitalizacion.centro}} del {{hospitalizacion.ingreso}} al {{hospitalizacion.egreso}}, por diagnóstico de: {{hospitalizacion.diagnostico}}

Se encuentra actualmente en fase de convalecencia domiciliaria y requiere reposo absoluto para completar su recuperación:

Diagnóstico al egreso: {{consulta.diagnostico}}

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones y cuidados: {{incapacidad.indicaciones}}
Próxima cita de control: {{hospitalizacion.proximoControl}}

Se extiende la presente para los fines que estime convenientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad por acompañamiento familiar",
        description: "Permiso por cuidado de hijo menor o familiar directo enfermo que requiere atención.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE PERMISO POR CUIDADO DE FAMILIAR

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) hace constar que el/la paciente {{familiar.nombre}}, con diagnóstico de {{familiar.diagnostico}}, requiere cuidado y acompañamiento por parte de:

${PATIENT_BLOCK}

Parentesco: {{familiar.parentesco}}

Por lo anterior, se otorga permiso de ausencia laboral al acompañante para atender al familiar durante el período de convalecencia:

Período: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}

Se extiende la presente para los trámites laborales correspondientes.

${FOOTER}`,
    },
    {
        type: "incapacidad",
        name: "Incapacidad odontológica",
        description: "Reposo por procedimiento dental mayor, extracciones múltiples o cirugía maxilofacial.",
        isDefault: false,
        bodyTemplate: `CERTIFICADO DE INCAPACIDAD POR PROCEDIMIENTO ODONTOLÓGICO

${HEADER}

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) CERTIFICA que el/la paciente:

${PATIENT_BLOCK}

Fue sometido(a) a procedimiento odontológico: {{odontologia.procedimiento}}, el día {{odontologia.fecha}}, en {{odontologia.centro}}.

Diagnóstico: {{consulta.diagnostico}}

Dada la naturaleza del procedimiento y la necesidad de reposo para evitar complicaciones (sangrado, edema, infección), se otorga incapacidad:

Período de incapacidad: {{incapacidad.dias}} día(s)
Desde: {{incapacidad.desde}}
Hasta: {{incapacidad.hasta}}

Indicaciones: {{incapacidad.indicaciones}}
Próxima cita de control: {{odontologia.proximoControl}}

Se extiende la presente para los fines correspondientes.

${FOOTER}`,
    },

    // ── Constancias ────────────────────────────────────────────────
    {
        type: "constancia",
        name: "Constancia de buena salud",
        description: "Constancia general de buen estado de salud tras evaluación médica.",
        isDefault: true,
        bodyTemplate: `CONSTANCIA DE BUENA SALUD

{{clinica.nombre}}
{{clinica.direccion}}

Fecha: {{fecha.hoy}}

A quien corresponda:

Por este medio, el/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) hace constar que el/la paciente:

${PATIENT_BLOCK}
Género: {{paciente.genero}}

Fue evaluado(a) en esta consulta y al momento del examen físico se encuentra en BUEN ESTADO DE SALUD GENERAL, sin evidencia de padecimiento infectocontagioso activo ni condición que contraindique sus actividades habituales (laborales, académicas o deportivas).

Observaciones: {{constancia.observaciones}}

Se extiende la presente constancia a solicitud del(la) interesado(a) para los usos que estime convenientes.

${FOOTER}`,
    },
    {
        type: "constancia",
        name: "Constancia de aptitud laboral",
        description: "Constancia de aptitud física para desempeño de funciones laborales específicas.",
        isDefault: false,
        bodyTemplate: `CONSTANCIA DE APTITUD LABORAL

{{clinica.nombre}}
{{clinica.direccion}}

Fecha: {{fecha.hoy}}

A quien corresponda:

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) hace constar que el/la paciente:

${PATIENT_BLOCK}

Fue evaluado(a) en consulta médica y tras valoración clínica se considera APTO(A) para desempeñar las funciones del cargo de {{laboral.cargo}} en la empresa {{laboral.empresa}}.

No presenta al momento del examen condición médica que contraindique la ejecución de las actividades propias del puesto.

Restricciones médicas: {{laboral.restricciones}}
Observaciones: {{constancia.observaciones}}

Se extiende la presente a solicitud del(la) interesado(a) para los fines laborales correspondientes.

${FOOTER}`,
    },
    {
        type: "constancia",
        name: "Constancia de aptitud deportiva",
        description: "Constancia de aptitud física para actividades deportivas o recreativas.",
        isDefault: false,
        bodyTemplate: `CONSTANCIA DE APTITUD DEPORTIVA

{{clinica.nombre}}
{{clinica.direccion}}

Fecha: {{fecha.hoy}}

A quien corresponda:

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) hace constar que el/la paciente:

${PATIENT_BLOCK}

Fue evaluado(a) en consulta médica (examen físico, signos vitales y antecedentes) y tras valoración clínica se considera APTO(A) para la práctica de la actividad deportiva: {{deporte.disciplina}}, a nivel {{deporte.nivel}}.

No presenta al momento del examen condición cardiovascular, respiratoria u osteomuscular que contraindique la práctica deportiva descrita.

Recomendaciones: hidratación adecuada, calentamiento previo y valoración anual de rutina.
Observaciones: {{constancia.observaciones}}

Se extiende la presente a solicitud del(la) interesado(a) para los fines correspondientes.

${FOOTER}`,
    },
    {
        type: "constancia",
        name: "Constancia de asistencia a consulta",
        description: "Constancia simple de que el paciente asistió a consulta médica en la fecha indicada.",
        isDefault: false,
        bodyTemplate: `CONSTANCIA DE ASISTENCIA A CONSULTA MÉDICA

{{clinica.nombre}}
{{clinica.direccion}}

Fecha: {{fecha.hoy}}

A quien corresponda:

El/la suscrito(a) Dr./Dra. {{medico.nombre}} (JVPM {{medico.jvpm}}) hace constar que el/la paciente:

${PATIENT_BLOCK}

Asistió a consulta médica en esta clínica el día {{asistencia.fecha}}, en el horario de {{asistencia.horaInicio}} a {{asistencia.horaFin}}.

Motivo de consulta: {{consulta.motivo}}

Se extiende la presente a solicitud del(la) interesado(a) para los fines laborales, académicos o administrativos que correspondan.

${FOOTER}`,
    },
];

const run = async () => {
    try {
        console.log("Seeding document templates...");
        await connectDB();

        for (const tpl of DEFAULT_TEMPLATES) {
            const existing = await db
                .select()
                .from(documentTemplates)
                .where(eq(documentTemplates.name, tpl.name))
                .limit(1);

            if (existing.length > 0) {
                console.log(`  [skip] ${tpl.name} ya existe.`);
                continue;
            }

            await db.insert(documentTemplates).values({
                id: uuidv4(),
                type: tpl.type,
                name: tpl.name,
                description: tpl.description,
                bodyTemplate: tpl.bodyTemplate,
                isDefault: !!tpl.isDefault,
                status: "active",
            });
            console.log(`  [ok] Plantilla "${tpl.name}" creada.`);
        }

        console.log("Document templates seed completado.");
        process.exit(0);
    } catch (error) {
        console.error("Error al sembrar plantillas:", error);
        process.exit(1);
    }
};

run();
