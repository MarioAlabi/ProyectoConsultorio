import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
/* eslint-disable no-unused-vars */
// Hooks
import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { useInsurers } from "../../hooks/useInsurers";
import { usePatient, useUpdatePatient, usePatientClinicalHistory } from "../../hooks/usePatients";

// Componentes
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, clasificarIMC } from "../../lib/utils";
import "../../views/shared/Shared.css";

const toNull = (v) => (v === "" || v === undefined ? null : v);
const createMedicationDraft = () => ({
  clientId: crypto.randomUUID(),
  name: "",
  concentration: "",
  concentrationUnit: "mg",
  dose: "",
  doseUnit: "tableta(s)",
  route: "Oral",
  frequency: "",
  duration: "",
  additionalInstructions: "",
});

// Ayudantes para alertas de Signos Vitales
const getVitalStatus = (type, value) => {
  if (value === null || value === undefined || value === "") return { label: "", color: "#6b7280" };
  const num = parseFloat(value);
  if (isNaN(num)) return { label: "", color: "#6b7280" };

  switch (type) {
    case "temp":
      if (num < 36) return { label: "Baja", color: "#3b82f6" };
      if (num > 37.5) return { label: "Fiebre", color: "#ef4444" };
      return { label: "Normal", color: "#22c55e" };
    case "hr":
      if (num < 60) return { label: "Bradicardia", color: "#3b82f6" };
      if (num > 100) return { label: "Taquicardia", color: "#ef4444" };
      return { label: "Normal", color: "#22c55e" };
    case "o2":
      if (num < 90) return { label: "Crítica", color: "#ef4444" };
      if (num < 95) return { label: "Baja", color: "#f59e0b" };
      return { label: "Normal", color: "#22c55e" };
    default:
      return { label: "", color: "#6b7280" };
  }
};

// Semáforo de Presión Arterial
// Semáforo de Presión Arterial (Escala Clínica de 5 niveles)
const getBpStatus = (bp) => {
  if (!bp || !bp.includes("/")) return { label: "", color: "#6b7280" };
  const [sys, dia] = bp.split("/").map(Number);
  if (isNaN(sys) || isNaN(dia) || sys === 0 || dia === 0) return { label: "", color: "#6b7280" };

  // 1. Hipotensión (Baja)
  if (sys < 90 || dia < 60) return { label: "Baja", color: "#3b82f6" }; // Azul

  // Evaluamos de la más grave a la más leve para que el valor peor "gane"
  
  // 2. Hipertensión Grado 2 (>= 160 o >= 100)
  if (sys >= 160 || dia >= 100) return { label: "Grado 2", color: "#991b1b" }; // Rojo Oscuro

  // 3. Hipertensión Grado 1 (>= 140 o >= 90)
  if (sys >= 140 || dia >= 90) return { label: "Grado 1", color: "#ef4444" }; // Rojo Claro

  // 4. Normal-Alta / Prehipertensión (130-139 o 85-89)
  if (sys >= 130 || dia >= 85) return { label: "Normal-Alta", color: "#f59e0b" }; // Naranja

  // 5. Si no cayó en ninguna de las anteriores, es Normal (<= 129 y <= 84)
  return { label: "Normal", color: "#22c55e" }; // Verde
};
export const ConsultaMedica = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Obtener la consulta pre-clínica
  const { data, isLoading, isError } = usePreclinicalRecord(id);

  // 2. Extraer y forzar el ID a String
  const patientId = useMemo(() => {
    const rawId = data?.patientId || data?.patient?.id || data?.patient_id;
    return rawId ? String(rawId) : null;
  }, [data]);

  // 3. Cargar perfil e historial del paciente
  const { data: patientProfile } = usePatient(patientId);
  const { data: historialClinico, isLoading: historialLoading, isError: historialError } = usePatientClinicalHistory(patientId);

  const finishMutation = useFinishConsultation();
  const updatePatientMutation = useUpdatePatient();
  const { data: insurers = [] } = useInsurers();

  const [medicamentos, setMedicamentos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  
  // Estados para antecedentes divididos
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

  // eslint-disable-next-line react-hooks/incompatible-library
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

  // Efecto: Bloquear el oxígeno a máximo 100%
  useEffect(() => {
    if (currentO2 && Number(currentO2) > 100) {
      setValue("oxygenSaturation", "100");
    }
  }, [currentO2, setValue]);

  // Llenar el formulario de pre-clínica
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

  // Llenar los antecedentes divididos cuando carga el perfil
  useEffect(() => {
    if (patientProfile) {
      setTempPersonalHistory(patientProfile.personalHistory || "");
      setTempFamilyHistory(patientProfile.familyHistory || "");
    }
  }, [patientProfile]);

  // Manejar Aseguradoras
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
      id: patientId, 
      data: { 
        personalHistory: tempPersonalHistory,
        familyHistory: tempFamilyHistory
      } 
    }, {
      onSuccess: () => {
        setIsEditingAntecedents(false);
        toast.success("Antecedentes actualizados al vuelo.");
      }
    });
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

  const onSubmit = (formData) => {
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
      medicamentos: medicamentos.filter((m) => m.name.trim()).map(({ clientId, ...medication }) => medication),
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
  };

  if (isLoading) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p>Cargando consulta...</p></div>;
  if (isError || !data) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "red" }}>Error al cargar datos.</p></div>;
  
  const edad = calcularEdad(data.patientDob);
  const isMale = (data.patientGender || data.gender || data.patient?.gender)?.toLowerCase() === "male";

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "contents" }}>
          
          {/* SIDEBAR: Info + Signos Vitales + Antecedentes (Personales y Familiares) */}
          <aside style={S.sidebar}>
            <button type="button" onClick={() => setShowHistory(true)} style={S.historyBtn}>
              <i className="ri-history-line" style={{ marginRight: "8px" }}></i> Ver Historial Clínico
            </button>

            <h2 style={{ margin: "0 0 0.5rem", color: "#1f2937" }}>{data.patientName || data.fullName || "Paciente"}</h2>
            <p style={{ color: "#6b7280", margin: "0 0 1rem", fontSize: "0.9rem" }}>
              {edad > 0 ? `${edad} años` : "Edad N/A"} | {isMale ? "Masculino" : "Femenino"} | Exp: {data.patientFileNumber || "N/A"}
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
              <input type="number" step="0.1" style={S.vitalInput} {...register("temperature")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                Frec. Cardíaca <small style={{ color: getVitalStatus("hr", currentHr).color, fontWeight: 600 }}>{getVitalStatus("hr", currentHr).label}</small>
              </span>
              <input type="number" style={S.vitalInput} {...register("heartRate")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                SatO2 (%) <small style={{ color: getVitalStatus("o2", currentO2).color, fontWeight: 600 }}>{getVitalStatus("o2", currentO2).label}</small>
              </span>
              <input type="number" style={S.vitalInput} max="100" {...register("oxygenSaturation")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Peso (lb)</span>
              <input type="number" step="0.1" style={S.vitalInput} {...register("weight")} />
            </div>
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Estatura (m)</span>
              <input type="number" step="0.01" style={S.vitalInput} {...register("height")} />
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

            {/* Antecedentes Personales y Familiares "Al Vuelo" */}
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
                  <textarea 
                    value={tempPersonalHistory} 
                    onChange={(e) => setTempPersonalHistory(e.target.value)}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", padding: "8px", marginBottom: "10px" }}
                    rows={3}
                  />
                  <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Familiares</label>
                  <textarea 
                    value={tempFamilyHistory} 
                    onChange={(e) => setTempFamilyHistory(e.target.value)}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", padding: "8px" }}
                    rows={3}
                  />
                </>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  <p style={{ margin: "0 0 10px 0" }}><strong>Personales:</strong> <br/>{tempPersonalHistory || "Ninguno registrado."}</p>
                  <p style={{ margin: 0 }}><strong>Familiares:</strong> <br/>{tempFamilyHistory || "Ninguno registrado."}</p>
                </div>
              )}
            </div>
          </aside>

          {/* MAIN: Formulario de la Consulta */}
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

            {/* SECCIÓN DE ASEGURADORAS */}
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
                        {insurers.map((i) => (<option key={i.id} value={i.id}>{i.companyName}</option>))}
                      </select>
                      {errors.insurerId && <span style={S.errorMsg}>{errors.insurerId.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monto a cubrir</label>
                      <input type="number" step="0.01" min="0.01" className="form-input" {...register("agreedAmount")} />
                      {errors.agreedAmount && <span style={S.errorMsg}>{errors.agreedAmount.message}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SECCIÓN RECETA */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Receta Médica ({medicamentos.length})</h2>
                <button type="button" onClick={agregarMedicamento} className="doc-btn" style={{ color: "#0d9488" }}>+ Agregar</button>
              </div>
              {medicamentos.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af" }}>No se han agregado medicamentos.</p>
              ) : (
                medicamentos.map((med, idx) => (
                  <div key={med.clientId} style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <strong>Med #{idx + 1}</strong>
                      <button type="button" onClick={() => removeMed(idx)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}><i className="ri-delete-bin-line"></i></button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <input placeholder="Nombre *" className="form-input" value={med.name} onChange={(e) => updateMed(idx, "name", e.target.value)} />
                      <input placeholder="Dosis" className="form-input" value={med.dose} onChange={(e) => updateMed(idx, "dose", e.target.value)} />
                      <input placeholder="Frecuencia" className="form-input" value={med.frequency} onChange={(e) => updateMed(idx, "frequency", e.target.value)} />
                      <input placeholder="Duración" className="form-input" value={med.duration} onChange={(e) => updateMed(idx, "duration", e.target.value)} />
                      <input placeholder="Indicaciones" style={{ gridColumn: "span 2" }} className="form-input" value={med.additionalInstructions} onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={finishMutation.isPending} style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}>
              {finishMutation.isPending ? "Finalizando..." : "Finalizar Consulta"}
            </button>
          </main>
        </form>
      </div>

      {/* MODAL HISTORIAL CON EL COMPONENTE OFICIAL */}
      <Modal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        title={`Historial Clínico - ${data?.patientName || "Paciente"}`} 
        size="xl"
      >
        <ClinicalHistoryTimeline 
          history={historialClinico} 
          isLoading={historialLoading} 
          isError={historialError} 
        />
      </Modal>
    </div>
  );
};