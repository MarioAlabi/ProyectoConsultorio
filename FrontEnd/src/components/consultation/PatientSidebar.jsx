import { useState, useMemo, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { useUpdatePatient } from "../../hooks/usePatients";
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, clasificarIMC } from "../../lib/utils";

const NEUTRAL = "var(--fg-muted)";
const OK = "var(--accent-forest)";
const WARN = "var(--accent-ochre)";
const DANGER = "var(--accent-coral)";
const INFO = "var(--accent-slate)";

const preventNegative = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
};

const getVitalStatus = (type, value) => {
  if (value === null || value === undefined || value === "") return { label: "", color: NEUTRAL };
  const num = parseFloat(value);
  if (isNaN(num)) return { label: "", color: NEUTRAL };
  switch (type) {
    case "temp": return num < 36 ? { label: "Baja", color: INFO } : num > 37.5 ? { label: "Fiebre", color: DANGER } : { label: "Normal", color: OK };
    case "hr": return num < 60 ? { label: "Bradicardia", color: INFO } : num > 100 ? { label: "Taquicardia", color: DANGER } : { label: "Normal", color: OK };
    case "o2": return num < 90 ? { label: "Crítica", color: DANGER } : num < 95 ? { label: "Baja", color: WARN } : { label: "Normal", color: OK };
    default: return { label: "", color: NEUTRAL };
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

const vitalRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid var(--border-subtle)" };
const vitalInput = { width: "90px", padding: "0.35rem 0.55rem", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", textAlign: "right", outline: "none", fontSize: "0.88rem", background: "var(--bg-surface)", fontFamily: "var(--font-mono)", color: "var(--fg-primary)" };
const fieldLabel = { fontSize: "0.78rem", color: "var(--fg-muted)", marginBottom: "0.3rem", display: "block", fontWeight: 500 };


export const PatientSidebar = ({ data, patientProfile, patientId, historialClinico, historialLoading, historialError }) => {
  const { register, watch } = useFormContext();
  
  const updatePatientMutation = useUpdatePatient();

  const [showHistory, setShowHistory] = useState(false);
  const [isEditingAntecedents, setIsEditingAntecedents] = useState(false);
  const [tempPersonalHistory, setTempPersonalHistory] = useState("");
  const [tempFamilyHistory, setTempFamilyHistory] = useState("");

  const currentWeight = watch("weight");
  const currentHeight = watch("height");
  const currentBp = watch("bloodPressure");
  const currentTemp = watch("temperature");
  const currentHr = watch("heartRate");
  const currentO2 = watch("oxygenSaturation");

  useEffect(() => {
    if (patientProfile) {
      setTempPersonalHistory(patientProfile.personalHistory || "");
      setTempFamilyHistory(patientProfile.familyHistory || "");
    }
  }, [patientProfile]);

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

  const bmi = useMemo(() => {
    if (!currentWeight || !currentHeight) return null;
    const wKg = parseFloat(currentWeight) * 0.453592;
    return (wKg / (parseFloat(currentHeight) ** 2)).toFixed(2);
  }, [currentWeight, currentHeight]);

  const imcInfo = clasificarIMC(bmi ? parseFloat(bmi) : null) || { label: "N/A", color: NEUTRAL };
  const bpInfo = getBpStatus(currentBp);

  return (
    <aside className="card" style={{ position: "sticky", top: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      
      {/* MOTIVO DE CONSULTA */}
      <div style={{ padding: "0.9rem 1rem", background: "var(--brand-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--brand-soft)" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand)" }}>
          Motivo
        </span>
        <p style={{ margin: "0.35rem 0 0", color: "var(--fg-primary)", fontSize: "0.92rem" }}>
          {data.motivo || "N/A"}
        </p>
      </div>

      {/* SIGNOS VITALES */}
      <div>
        <h3 style={{ color: "var(--fg-primary)", fontFamily: "var(--font-display)", fontSize: "1rem", margin: "0 0 0.35rem", letterSpacing: "-0.01em" }}>
          Signos vitales
        </h3>

        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
            P. arterial <small style={{ color: bpInfo.color, fontWeight: 600 }}>{bpInfo.label}</small>
          </span>
          <input type="text" placeholder="120/80" style={vitalInput} {...register("bloodPressure")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
            Temp (°C) <small style={{ color: getVitalStatus("temp", currentTemp).color, fontWeight: 600 }}>{getVitalStatus("temp", currentTemp).label}</small>
          </span>
          <input type="number" step="0.1" min="0" onKeyDown={preventNegative} style={vitalInput} {...register("temperature")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
            Frec. cardíaca <small style={{ color: getVitalStatus("hr", currentHr).color, fontWeight: 600 }}>{getVitalStatus("hr", currentHr).label}</small>
          </span>
          <input type="number" min="0" onKeyDown={preventNegative} style={vitalInput} {...register("heartRate")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
            SatO₂ (%) <small style={{ color: getVitalStatus("o2", currentO2).color, fontWeight: 600 }}>{getVitalStatus("o2", currentO2).label}</small>
          </span>
          <input type="number" min="0" max="100" onKeyDown={preventNegative} style={vitalInput} {...register("oxygenSaturation")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)" }}>Peso (lb)</span>
          <input type="number" step="0.1" min="0" onKeyDown={preventNegative} style={vitalInput} {...register("weight")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)" }}>Estatura (m)</span>
          <input type="number" step="0.01" min="0" onKeyDown={preventNegative} style={vitalInput} {...register("height")} />
        </div>
        
        <div style={vitalRow}>
          <span style={{ color: "var(--fg-muted)", display: "flex", flexDirection: "column" }}>
            IMC <small style={{ color: imcInfo.color, fontWeight: 600 }}>{imcInfo.label}</small>
          </span>
          <span style={{ fontWeight: 600, color: "var(--fg-primary)", fontFamily: "var(--font-mono)" }}>
            {bmi || "N/A"}
          </span>
        </div>
      </div>

      <div style={{ padding: "1rem", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--fg-primary)" }}>Antecedentes</strong>
          {!isEditingAntecedents ? (
            <button type="button" onClick={() => setIsEditingAntecedents(true)} style={{ color: "var(--brand)", border: "none", background: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Editar</button>
          ) : (
            <button type="button" onClick={handleSaveAntecedents} disabled={updatePatientMutation.isPending} style={{ color: "var(--accent-forest)", border: "none", background: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              {updatePatientMutation.isPending ? "Guardando…" : "Guardar"}
            </button>
          )}
        </div>

        {isEditingAntecedents ? (
          <>
            <label style={fieldLabel}>Personales</label>
            <textarea value={tempPersonalHistory} onChange={(e) => setTempPersonalHistory(e.target.value)} className="form-input" style={{ marginBottom: "0.6rem", width: "100%" }} rows={3} />
            <label style={fieldLabel}>Familiares</label>
            <textarea value={tempFamilyHistory} onChange={(e) => setTempFamilyHistory(e.target.value)} className="form-input" style={{ width: "100%" }} rows={3} />
          </>
        ) : (
          <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
            <p style={{ margin: "0 0 0.6rem 0" }}><strong>Personales:</strong><br />{tempPersonalHistory || "Ninguno registrado."}</p>
            <p style={{ margin: 0 }}><strong>Familiares:</strong><br />{tempFamilyHistory || "Ninguno registrado."}</p>
          </div>
        )}
      </div>

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`Historial clínico`} size="xl">
        <ClinicalHistoryTimeline history={historialClinico} isLoading={historialLoading} isError={historialError} />
      </Modal>

    </aside>
  );
};