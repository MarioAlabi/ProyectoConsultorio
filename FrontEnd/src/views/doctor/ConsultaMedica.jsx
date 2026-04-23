import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { useInsurers } from "../../hooks/useInsurers";
import { usePatient, useUpdatePatient, usePatientClinicalHistory } from "../../hooks/usePatients";
import { useSettings } from "../../hooks/useSettings";
import { authClient } from "../../lib/auth-client";

import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { GenerateDocumentModal } from "../../components/GenerateDocumentModal";
import { PrescriptionPreviewModal } from "../../components/PrescriptionPreviewModal";
import {
  useSuggestIcd10,
  useDraftAnamnesis,
  useCheckPrescription,
  useExtractHistory,
} from "../../hooks/useAIClinical";
import { calcularEdad, clasificarIMC } from "../../lib/utils";

const toNull = (v) => (v === "" || v === undefined ? null : v);

const preventNegative = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
    e.preventDefault();
  }
};

const createMedicationDraft = () => ({
  clientId: crypto.randomUUID(),
  name: "",
  concentration: "",
  concentrationUnit: "mg",
  doseAmount: "",
  doseUnit: "Tableta(s)",
  route: "Oral",
  frequencyAmount: "",
  frequencyUnit: "horas",
  durationAmount: "",
  durationUnit: "días",
  additionalInstructions: "",
});

const NEUTRAL = "var(--fg-muted)";
const OK = "var(--accent-forest)";
const WARN = "var(--accent-ochre)";
const DANGER = "var(--accent-coral)";
const INFO = "var(--accent-slate)";

const getVitalStatus = (type, value) => {
  if (value === null || value === undefined || value === "") return { label: "", color: NEUTRAL };
  const num = parseFloat(value);
  if (isNaN(num)) return { label: "", color: NEUTRAL };
  switch (type) {
    case "temp":
      return num < 36
        ? { label: "Baja", color: INFO }
        : num > 37.5
          ? { label: "Fiebre", color: DANGER }
          : { label: "Normal", color: OK };
    case "hr":
      return num < 60
        ? { label: "Bradicardia", color: INFO }
        : num > 100
          ? { label: "Taquicardia", color: DANGER }
          : { label: "Normal", color: OK };
    case "o2":
      return num < 90
        ? { label: "Crítica", color: DANGER }
        : num < 95
          ? { label: "Baja", color: WARN }
          : { label: "Normal", color: OK };
    default:
      return { label: "", color: NEUTRAL };
  }
};

const getBpStatus = (bp) => {
  if (!bp || !bp.includes("/")) return { label: "", color: NEUTRAL };
  const [sys, dia] = bp.split("/").map(Number);
  if (isNaN(sys) || isNaN(dia) || sys === 0 || dia === 0) return { label: "", color: NEUTRAL };
  if (sys < 90 || dia < 60) return { label: "Baja", color: INFO };
  if (sys >= 160 || dia >= 100) return { label: "Grado 2", color: DANGER };
  if (sys >= 140 || dia >= 90) return { label: "Grado 1", color: DANGER };
  if (sys >= 130 || dia >= 85) return { label: "Normal-Alta", color: WARN };
  return { label: "Normal", color: OK };
};

const vitalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.55rem 0",
  borderBottom: "1px solid var(--border-subtle)",
};

const vitalInput = {
  width: "90px",
  padding: "0.35rem 0.55rem",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm)",
  textAlign: "right",
  outline: "none",
  fontSize: "0.88rem",
  background: "var(--bg-surface)",
  fontFamily: "var(--font-mono)",
  color: "var(--fg-primary)",
};

const medSelect = {
  padding: "0.6rem 0.75rem",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-surface)",
  outline: "none",
  width: "100%",
  fontSize: "0.9rem",
  color: "var(--fg-primary)",
  fontFamily: "var(--font-body)",
};

const fieldLabel = {
  fontSize: "0.78rem",
  color: "var(--fg-muted)",
  marginBottom: "0.3rem",
  display: "block",
  fontWeight: 500,
};

export const ConsultaMedica = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();

  const { data, isLoading, isError } = usePreclinicalRecord(id);

  const patientId = useMemo(() => {
    const rawId = data?.patientId || data?.patient?.id || data?.patient_id;
    return rawId ? String(rawId) : null;
  }, [data]);

  const { data: patientProfile } = usePatient(patientId);
  const { data: historialClinico, isLoading: historialLoading, isError: historialError } = usePatientClinicalHistory(patientId);

  const finishMutation = useFinishConsultation();
  const updatePatientMutation = useUpdatePatient();
  const { data: insurers = [] } = useInsurers();

  const [medicamentos, setMedicamentos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [isEditingAntecedents, setIsEditingAntecedents] = useState(false);
  const [tempPersonalHistory, setTempPersonalHistory] = useState("");
  const [tempFamilyHistory, setTempFamilyHistory] = useState("");

  const [prescriptionPreview, setPrescriptionPreview] = useState({ open: false, html: "" });
  const [docModal, setDocModal] = useState({ open: false, type: null });

  // Estado de integraciones IA.
  const [icd10Suggestion, setIcd10Suggestion] = useState(null);
  const [diagnosisCode, setDiagnosisCode] = useState(null); // { code, name } confirmado por el médico
  const [rxSafetyCheck, setRxSafetyCheck] = useState(null);

  const suggestIcd10Mutation = useSuggestIcd10();
  const draftAnamnesisMutation = useDraftAnamnesis();
  const checkPrescriptionMutation = useCheckPrescription();
  const extractHistoryMutation = useExtractHistory();
  const [structuredHistory, setStructuredHistory] = useState(null);

  const { register, watch, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      anamnesis: "", physicalExam: "", diagnosis: "", labResults: "", observations: "",
      billingType: "private", insurerId: "", agreedAmount: "",
      bloodPressure: "", temperature: "", heartRate: "", oxygenSaturation: "", weight: "", height: "",
    },
  });

  const billingType = watch("billingType");
  const selectedInsurerId = watch("insurerId");
  const selectedInsurer = insurers.find((insurer) => String(insurer.id) === String(selectedInsurerId));
  const billingTypeField = register("billingType");
  const insurerField = register("insurerId");

  const currentWeight = watch("weight");
  const currentHeight = watch("height");
  const currentBp = watch("bloodPressure");
  const currentTemp = watch("temperature");
  const currentHr = watch("heartRate");
  const currentO2 = watch("oxygenSaturation");

  const dobToUse = data?.patientDob || patientProfile?.yearOfBirth;
  const safeDob = typeof dobToUse === "string" ? dobToUse.split("T")[0] : dobToUse;
  const edad = safeDob ? calcularEdad(safeDob) : null;

  useEffect(() => {
    if (currentO2 && Number(currentO2) > 100) setValue("oxygenSaturation", "100");
  }, [currentO2, setValue]);

  useEffect(() => {
    if (data) {
      setValue("bloodPressure", data.bloodPressure || "");
      setValue("temperature", data.temperature || "");
      setValue("heartRate", data.heartRate || "");
      setValue("oxygenSaturation", data.oxygenSaturation || "");
      setValue("weight", data.weight || "");
      setValue("height", data.height || "");
    }
  }, [data, setValue]);

  useEffect(() => {
    if (patientProfile) {
      setTempPersonalHistory(patientProfile.personalHistory || "");
      setTempFamilyHistory(patientProfile.familyHistory || "");
    }
  }, [patientProfile]);

  useEffect(() => {
    if (billingType !== "insurance") {
      setValue("agreedAmount", "", { shouldValidate: false });
      return;
    }
    if (selectedInsurer) {
      setValue("agreedAmount", String(selectedInsurer.fixedConsultationAmount ?? ""), { shouldValidate: true });
    }
  }, [billingType, selectedInsurer, setValue]);

  const bmi = useMemo(() => {
    if (!currentWeight || !currentHeight) return null;
    const wKg = parseFloat(currentWeight) * 0.453592;
    return (wKg / (parseFloat(currentHeight) ** 2)).toFixed(2);
  }, [currentWeight, currentHeight]);

  const imcInfo = clasificarIMC(bmi ? parseFloat(bmi) : null) || { label: "N/A", color: NEUTRAL };
  const bpInfo = getBpStatus(currentBp);

  const handleSaveAntecedents = () => {
    if (!patientId) return toast.error("Error: ID de paciente no encontrado.");
    updatePatientMutation.mutate(
      { id: patientId, data: { personalHistory: tempPersonalHistory, familyHistory: tempFamilyHistory } },
      {
        onSuccess: () => {
          setIsEditingAntecedents(false);
          toast.success("Antecedentes actualizados al vuelo.");
        },
      }
    );
  };

  const agregarMedicamento = () => setMedicamentos((current) => [...current, createMedicationDraft()]);
  const updateMed = (idx, field, value) => {
    setMedicamentos((current) => {
      const copy = [...current];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };
  const removeMed = (idx) => setMedicamentos((current) => current.filter((_, i) => i !== idx));

  const buildPrescriptionHtml = () => {
    const datosClinica = {
      nombreClinica: settings?.clinicName || "Consultorio Médico Integral",
      nombreMedico: session?.user?.name ? `Dr/Dra. ${session.user.name}` : "Médico Tratante",
      jvpm: session?.user?.jvpm || settings?.jvpm || "---",
      telefono: session?.user?.phone || settings?.phone || "---",
      direccion: settings?.address || "---",
      logoUrl:
        settings?.logoUrl ||
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%23285444' d='M35 15h30v20h20v30H65v20H35V65H15V35h20z'/></svg>",
    };

    const patientName = data?.patientName || data?.fullName || patientProfile?.fullName || "Paciente";

    const medsHTML = medicamentos
      .filter((m) => m.name.trim())
      .map((med) => {
        const fullName = med.concentration ? `${med.name} ${med.concentration}${med.concentrationUnit}` : med.name;
        return `
          <div style="margin-bottom: 22px; padding-bottom: 15px; border-bottom: 1px dashed #e5e7eb;">
            <h3 style="margin: 0 0 6px 0; color: #111827; font-size: 1.15rem;">${fullName}</h3>
            <p style="margin: 0 0 6px 0; font-size: 1rem; color: #374151;">
              <strong>Tomar/Aplicar:</strong> ${med.doseAmount} ${med.doseUnit}
              cada ${med.frequencyAmount} ${med.frequencyUnit}
              por ${med.durationAmount} ${med.durationUnit}.
              <br/><span style="color:#6b7280; font-size: 0.9rem;">Vía de administración: ${med.route}</span>
            </p>
            ${med.additionalInstructions ? `<p style="margin: 0; font-size: 0.95rem; color: #1f2937;"><strong>Indicaciones:</strong> ${med.additionalInstructions}</p>` : ""}
          </div>
        `;
      })
      .join("");

    return `<!doctype html>
      <html>
        <head>
          <title>Receta Médica - ${patientName}</title>
          <style>
            @media print { @page { margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; align-items: center; border-bottom: 3px solid #285444; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
            .clinic-info { flex-grow: 1; }
            .clinic-name { color: #285444; margin: 0 0 5px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .doc-name { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; color: #111827; }
            .doc-details { font-size: 12px; color: #4b5563; margin: 0; line-height: 1.4; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .patient-box p { margin: 3px 0; font-size: 14px; }
            .rx { font-size: 40px; color: #285444; font-family: Georgia, serif; font-style: italic; line-height: 1; margin-bottom: 20px; }
            .signature-section { margin-top: 80px; display: flex; justify-content: flex-end; }
            .signature-line { width: 250px; border-top: 1px solid #1f2937; text-align: center; padding-top: 8px; }
            .signature-line p { margin: 2px 0; font-size: 12px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${datosClinica.logoUrl}" class="logo" alt="Logo Clínica" />
            <div class="clinic-info">
              <h1 class="clinic-name">${datosClinica.nombreClinica}</h1>
              <h2 class="doc-name">${datosClinica.nombreMedico}</h2>
              <p class="doc-details">
                <strong>JVPM:</strong> ${datosClinica.jvpm} | <strong>Tel:</strong> ${datosClinica.telefono}<br/>
                <strong>Dirección:</strong> ${datosClinica.direccion}
              </p>
            </div>
          </div>
          <div class="patient-box">
            <div>
              <p><strong>Paciente:</strong> ${patientName}</p>
              <p><strong>Edad:</strong> ${edad !== null && edad >= 0 ? `${edad} años` : "No registrada"}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>N° Expediente:</strong> ${data?.patientFileNumber || patientProfile?.fileNumber || "N/A"}</p>
            </div>
          </div>
          <div class="content">
            <div class="rx">Rx</div>
            ${medsHTML}
          </div>
          <div class="signature-section">
            <div class="signature-line">
              <strong>${datosClinica.nombreMedico}</strong>
              <p>Firma y Sello</p>
            </div>
          </div>
        </body>
      </html>`;
  };

  const handlePreviewPrescription = () => {
    if (medicamentos.length === 0 || !medicamentos.some((m) => m.name.trim() !== "")) {
      return toast.error("Agrega al menos un medicamento válido para previsualizar.");
    }
    setPrescriptionPreview({ open: true, html: buildPrescriptionHtml() });
  };

  const openDocumentModal = (type) => {
    setDocModal({ open: true, type });
  };

  const onSubmit = (formData) => {
    const medicamentosPreparados = medicamentos
      .filter((m) => m.name.trim())
      .map((med) => ({
        name: med.name,
        concentration: med.concentration || null,
        concentrationUnit: med.concentrationUnit,
        dose: med.doseAmount ? String(med.doseAmount) : "",
        doseUnit: med.doseUnit,
        route: med.route,
        frequency: med.frequencyAmount ? `Cada ${med.frequencyAmount} ${med.frequencyUnit}` : "",
        duration: med.durationAmount ? `Por ${med.durationAmount} ${med.durationUnit}` : "",
        additionalInstructions: med.additionalInstructions || null,
      }));

    const body = {
      ...formData,
      bloodPressure: toNull(formData.bloodPressure),
      temperature: toNull(formData.temperature),
      heartRate: toNull(formData.heartRate),
      oxygenSaturation: toNull(formData.oxygenSaturation),
      weight: toNull(formData.weight),
      height: toNull(formData.height),
      bmi: bmi ? String(bmi) : null,
      insurerId: formData.billingType === "insurance" ? formData.insurerId : undefined,
      agreedAmount: formData.billingType === "insurance" ? formData.agreedAmount : undefined,
      // Código CIE-10 confirmado por el médico (HU-07 + analítica).
      diagnosisCode: diagnosisCode?.code || null,
      diagnosisCodeName: diagnosisCode?.name || null,
      medicamentos: medicamentosPreparados,
    };

    finishMutation.mutate(
      { id, data: body },
      {
        onSuccess: () => {
          toast.success("Consulta finalizada con éxito");
          setTimeout(() => navigate("/doctor"), 1200);
        },
        onError: (err) => toast.error(err.message || "Error al finalizar la consulta"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando consulta…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="page" style={{ textAlign: "center", color: "var(--accent-coral)" }}>
        Error al cargar datos.
      </div>
    );
  }

  const isMale = (data.patientGender || data.gender || patientProfile?.gender)?.toLowerCase() === "male";
  const patientName = data.patientName || data.fullName || patientProfile?.fullName || "Paciente";

  return (
    <div className="page" style={{ maxWidth: "1350px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Consulta médica</span>
          <h1 className="page-header__heading">{patientName}</h1>
          <p className="page-header__sub">
            {edad !== null && edad >= 0 ? `${edad} años` : "Edad N/A"} · {isMale ? "Masculino" : "Femenino"} · Exp:{" "}
            {data.patientFileNumber || patientProfile?.fileNumber || "N/A"}
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" onClick={() => setShowHistory(true)} className="btn btn-secondary">
            <i className="ri-history-line"></i> Ver historial clínico
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: "grid", gridTemplateColumns: "370px 1fr", gap: "2rem", alignItems: "start" }}>
          <aside
            className="card"
            style={{ position: "sticky", top: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                padding: "0.9rem 1rem",
                background: "var(--brand-soft)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--brand-soft)",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--brand)",
                }}
              >
                Motivo
              </span>
              <p style={{ margin: "0.35rem 0 0", color: "var(--fg-primary)", fontSize: "0.92rem" }}>
                {data.motivo || "N/A"}
              </p>
            </div>

            <div>
              <h3
                style={{
                  color: "var(--fg-primary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  margin: "0 0 0.35rem",
                  letterSpacing: "-0.01em",
                }}
              >
                Signos vitales
              </h3>

              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
                  P. arterial{" "}
                  <small style={{ color: bpInfo.color, fontWeight: 600 }}>{bpInfo.label}</small>
                </span>
                <input type="text" placeholder="120/80" style={vitalInput} {...register("bloodPressure")} />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
                  Temp (°C){" "}
                  <small style={{ color: getVitalStatus("temp", currentTemp).color, fontWeight: 600 }}>
                    {getVitalStatus("temp", currentTemp).label}
                  </small>
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  onKeyDown={preventNegative}
                  style={vitalInput}
                  {...register("temperature")}
                />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
                  Frec. cardíaca{" "}
                  <small style={{ color: getVitalStatus("hr", currentHr).color, fontWeight: 600 }}>
                    {getVitalStatus("hr", currentHr).label}
                  </small>
                </span>
                <input
                  type="number"
                  min="0"
                  onKeyDown={preventNegative}
                  style={vitalInput}
                  {...register("heartRate")}
                />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
                  SatO₂ (%){" "}
                  <small style={{ color: getVitalStatus("o2", currentO2).color, fontWeight: 600 }}>
                    {getVitalStatus("o2", currentO2).label}
                  </small>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  onKeyDown={preventNegative}
                  style={vitalInput}
                  {...register("oxygenSaturation")}
                />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)" }}>Peso (lb)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  onKeyDown={preventNegative}
                  style={vitalInput}
                  {...register("weight")}
                />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)" }}>Estatura (m)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  onKeyDown={preventNegative}
                  style={vitalInput}
                  {...register("height")}
                />
              </div>
              <div style={vitalRow}>
                <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
                  IMC{" "}
                  <small style={{ color: imcInfo.color, fontWeight: 600 }}>{imcInfo.label}</small>
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--fg-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {bmi || "N/A"}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "var(--bg-surface-alt)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <strong style={{ fontSize: "0.9rem", color: "var(--fg-primary)" }}>Antecedentes</strong>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {!isEditingAntecedents && (tempPersonalHistory || tempFamilyHistory) && (
                    <button
                      type="button"
                      disabled={extractHistoryMutation.isPending}
                      onClick={() => {
                        const combined = [tempPersonalHistory, tempFamilyHistory].filter(Boolean).join(". ");
                        extractHistoryMutation.mutate(combined, {
                          onSuccess: (result) => {
                            setStructuredHistory(result);
                            toast.success("Antecedentes estructurados.");
                          },
                        });
                      }}
                      style={{
                        color: "var(--accent-plum)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      <i className="ri-sparkling-2-line"></i>{" "}
                      {extractHistoryMutation.isPending ? "Analizando…" : "Estructurar IA"}
                    </button>
                  )}
                  {!isEditingAntecedents ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingAntecedents(true)}
                      style={{
                        color: "var(--brand)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveAntecedents}
                      disabled={updatePatientMutation.isPending}
                      style={{
                        color: "var(--accent-forest)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {updatePatientMutation.isPending ? "Guardando…" : "Guardar"}
                    </button>
                  )}
                </div>
              </div>

              {structuredHistory && !isEditingAntecedents && (
                <div
                  style={{
                    marginBottom: "0.75rem",
                    padding: "0.65rem 0.8rem",
                    background: "var(--accent-plum-soft)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    color: "var(--fg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  {structuredHistory.allergies?.length > 0 && (
                    <div>
                      <strong style={{ color: "var(--accent-coral)" }}>Alergias:</strong>{" "}
                      {structuredHistory.allergies.join(", ")}
                    </div>
                  )}
                  {structuredHistory.chronicConditions?.length > 0 && (
                    <div>
                      <strong style={{ color: "var(--accent-ochre)" }}>Crónicas:</strong>{" "}
                      {structuredHistory.chronicConditions.join(", ")}
                    </div>
                  )}
                  {structuredHistory.surgeries?.length > 0 && (
                    <div>
                      <strong>Cirugías:</strong>{" "}
                      {structuredHistory.surgeries.map((s) => `${s.name}${s.year ? ` (${s.year})` : ""}`).join(", ")}
                    </div>
                  )}
                  {structuredHistory.currentMedications?.length > 0 && (
                    <div>
                      <strong>Medicación actual:</strong>{" "}
                      {structuredHistory.currentMedications.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {isEditingAntecedents ? (
                <>
                  <label style={fieldLabel}>Personales</label>
                  <textarea
                    value={tempPersonalHistory}
                    onChange={(e) => setTempPersonalHistory(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: "0.6rem", width: "100%" }}
                    rows={3}
                  />
                  <label style={fieldLabel}>Familiares</label>
                  <textarea
                    value={tempFamilyHistory}
                    onChange={(e) => setTempFamilyHistory(e.target.value)}
                    className="form-input"
                    style={{ width: "100%" }}
                    rows={3}
                  />
                </>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                  <p style={{ margin: "0 0 0.6rem 0" }}>
                    <strong>Personales:</strong>
                    <br />
                    {tempPersonalHistory || "Ninguno registrado."}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Familiares:</strong>
                    <br />
                    {tempFamilyHistory || "Ninguno registrado."}
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <section className="card">
              <h2 className="card-heading">Consulta médica</h2>
              <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Anamnesis / historia de enfermedad actual *</label>
                    <button
                      type="button"
                      className="btn btn-ai btn-sm"
                      disabled={draftAnamnesisMutation.isPending}
                      onClick={() => {
                        draftAnamnesisMutation.mutate(
                          {
                            motivo: data?.motivo,
                            edad,
                            genero: isMale ? "male" : "female",
                            signosVitales: {
                              bloodPressure: currentBp,
                              temperature: currentTemp,
                              heartRate: currentHr,
                              oxygenSaturation: currentO2,
                              weight: currentWeight,
                              height: currentHeight,
                              bmi,
                            },
                            antecedentes: {
                              personal: tempPersonalHistory,
                              familiares: tempFamilyHistory,
                            },
                          },
                          {
                            onSuccess: (result) => {
                              const existing = watch("anamnesis") || "";
                              const newText = existing.trim()
                                ? `${existing}\n\n[Borrador IA]\n${result.draft}`
                                : result.draft;
                              setValue("anamnesis", newText, { shouldValidate: true });
                              toast.success("Borrador de anamnesis generado. Revisa y edita.");
                            },
                          }
                        );
                      }}
                    >
                      <i className="ri-sparkling-2-line"></i>
                      {draftAnamnesisMutation.isPending ? "Generando…" : "Borrador con IA"}
                    </button>
                  </div>
                  <textarea className="form-input" rows={4} {...register("anamnesis")} />
                  {errors.anamnesis && <span className="field-error">{errors.anamnesis.message}</span>}
                  {draftAnamnesisMutation.data?.suggestedQuestions?.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.6rem 0.8rem",
                        background: "var(--accent-plum-soft)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.82rem",
                        color: "var(--accent-plum)",
                      }}
                    >
                      <strong>Preguntas sugeridas:</strong>
                      <ul style={{ margin: "0.3rem 0 0 1rem", padding: 0 }}>
                        {draftAnamnesisMutation.data.suggestedQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Examen físico</label>
                  <textarea className="form-input" rows={3} {...register("physicalExam")} />
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Diagnóstico *</label>
                    <button
                      type="button"
                      className="btn btn-ai btn-sm"
                      disabled={suggestIcd10Mutation.isPending}
                      onClick={() => {
                        const dxText = watch("diagnosis");
                        if (!dxText || dxText.trim().length < 2) {
                          toast.error("Escribe primero el diagnóstico.");
                          return;
                        }
                        suggestIcd10Mutation.mutate(dxText, {
                          onSuccess: (result) => {
                            setIcd10Suggestion(result);
                            toast.success("Sugerencia CIE-10 lista.");
                          },
                        });
                      }}
                    >
                      <i className="ri-sparkling-2-line"></i>
                      {suggestIcd10Mutation.isPending ? "Analizando…" : "Sugerir CIE-10"}
                    </button>
                  </div>
                  <textarea className="form-input" rows={2} {...register("diagnosis")} />
                  {errors.diagnosis && <span className="field-error">{errors.diagnosis.message}</span>}

                  {icd10Suggestion && (
                    <div
                      style={{
                        marginTop: "0.6rem",
                        padding: "0.75rem 0.9rem",
                        background: diagnosisCode?.code === icd10Suggestion.code
                          ? "var(--accent-forest-soft)"
                          : "var(--accent-plum-soft)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${diagnosisCode?.code === icd10Suggestion.code ? "var(--accent-forest)" : "var(--accent-plum-soft)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                            Sugerencia CIE-10 · confianza {(icd10Suggestion.confidence * 100).toFixed(0)}%
                          </div>
                          <div style={{ marginTop: "0.25rem", fontWeight: 600, color: "var(--fg-primary)" }}>
                            <span style={{ fontFamily: "var(--font-mono)" }}>{icd10Suggestion.code}</span>
                            {" — "}
                            {icd10Suggestion.canonicalName}
                          </div>
                          {icd10Suggestion.alternatives?.length > 0 && (
                            <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
                              Alternativas: {icd10Suggestion.alternatives.map((a) => `${a.code} ${a.canonicalName}`).join(" · ")}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                          {diagnosisCode?.code === icd10Suggestion.code ? (
                            <span className="badge badge-success badge-dot">Aceptada</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setDiagnosisCode({ code: icd10Suggestion.code, name: icd10Suggestion.canonicalName });
                                  toast.success(`Código ${icd10Suggestion.code} aceptado.`);
                                }}
                              >
                                <i className="ri-check-line"></i> Aceptar
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setIcd10Suggestion(null)}
                              >
                                Descartar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {diagnosisCode && !icd10Suggestion && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        background: "var(--accent-forest-soft)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.82rem",
                        color: "var(--accent-forest)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        <strong style={{ fontFamily: "var(--font-mono)" }}>{diagnosisCode.code}</strong>
                        {" — "}{diagnosisCode.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDiagnosisCode(null)}
                        style={{ background: "none", border: "none", color: "var(--accent-forest)", cursor: "pointer" }}
                        aria-label="Quitar código"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Resultados de laboratorio</label>
                    <textarea className="form-input" rows={2} {...register("labResults")} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Observaciones</label>
                    <textarea className="form-input" rows={2} {...register("observations")} />
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="card-heading">Cobertura de la consulta</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: billingType === "insurance" ? "1fr 1fr 1fr" : "1fr",
                  gap: "1rem",
                  marginTop: "0.75rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Tipo de cobertura</label>
                  <select
                    className="form-input"
                    {...billingTypeField}
                    onChange={(e) => {
                      billingTypeField.onChange(e);
                      if (e.target.value !== "insurance") {
                        setValue("insurerId", "", { shouldValidate: true });
                        setValue("agreedAmount", "", { shouldValidate: false });
                      }
                    }}
                  >
                    <option value="private">Particular</option>
                    <option value="insurance">Aseguradora</option>
                  </select>
                </div>
                {billingType === "insurance" && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Aseguradora</label>
                      <select
                        className="form-input"
                        {...insurerField}
                        onChange={(e) => {
                          insurerField.onChange(e);
                          const ins = insurers.find((i) => String(i.id) === String(e.target.value));
                          setValue("agreedAmount", ins ? String(ins.fixedConsultationAmount ?? "") : "", { shouldValidate: true });
                        }}
                      >
                        <option value="">Seleccione una aseguradora</option>
                        {insurers.filter((i) => i.status !== "inactive").map((i) => (
                          <option key={i.id} value={i.id}>{i.companyName}</option>
                        ))}
                      </select>
                      {errors.insurerId && <span className="field-error">{errors.insurerId.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monto a cubrir</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        onKeyDown={preventNegative}
                        className="form-input"
                        {...register("agreedAmount")}
                      />
                      {errors.agreedAmount && <span className="field-error">{errors.agreedAmount.message}</span>}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.6rem",
                }}
              >
                <h2 className="card-heading" style={{ margin: 0 }}>
                  Receta médica ({medicamentos.length})
                </h2>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => openDocumentModal("constancia")} className="btn btn-secondary btn-sm">
                    <i className="ri-file-text-line"></i> Constancia
                  </button>
                  <button type="button" onClick={() => openDocumentModal("incapacidad")} className="btn btn-secondary btn-sm">
                    <i className="ri-health-book-line"></i> Incapacidad
                  </button>
                  <button
                    type="button"
                    className="btn btn-ai btn-sm"
                    disabled={checkPrescriptionMutation.isPending || medicamentos.length === 0}
                    onClick={() => {
                      checkPrescriptionMutation.mutate(
                        {
                          medications: medicamentos,
                          patient: {
                            age: edad,
                            gender: isMale ? "male" : "female",
                            isMinor: !!patientProfile?.isMinor,
                            personalHistory: tempPersonalHistory,
                            familyHistory: tempFamilyHistory,
                          },
                        },
                        {
                          onSuccess: (result) => {
                            setRxSafetyCheck(result);
                            if (result.allClear) {
                              toast.success("Receta revisada: sin alertas.");
                            } else {
                              toast(`Receta revisada: ${result.warnings.length} alerta(s).`, { icon: "⚠️" });
                            }
                          },
                        }
                      );
                    }}
                  >
                    <i className="ri-sparkling-2-line"></i>
                    {checkPrescriptionMutation.isPending ? "Revisando…" : "Revisar con IA"}
                  </button>
                  <button type="button" onClick={handlePreviewPrescription} className="btn btn-secondary btn-sm">
                    <i className="ri-eye-line"></i> Previsualizar
                  </button>
                  <button type="button" onClick={agregarMedicamento} className="btn btn-primary btn-sm">
                    <i className="ri-add-line"></i> Agregar
                  </button>
                </div>
              </div>

              {rxSafetyCheck && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.9rem 1.1rem",
                    borderRadius: "var(--radius-md)",
                    background: rxSafetyCheck.allClear ? "var(--accent-forest-soft)" : "var(--accent-coral-soft)",
                    border: `1px solid ${rxSafetyCheck.allClear ? "var(--accent-forest)" : "var(--accent-coral)"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: rxSafetyCheck.warnings?.length ? "0.5rem" : 0 }}>
                    <strong style={{ color: rxSafetyCheck.allClear ? "var(--accent-forest)" : "var(--accent-coral)" }}>
                      <i className={rxSafetyCheck.allClear ? "ri-shield-check-line" : "ri-alert-line"}></i>{" "}
                      {rxSafetyCheck.allClear
                        ? "IA: no detectó alertas en esta receta"
                        : `IA detectó ${rxSafetyCheck.warnings.length} alerta(s)`}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setRxSafetyCheck(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)" }}
                      aria-label="Cerrar alerta"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                  {rxSafetyCheck.warnings?.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        marginTop: "0.4rem",
                        padding: "0.5rem 0.7rem",
                        background: "var(--bg-surface)",
                        borderRadius: "var(--radius-sm)",
                        borderLeft: `3px solid ${
                          w.severity === "high" ? "var(--accent-coral)"
                            : w.severity === "medium" ? "var(--accent-ochre)"
                            : "var(--accent-slate)"
                        }`,
                        fontSize: "0.88rem",
                        color: "var(--fg-primary)",
                      }}
                    >
                      {w.medication && <strong>{w.medication}: </strong>}
                      {w.message}
                    </div>
                  ))}
                </div>
              )}

              {medicamentos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--fg-muted)",
                    padding: "2rem 1rem",
                    background: "var(--bg-surface-alt)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-default)",
                  }}
                >
                  No se han agregado medicamentos.
                </div>
              ) : (
                medicamentos.map((med, idx) => (
                  <div
                    key={med.clientId}
                    style={{
                      padding: "1.2rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "1rem",
                      background: "var(--bg-surface-alt)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ color: "var(--fg-secondary)", fontSize: "0.9rem" }}>
                        Medicamento #{idx + 1}
                      </strong>
                      <button
                        type="button"
                        onClick={() => removeMed(idx)}
                        style={{
                          color: "var(--accent-coral)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.3rem",
                        }}
                        title="Eliminar"
                        aria-label={`Eliminar medicamento ${idx + 1}`}
                      >
                        <i className="ri-delete-bin-line" style={{ fontSize: "1.2rem" }}></i>
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={fieldLabel}>Nombre *</label>
                          <input
                            placeholder="Ej. Paracetamol"
                            className="form-input"
                            value={med.name}
                            onChange={(e) => updateMed(idx, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={fieldLabel}>Concentración</label>
                          <input
                            type="number"
                            min="0"
                            onKeyDown={preventNegative}
                            placeholder="Ej. 500"
                            className="form-input"
                            value={med.concentration}
                            onChange={(e) => updateMed(idx, "concentration", e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={fieldLabel}>Unidad</label>
                          <select
                            style={medSelect}
                            value={med.concentrationUnit}
                            onChange={(e) => updateMed(idx, "concentrationUnit", e.target.value)}
                          >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="mcg">mcg</option>
                            <option value="UI">UI</option>
                            <option value="%">%</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr", gap: "0.75rem" }}>
                        <div>
                          <label style={fieldLabel}>Vía admin.</label>
                          <select
                            style={medSelect}
                            value={med.route}
                            onChange={(e) => updateMed(idx, "route", e.target.value)}
                          >
                            <option value="Oral">Oral</option>
                            <option value="Tópica">Tópica</option>
                            <option value="Intravenosa">Intravenosa</option>
                            <option value="Intramuscular">Intramuscular</option>
                            <option value="Ótica">Ótica (Oído)</option>
                            <option value="Oftálmica">Oftálmica (Ojos)</option>
                            <option value="Vaginal">Vaginal</option>
                            <option value="Rectal">Rectal</option>
                          </select>
                        </div>

                        <div>
                          <label style={fieldLabel}>Tomar/aplicar</label>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="number"
                              min="0"
                              onKeyDown={preventNegative}
                              placeholder="Ej. 1"
                              className="form-input"
                              value={med.doseAmount}
                              onChange={(e) => updateMed(idx, "doseAmount", e.target.value)}
                              style={{ width: "72px" }}
                            />
                            <select
                              style={{ ...medSelect, flex: 1 }}
                              value={med.doseUnit}
                              onChange={(e) => updateMed(idx, "doseUnit", e.target.value)}
                            >
                              <option value="Tableta(s)">Tableta(s)</option>
                              <option value="Cápsula(s)">Cápsula(s)</option>
                              <option value="Mililitro(s)">Mililitro(s)</option>
                              <option value="Gota(s)">Gota(s)</option>
                              <option value="Supositorio(s)">Supositorio(s)</option>
                              <option value="Ampolleta(s)">Ampolleta(s)</option>
                              <option value="Óvulo(s)">Óvulo(s)</option>
                              <option value="Aplicación(es)">Aplicación(es)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={fieldLabel}>Frecuencia (cada…)</label>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="number"
                              min="0"
                              onKeyDown={preventNegative}
                              placeholder="Ej. 8"
                              className="form-input"
                              value={med.frequencyAmount}
                              onChange={(e) => updateMed(idx, "frequencyAmount", e.target.value)}
                              style={{ width: "72px" }}
                            />
                            <select
                              style={{ ...medSelect, flex: 1 }}
                              value={med.frequencyUnit}
                              onChange={(e) => updateMed(idx, "frequencyUnit", e.target.value)}
                            >
                              <option value="horas">Hora(s)</option>
                              <option value="días">Día(s)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                        <div>
                          <label style={fieldLabel}>Duración (por…)</label>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <input
                              type="number"
                              min="0"
                              onKeyDown={preventNegative}
                              placeholder="Ej. 5"
                              className="form-input"
                              value={med.durationAmount}
                              onChange={(e) => updateMed(idx, "durationAmount", e.target.value)}
                              style={{ width: "84px" }}
                            />
                            <select
                              style={{ ...medSelect, flex: 1 }}
                              value={med.durationUnit}
                              onChange={(e) => updateMed(idx, "durationUnit", e.target.value)}
                            >
                              <option value="días">Día(s)</option>
                              <option value="semanas">Semana(s)</option>
                              <option value="meses">Mes(es)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={fieldLabel}>Indicaciones de uso</label>
                          <input
                            placeholder="Ej. Tomar después de las comidas"
                            className="form-input"
                            value={med.additionalInstructions}
                            onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={finishMutation.isPending}
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {finishMutation.isPending ? "Finalizando…" : "Finalizar consulta"}
            </button>
          </main>
        </div>
      </form>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={`Historial clínico — ${patientName}`}
        size="xl"
      >
        <ClinicalHistoryTimeline
          history={historialClinico}
          isLoading={historialLoading}
          isError={historialError}
          patientId={patientId}
        />
      </Modal>

      <PrescriptionPreviewModal
        isOpen={prescriptionPreview.open}
        onClose={() => setPrescriptionPreview({ open: false, html: "" })}
        html={prescriptionPreview.html}
        patientName={patientName}
      />

      <GenerateDocumentModal
        isOpen={docModal.open}
        onClose={() => setDocModal({ open: false, type: null })}
        type={docModal.type}
        patientId={patientId}
        consultationId={null}
        patientName={patientName}
        clinicSettings={settings}
        doctor={session?.user}
        patient={patientProfile}
        diagnosis={watch("diagnosis")}
        motivo={data?.motivo}
      />
    </div>
  );
};
