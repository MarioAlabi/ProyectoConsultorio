import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from "../../lib/api";
import '../../views/shared/Shared.css';

/* ── Helpers de clasificación IMC ── */
const clasificarIMC = (valor) => {
  if (valor < 18.5) return { clase: "Bajo Peso", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
  if (valor < 25)   return { clase: "Normal",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (valor < 30)   return { clase: "Sobrepeso", color: "#ca8a04", bg: "#fefce8", border: "#fde68a" };
  return                     { clase: "Obesidad",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
};

/* ── Helpers de rango para signos vitales ── */
const evaluarPresion = (pa) => {
  if (!pa) return null;
  const partes = pa.trim().split(/\s*\/\s*/);
  if (partes.length !== 2) return null;
  const sys = Number(partes[0]);
  const dia = Number(partes[1]);
  if (Number.isNaN(sys) || Number.isNaN(dia)) return null;
  if (sys >= 90 && sys <= 139 && dia >= 60 && dia <= 89) return { status: "normal", color: "#16a34a", label: "Normal" };
  if (sys >= 140 || dia >= 90) return { status: "alto", color: "#dc2626", label: "Elevada" };
  return { status: "bajo", color: "#ea580c", label: "Baja" };
};

const evaluarTemperatura = (temp) => {
  const t = Number(temp);
  if (Number.isNaN(t)) return null;
  if (t >= 36 && t <= 37.5) return { status: "normal", color: "#16a34a", label: "Normal" };
  if (t > 37.5 && t <= 38.5) return { status: "elevada", color: "#ca8a04", label: "Febr\u00edcula" };
  if (t > 38.5) return { status: "alto", color: "#dc2626", label: "Fiebre" };
  return { status: "bajo", color: "#ea580c", label: "Baja" };
};

const evaluarFC = (fc) => {
  const v = Number(fc);
  if (Number.isNaN(v)) return null;
  if (v >= 60 && v <= 100) return { status: "normal", color: "#16a34a", label: "Normal" };
  if (v > 100) return { status: "alto", color: "#dc2626", label: "Taquicardia" };
  return { status: "bajo", color: "#ea580c", label: "Bradicardia" };
};

const calcularEdad = (yearOfBirth) => {
  if (!yearOfBirth) return "";
  const nacimiento = new Date(yearOfBirth);
  if (Number.isNaN(nacimiento.getTime())) return "";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

const isVoid = (v) => v === null || v === undefined || v === "";

export const ConsultaMedica = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [_error, _setError] = useState("");
  const [data, setData] = useState(null);

  const [anamnesis, setAnamnesis] = useState("");
  const [examen, setExamen] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  const [editVitals, setEditVitals] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitals, setVitals] = useState({
    presion: "", temperatura: "", peso: "", altura: "", frecuencia: ""
  });

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/preclinical/${id}`);
        const payload = res.data?.data ?? res.data;
        if (!cancel) {
          setData(payload);
          setAnamnesis(payload?.motivo ?? "");
          setVitals({
            presion: payload?.bloodPressure || "",
            temperatura: payload?.temperature || "",
            peso: payload?.weight || "",
            altura: payload?.height || "",
            frecuencia: payload?.heartRate || ""
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancel) _setError("No se pudo cargar la pre-clinica.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [id]);

  const imcCalculado = useMemo(() => {
    const w = Number(vitals.weight || vitals.peso);
    const h = Number(vitals.height || vitals.altura);
    if (w > 0 && h > 0) {
      const wKg = w / 2.2046;
      return Number((wKg / (h * h)).toFixed(2));
    }
    return null;
  }, [vitals.peso, vitals.weight, vitals.altura, vitals.height]);

  const p = useMemo(() => {
    const base = data ? {
        nombre: data.fullName ?? "Paciente",
        edad: calcularEdad(data.yearOfBirth),
        esMenor: Boolean(data.isMinor),
        genero: data.gender ?? "",
        createdAt: data.createdAt ?? null,
    } : { nombre: "Paciente", edad: "", esMenor: false, genero: "", createdAt: null };

    return { ...base, ...vitals, bmi: imcCalculado };
  }, [data, vitals, imcCalculado]);

  const imcData = useMemo(() => {
    if (isVoid(p.bmi)) return { valor: "N/A", clase: "Sin datos", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
    const info = clasificarIMC(p.bmi);
    return { valor: p.bmi.toFixed(2), ...info };
  }, [p.bmi]);

  const evalPA = useMemo(() => evaluarPresion(vitals.presion), [vitals.presion]);
  const evalTemp = useMemo(() => evaluarTemperatura(vitals.temperatura), [vitals.temperatura]);
  const _evalFC = useMemo(() => evaluarFC(vitals.frecuencia), [vitals.frecuencia]);

  const handleUpdateVitals = async () => {
    setSavingVitals(true);
    try {
      await api.patch(`/preclinical/${id}/status`, { 
        status: "in_consultation",
        bloodPressure: vitals.presion,
        temperature: vitals.temperatura,
        weight: vitals.peso,
        height: vitals.altura,
        heartRate: vitals.frecuencia,
        bmi: p.bmi
      });
      setEditVitals(false);
    } catch (e) {
      console.error(e);
      alert("Error al actualizar los signos vitales.");
    } finally {
      setSavingVitals(false);
    }
  };

  const handleFinish = async () => {
    try {
      await api.patch(`/preclinical/${id}/status`, { 
        status: "done",
        anamnesis,
        physicalExam: examen,
        diagnosis: diagnostico,
        bloodPressure: vitals.presion,
        temperature: vitals.temperatura,
        weight: vitals.peso,
        height: vitals.altura,
        heartRate: vitals.frecuencia,
        bmi: p.bmi
      });
      alert("Consulta finalizada correctamente.");
      navigate("/doctor");
    } catch (e) {
      console.error(e);
      alert("Error al finalizar consulta.");
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return date.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div style={{ padding: "2rem", color: "#6b7280" }}>Cargando consulta...</div>;

  const S = {
    editBtn: {
      fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999,
      cursor: savingVitals ? "wait" : "pointer", border: "1px solid #0d9488",
      backgroundColor: editVitals ? "#0d9488" : "white", color: editVitals ? "white" : "#0d9488",
      transition: "all 0.2s"
    },
    vitalInput: {
      width: "100%", border: "1px solid #0d9488", borderRadius: "6px",
      fontSize: "0.95rem", padding: "4px 8px", fontWeight: 700, color: "#0f766e",
      backgroundColor: "#f0fdfa", outline: "none"
    },
    grid: { display: 'grid', gridTemplateColumns: '370px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 80px)' },
    aside: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', overflowY: 'auto' },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    patientCard: { marginBottom: '16px', padding: '14px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' },
    vitalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' },
    vitalBox: (evalInfo) => ({
      padding: "10px 12px", borderRadius: "10px", backgroundColor: "white",
      border: `1px solid ${evalInfo ? evalInfo.color + "40" : "#e2e8f0"}`
    }),
    vitalLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block" },
    vitalValue: { fontSize: "1.05rem", fontWeight: 800, color: "#1f2937" },
    vitalIndicator: (evalInfo) => ({
      display: "inline-block", fontSize: "0.68rem", fontWeight: 700,
      padding: "2px 6px", borderRadius: 999, marginLeft: 6,
      backgroundColor: evalInfo ? evalInfo.color + "18" : "transparent",
      color: evalInfo ? evalInfo.color : "#6b7280", verticalAlign: "middle"
    }),
    imcCard: { marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: imcData.bg, border: `1.5px solid ${imcData.border}` },
    main: { backgroundColor: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowY: 'auto' },
  };

  return (
    <div style={S.grid}>
      <aside style={S.aside}>
        <div style={S.sectionHeader}><h2 style={{ fontSize: '1.15rem', color: '#0f766e', margin: 0 }}>Expediente</h2></div>
        <div style={S.patientCard}>
          <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1.1rem" }}>{p.nombre}</p>
          <p style={{ fontSize: "0.9rem", color: "#4b5563" }}><strong>Edad:</strong> {p.edad} años</p>
          <p style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: 4 }}><strong>Fecha preclínica:</strong> {formatDate(p.createdAt)}</p>
        </div>

        <div style={S.sectionHeader}>
          <h3 style={{ fontSize: '0.95rem', color: '#0f766e', margin: 0 }}>Signos Vitales</h3>
          <button 
            style={S.editBtn} 
            disabled={savingVitals}
            onClick={() => editVitals ? handleUpdateVitals() : setEditVitals(true)}
          >
            {savingVitals ? "⌛ Guardando..." : (editVitals ? "💾 Guardar Signos" : "✎ Editar")}
          </button>
        </div>

        <div style={S.vitalGrid}>
          <div style={S.vitalBox(evalPA)}>
            <span style={S.vitalLabel}>Presión Arterial</span>
            {editVitals ? <input style={S.vitalInput} value={vitals.presion} onChange={(e) => setVitals({...vitals, presion: e.target.value})} /> : 
            <span style={S.vitalValue}>{isVoid(vitals.presion) ? "N/A" : vitals.presion} {evalPA && <span style={S.vitalIndicator(evalPA)}>{evalPA.label}</span>}</span>}
          </div>
          <div style={S.vitalBox(evalTemp)}>
            <span style={S.vitalLabel}>Temperatura (°C)</span>
            {editVitals ? <input style={S.vitalInput} type="number" step="0.1" value={vitals.temperatura} onChange={(e) => setVitals({...vitals, temperatura: e.target.value})} /> : 
            <span style={S.vitalValue}>{isVoid(vitals.temperatura) ? "N/A" : `${vitals.temperatura}°C`} {evalTemp && <span style={S.vitalIndicator(evalTemp)}>{evalTemp.label}</span>}</span>}
          </div>
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Peso (lb)</span>
            {editVitals ? <input style={S.vitalInput} type="number" value={vitals.peso} onChange={(e) => setVitals({...vitals, peso: e.target.value})} /> : 
            <span style={S.vitalValue}>{isVoid(vitals.peso) ? "N/A" : `${vitals.peso} lb`}</span>}
          </div>
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Estatura (m)</span>
            {editVitals ? <input style={S.vitalInput} type="number" step="0.01" value={vitals.altura} onChange={(e) => setVitals({...vitals, altura: e.target.value})} /> : 
            <span style={S.vitalValue}>{isVoid(vitals.altura) ? "N/A" : `${vitals.altura} m`}</span>}
          </div>
        </div>

        <div style={S.imcCard}>
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}>IMC: {imcData.valor}</span>
            <div style={{ color: imcData.color, fontWeight: 800, fontSize: "1.1rem", marginTop: 2 }}>{imcData.clase}</div>
        </div>

        <button className="submit-btn" style={{ marginTop: '20px', width: '100%', backgroundColor: "#64748b" }} onClick={() => navigate("/doctor")}>Volver</button>
      </aside>

      <main style={S.main}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
           <h2 style={{ margin: 0 }}>Consulta Actual</h2>
        </div>
        
        <div className="form-group"><label className="form-label">Anamnesis / Motivo</label><textarea className="form-input" rows="3" value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Examen Físico</label><textarea className="form-input" rows="4" value={examen} onChange={(e) => setExamen(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Diagnóstico</label><textarea className="form-input" rows="4" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} /></div>
        
        <button className="submit-btn" type="button" onClick={handleFinish} style={{ marginTop: "10px" }}>
          Finalizar y Guardar Consulta
        </button>
      </main>
    </div>
  );
};