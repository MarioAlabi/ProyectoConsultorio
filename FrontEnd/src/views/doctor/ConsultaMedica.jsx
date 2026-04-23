import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Hooks
import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { useInsurers } from "../../hooks/useInsurers";
import { usePatient, useUpdatePatient, usePatientClinicalHistory } from "../../hooks/usePatients";
import { useSettings } from "../../hooks/useSettings";
import { authClient } from "../../lib/auth-client";

// Componentes
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, clasificarIMC } from "../../lib/utils";
import "../../views/shared/Shared.css";

const toNull = (v) => (v === "" || v === undefined ? null : v);

const preventNegative = (e) => {
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
  }
};

const createMedicationDraft = () => ({
  clientId: crypto.randomUUID(),
  name: "", concentration: "", concentrationUnit: "mg", 
  doseAmount: "", doseUnit: "Tableta(s)", route: "Oral", 
  frequencyAmount: "", frequencyUnit: "horas",
  durationAmount: "", durationUnit: "días",
  additionalInstructions: "",
});

const getVitalStatus = (type, value) => {
  if (value === null || value === undefined || value === "") return { label: "", color: "#6b7280" };
  const num = parseFloat(value);
  if (isNaN(num)) return { label: "", color: "#6b7280" };
  switch (type) {
    case "temp": return num < 36 ? { label: "Baja", color: "#3b82f6" } : num > 37.5 ? { label: "Fiebre", color: "#ef4444" } : { label: "Normal", color: "#22c55e" };
    case "hr": return num < 60 ? { label: "Bradicardia", color: "#3b82f6" } : num > 100 ? { label: "Taquicardia", color: "#ef4444" } : { label: "Normal", color: "#22c55e" };
    case "o2": return num < 90 ? { label: "Crítica", color: "#ef4444" } : num < 95 ? { label: "Baja", color: "#f59e0b" } : { label: "Normal", color: "#22c55e" };
    default: return { label: "", color: "#6b7280" };
  }
};

const getBpStatus = (bp) => {
  if (!bp || !bp.includes("/")) return { label: "", color: "#6b7280" };
  const [sys, dia] = bp.split("/").map(Number);
  if (isNaN(sys) || isNaN(dia) || sys === 0 || dia === 0) return { label: "", color: "#6b7280" };
  if (sys < 90 || dia < 60) return { label: "Baja", color: "#3b82f6" }; 
  if (sys >= 160 || dia >= 100) return { label: "Grado 2", color: "#991b1b" }; 
  if (sys >= 140 || dia >= 90) return { label: "Grado 1", color: "#ef4444" }; 
  if (sys >= 130 || dia >= 85) return { label: "Normal-Alta", color: "#f59e0b" }; 
  return { label: "Normal", color: "#22c55e" }; 
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

  // ✅ SOLUCIÓN DE LA EDAD A PRUEBA DE BALAS
  const dobToUse = data?.patientDob || patientProfile?.yearOfBirth;
  // Solo aplicamos el .split() si es un texto (String), de lo contrario lo pasamos directo.
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

  const imcInfo = clasificarIMC(bmi ? parseFloat(bmi) : null) || { label: "N/A", color: "#6b7280" };
  const bpInfo = getBpStatus(currentBp);

  const handleSaveAntecedents = () => {
    if (!patientId) return toast.error("Error: ID de paciente no encontrado.");
    updatePatientMutation.mutate({ 
      id: patientId, data: { personalHistory: tempPersonalHistory, familyHistory: tempFamilyHistory } 
    }, {
      onSuccess: () => {
        setIsEditingAntecedents(false);
        toast.success("Antecedentes actualizados al vuelo.");
      }
    });
  };

  const agregarMedicamento = () => setMedicamentos((current) => [...current, createMedicationDraft()]);
  const updateMed = (idx, field, value) => {
    setMedicamentos((current) => { const copy = [...current]; copy[idx] = { ...copy[idx], [field]: value }; return copy; });
  };
  const removeMed = (idx) => setMedicamentos((current) => current.filter((_, i) => i !== idx));

  const handlePrintPrescription = () => {
    if (medicamentos.length === 0 || !medicamentos.some(m => m.name.trim() !== "")) {
      return toast.error("Agrega al menos un medicamento válido para imprimir.");
    }

    const datosClinica = {
      nombreClinica: settings?.clinicName || "Consultorio Médico Integral",
      nombreMedico: session?.user?.name ? `Dr/Dra. ${session.user.name}` : "Médico Tratante",
      jvpm: session?.user?.jvpm || settings?.jvpm || "---",
      telefono: session?.user?.phone || settings?.phone || "---",
      direccion: settings?.address || "---",
      logoUrl: settings?.logoUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%230d9488' d='M35 15h30v20h20v30H65v20H35V65H15V35h20z'/></svg>"
    };

    const patientName = data?.patientName || data?.fullName || patientProfile?.fullName || "Paciente";
    
    const medsHTML = medicamentos.filter(m => m.name.trim()).map((med) => {
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
    }).join("");

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receta Médica - ${patientName}</title>
          <style>
            @media print { @page { margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
            .clinic-info { flex-grow: 1; }
            .clinic-name { color: #0d9488; margin: 0 0 5px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .doc-name { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; color: #111827; }
            .doc-details { font-size: 12px; color: #4b5563; margin: 0; line-height: 1.4; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .patient-box p { margin: 3px 0; font-size: 14px; }
            .rx { font-size: 40px; color: #0d9488; font-family: Georgia, serif; font-style: italic; line-height: 1; margin-bottom: 20px; }
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
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        additionalInstructions: med.additionalInstructions || null
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
      medicamentos: medicamentosPreparados,
    };

    finishMutation.mutate({ id, data: body }, {
      onSuccess: () => {
        toast.success("Consulta finalizada con éxito");
        setTimeout(() => navigate("/doctor"), 1200);
      },
      onError: (err) => toast.error(err.message || "Error al finalizar la consulta")
    });
  };

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem" },
    layout: { display: "grid", gridTemplateColumns: "370px 1fr", gap: "2rem", maxWidth: "1350px", margin: "0 auto" },
    sidebar: { backgroundColor: "white", borderRadius: "18px", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", height: "fit-content", position: "sticky", top: "2rem" },
    main: { display: "flex", flexDirection: "column", gap: "1.5rem" },
    card: { backgroundColor: "white", borderRadius: "18px", padding: "2rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
    sectionTitle: { color: "#0d9488", margin: "0 0 1rem", fontSize: "1.1rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
    vitalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6" },
    vitalInput: { width: "80px", padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", textAlign: "right", outline: "none", fontSize: "0.9rem" },
    errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
    historyBtn: { width: "100%", padding: "0.8rem", borderRadius: "12px", border: "2px solid #0d9488", color: "#0d9488", background: "white", fontWeight: "600", cursor: "pointer", marginBottom: "1.5rem", transition: "all 0.2s" },
    antecedentsBox: { marginTop: "1rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" },
    medicationGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "12px" },
    medRow: { display: "flex", gap: "10px", alignItems: "center" },
    medSelect: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", outline: "none", width: "100%" }
  };

  if (isLoading) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p>Cargando consulta...</p></div>;
  if (isError || !data) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "red" }}>Error al cargar datos.</p></div>;
  
  const isMale = (data.patientGender || data.gender || patientProfile?.gender)?.toLowerCase() === "male";

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "contents" }}>
          
          <aside style={S.sidebar}>
            <button type="button" onClick={() => setShowHistory(true)} style={S.historyBtn}>
              <i className="ri-history-line" style={{ marginRight: "8px" }}></i> Ver Historial Clínico
            </button>

            <h2 style={{ margin: "0 0 0.5rem", color: "#1f2937" }}>{data.patientName || data.fullName || patientProfile?.fullName || "Paciente"}</h2>
            <p style={{ color: "#6b7280", margin: "0 0 1rem", fontSize: "0.9rem" }}>
              {edad !== null && edad >= 0 ? `${edad} años` : "Edad N/A"} | {isMale ? "Masculino" : "Femenino"} | Exp: {data.patientFileNumber || patientProfile?.fileNumber || "N/A"}
            </p>
            
            <h3 style={{ color: "#0d9488", fontSize: "1rem", margin: "1rem 0 0.5rem" }}>Signos Vitales</h3>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                P. Arterial <small style={{ color: bpInfo.color, fontWeight: 600 }}>{bpInfo.label}</small>
              </span>
              <input type="text" placeholder="120/80" style={S.vitalInput} {...register("bloodPressure")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                Temp (°C) <small style={{ color: getVitalStatus("temp", currentTemp).color, fontWeight: 600 }}>{getVitalStatus("temp", currentTemp).label}</small>
              </span>
              <input type="number" step="0.1" min="0" onKeyDown={preventNegative} style={S.vitalInput} {...register("temperature")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                Frec. Cardíaca <small style={{ color: getVitalStatus("hr", currentHr).color, fontWeight: 600 }}>{getVitalStatus("hr", currentHr).label}</small>
              </span>
              <input type="number" min="0" onKeyDown={preventNegative} style={S.vitalInput} {...register("heartRate")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                SatO2 (%) <small style={{ color: getVitalStatus("o2", currentO2).color, fontWeight: 600 }}>{getVitalStatus("o2", currentO2).label}</small>
              </span>
              <input type="number" min="0" max="100" onKeyDown={preventNegative} style={S.vitalInput} {...register("oxygenSaturation")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Peso (lb)</span>
              <input type="number" step="0.1" min="0" onKeyDown={preventNegative} style={S.vitalInput} {...register("weight")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Estatura (m)</span>
              <input type="number" step="0.01" min="0" onKeyDown={preventNegative} style={S.vitalInput} {...register("height")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                IMC <small style={{ color: imcInfo.color, fontWeight: 600 }}>{imcInfo.label}</small>
              </span>
              <span style={{ fontWeight: 600 }}>{bmi || "N/A"}</span>
            </div>

            <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f0fdfa", borderRadius: "10px" }}>
              <strong style={{ color: "#0d9488" }}>Motivo:</strong>
              <p style={{ margin: "0.3rem 0 0", color: "#374151", fontSize: "0.9rem" }}>{data.motivo || "N/A"}</p>
            </div>

            <div style={S.antecedentsBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>Antecedentes</strong>
                {!isEditingAntecedents ? (
                  <button type="button" onClick={() => setIsEditingAntecedents(true)} style={{ color: "#0d9488", border: "none", background: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Editar</button>
                ) : (
                  <button type="button" onClick={handleSaveAntecedents} disabled={updatePatientMutation.isPending} style={{ color: "#22c55e", border: "none", background: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                    {updatePatientMutation.isPending ? "Guardando..." : "Guardar"}
                  </button>
                )}
              </div>

              {isEditingAntecedents ? (
                <>
                  <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Personales</label>
                  <textarea value={tempPersonalHistory} onChange={(e) => setTempPersonalHistory(e.target.value)} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", padding: "8px", marginBottom: "10px" }} rows={3} />
                  <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Familiares</label>
                  <textarea value={tempFamilyHistory} onChange={(e) => setTempFamilyHistory(e.target.value)} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", padding: "8px" }} rows={3} />
                </>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  <p style={{ margin: "0 0 10px 0" }}><strong>Personales:</strong> <br/>{tempPersonalHistory || "Ninguno registrado."}</p>
                  <p style={{ margin: 0 }}><strong>Familiares:</strong> <br/>{tempFamilyHistory || "Ninguno registrado."}</p>
                </div>
              )}
            </div>
          </aside>

          <main style={S.main}>
            <div style={S.card}>
              <h2 style={S.sectionTitle}>Consulta Médica</h2>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Anamnesis / Historia de enfermedad actual *</label>
                <textarea className="form-input" rows={4} {...register("anamnesis")} />
                {errors.anamnesis && <span style={S.errorMsg}>{errors.anamnesis.message}</span>}
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Examen Físico</label>
                <textarea className="form-input" rows={3} {...register("physicalExam")} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Diagnóstico *</label>
                <textarea className="form-input" rows={2} {...register("diagnosis")} />
                {errors.diagnosis && <span style={S.errorMsg}>{errors.diagnosis.message}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Resultados de Laboratorio</label>
                  <textarea className="form-input" rows={2} {...register("labResults")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={2} {...register("observations")} />
                </div>
              </div>
            </div>

            <div style={S.card}>
              <h2 style={S.sectionTitle}>Cobertura de la consulta</h2>
              <div style={{ display: "grid", gridTemplateColumns: billingType === "insurance" ? "1fr 1fr 1fr" : "1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Tipo de cobertura</label>
                  <select className="form-input" {...billingTypeField} onChange={(e) => { billingTypeField.onChange(e); if (e.target.value !== "insurance") { setValue("insurerId", "", { shouldValidate: true }); setValue("agreedAmount", "", { shouldValidate: false }); } }} style={{ backgroundColor: "white" }}>
                    <option value="private">Normal</option>
                    <option value="insurance">Aseguradora</option>
                  </select>
                </div>
                {billingType === "insurance" && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Aseguradora</label>
                      <select className="form-input" {...insurerField} onChange={(e) => { insurerField.onChange(e); const ins = insurers.find((i) => String(i.id) === String(e.target.value)); setValue("agreedAmount", ins ? String(ins.fixedConsultationAmount ?? "") : "", { shouldValidate: true }); }} style={{ backgroundColor: "white" }}>
                        <option value="">Seleccione una aseguradora</option>
                        {insurers.filter((i) => i.status !== 'inactive').map((i) => (
                            <option key={i.id} value={i.id}>{i.companyName}</option>
                        ))}
                      </select>
                      {errors.insurerId && <span style={S.errorMsg}>{errors.insurerId.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monto a cubrir</label>
                      <input type="number" step="0.01" min="0" onKeyDown={preventNegative} className="form-input" {...register("agreedAmount")} />
                      {errors.agreedAmount && <span style={S.errorMsg}>{errors.agreedAmount.message}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Receta Médica ({medicamentos.length})</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={handlePrintPrescription} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #0d9488", color: "#0d9488", background: "white", cursor: "pointer", fontWeight: "600" }}>
                    <i className="ri-printer-line" style={{ marginRight: "5px" }}></i> Imprimir
                  </button>
                  <button type="button" onClick={agregarMedicamento} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", color: "white", background: "#0d9488", cursor: "pointer", fontWeight: "600" }}>
                    + Agregar
                  </button>
                </div>
              </div>
              
              {medicamentos.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af" }}>No se han agregado medicamentos.</p>
              ) : (
                medicamentos.map((med, idx) => (
                  <div key={med.clientId} style={{ padding: "1.2rem", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "1rem", background: "#f9fafb" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
                      <strong style={{ color: "#374151" }}>Medicamento #{idx + 1}</strong>
                      <button type="button" onClick={() => removeMed(idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "5px" }} title="Eliminar">
                        <i className="ri-delete-bin-line" style={{ fontSize: "1.2rem" }}></i>
                      </button>
                    </div>

                    <div style={S.medicationGrid}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "15px" }}>
                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Nombre *</label>
                          <input placeholder="Ej. Paracetamol" className="form-input" value={med.name} onChange={(e) => updateMed(idx, "name", e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Concentración</label>
                          <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 500" className="form-input" value={med.concentration} onChange={(e) => updateMed(idx, "concentration", e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Unidad</label>
                          <select style={S.medSelect} value={med.concentrationUnit} onChange={(e) => updateMed(idx, "concentrationUnit", e.target.value)}>
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="mcg">mcg</option>
                            <option value="UI">UI</option>
                            <option value="%">%</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr", gap: "15px" }}>
                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Vía Admin.</label>
                          <select style={S.medSelect} value={med.route} onChange={(e) => updateMed(idx, "route", e.target.value)}>
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
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Tomar/Aplicar</label>
                          <div style={S.medRow}>
                            <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 1" className="form-input" value={med.doseAmount} onChange={(e) => updateMed(idx, "doseAmount", e.target.value)} style={{ width: "60px" }} />
                            <select style={{ ...S.medSelect, flex: 1 }} value={med.doseUnit} onChange={(e) => updateMed(idx, "doseUnit", e.target.value)}>
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
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Frecuencia (Cada...)</label>
                          <div style={S.medRow}>
                            <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 8" className="form-input" value={med.frequencyAmount} onChange={(e) => updateMed(idx, "frequencyAmount", e.target.value)} style={{ width: "60px" }} />
                            <select style={{ ...S.medSelect, flex: 1 }} value={med.frequencyUnit} onChange={(e) => updateMed(idx, "frequencyUnit", e.target.value)}>
                              <option value="horas">Hora(s)</option>
                              <option value="días">Día(s)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px" }}>
                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Duración (Por...)</label>
                          <div style={S.medRow}>
                            <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 5" className="form-input" value={med.durationAmount} onChange={(e) => updateMed(idx, "durationAmount", e.target.value)} style={{ width: "80px" }} />
                            <select style={{ ...S.medSelect, flex: 1 }} value={med.durationUnit} onChange={(e) => updateMed(idx, "durationUnit", e.target.value)}>
                              <option value="días">Día(s)</option>
                              <option value="semanas">Semana(s)</option>
                              <option value="meses">Mes(es)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", display: "block" }}>Indicaciones de uso</label>
                          <input placeholder="Ej. Tomar después de las comidas" className="form-input" value={med.additionalInstructions} onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)} />
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={finishMutation.isPending} style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}>
              {finishMutation.isPending ? "Finalizando..." : "Finalizar Consulta"}
            </button>
          </main>
        </form>
      </div>

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`Historial Clínico - ${data?.patientName || "Paciente"}`} size="xl">
        <ClinicalHistoryTimeline history={historialClinico} isLoading={historialLoading} isError={historialError} />
      </Modal>
    </div>
  );
};