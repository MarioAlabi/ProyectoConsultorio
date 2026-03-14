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
  if (t > 37.5 && t <= 38.5) return { status: "elevada", color: "#ca8a04", label: "Febrícula" };
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

const evaluarSaturacion = (spo2) => {
  const v = Number(spo2);
  if (Number.isNaN(v) || v === 0) return null;
  if (v >= 95) return { status: "normal", color: "#16a34a", label: "Normal" };
  if (v >= 90 && v < 95) return { status: "bajo", color: "#ca8a04", label: "Hipoxia Leve" };
  return { status: "critico", color: "#dc2626", label: "Hipoxia Severa" };
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

  // Estados de la consulta actual
  const [anamnesis, setAnamnesis] = useState("");
  const [examen, setExamen] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [resultadosLab, setResultadosLab] = useState(""); 
  const [observaciones, setObservaciones] = useState(""); 
  const [medicamentos, setMedicamentos] = useState([]);

  // Estados de interfaz
  const [editVitals, setEditVitals] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false); 
  
  // Estado para programar cita de seguimiento
  const [seguimiento, setSeguimiento] = useState({ fecha: "", hora: "", motivo: "Control de niño sano" });

  // Estados para Modales de Documentos
  const [activeDocModal, setActiveDocModal] = useState(null); 
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedDocText, setGeneratedDocText] = useState("");
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  const [vitals, setVitals] = useState({
    presion: "", temperatura: "", peso: "", altura: "", frecuencia: "", saturacion: ""
  });

  const historialMock = [
    { id: 1, fecha: "2026-02-15T10:00:00", motivo: "Dolor de cabeza severo", diagnostico: "Migraña tensional", signos: "PA: 130/85, Temp: 37.1" },
    { id: 2, fecha: "2025-11-02T09:30:00", motivo: "Chequeo general", diagnostico: "Paciente sano", signos: "PA: 120/80, Temp: 36.5" }
  ];

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
            frecuencia: payload?.heartRate || "",
            saturacion: payload?.oxygenSaturation || ""
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

  const evalO2 = useMemo(() => evaluarSaturacion(vitals.saturacion), [vitals.saturacion]);
  
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

  // Helper para enviar a DB
  const toNull = (v) => (v === "" || v === undefined ? null : v);

  const handleUpdateVitals = async () => {
    setSavingVitals(true);
    try {
      await api.patch(`/preclinical/${id}/status`, { 
        status: "in_consultation",
        bloodPressure: toNull(vitals.presion),
        temperature: toNull(vitals.temperatura),
        weight: toNull(vitals.peso),
        height: toNull(vitals.altura),
        heartRate: toNull(vitals.frecuencia),
        oxygenSaturation: toNull(vitals.saturacion),
        bmi: toNull(p.bmi)
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
      const body = { 
        status: "done",
        anamnesis,
        physicalExam: examen,
        diagnosis: diagnostico,
        labResults: resultadosLab,
        observations: observaciones,
        receta: medicamentos,
        bloodPressure: toNull(vitals.presion),
        temperature: toNull(vitals.temperatura),
        weight: toNull(vitals.peso),
        height: toNull(vitals.altura),
        heartRate: toNull(vitals.frecuencia),
        oxygenSaturation: toNull(vitals.saturacion),
        bmi: toNull(p.bmi),
        proximaCita: seguimiento.fecha ? seguimiento : null 
      };

      await api.patch(`/preclinical/${id}/status`, body);
      alert("Consulta finalizada correctamente.");
      navigate("/doctor");
    } catch (e) {
      console.error(e);
      alert("Error al finalizar consulta.");
    }
  };

  const handleGenerarDocumento = (tipo) => {
    setShowDocMenu(false);
    setActiveDocModal(tipo);
    setAiPrompt("");
    setGeneratedDocText("");
  };

  const handleSimularIA = () => {
    if (!aiPrompt.trim()) return alert("Por favor ingresa instrucciones para la IA.");
    setIsGeneratingDoc(true);
    
    setTimeout(() => {
      const tipoDoc = activeDocModal === 'constancia' ? 'Constancia Médica' : 'Incapacidad Médica';
      const fechaActual = new Date().toLocaleDateString("es-SV", { day: 'numeric', month: 'long', year: 'numeric' });
      
      setGeneratedDocText(`El suscrito médico hace constar que:\n\nEl paciente ${p.nombre}, de ${p.edad} años de edad, fue evaluado en esta clínica el día ${fechaActual}.\n\nBasado en las indicaciones proporcionadas: "${aiPrompt}".\n\n[El sistema backend completará esta plantilla con formato formal, sellos digitales y firmas correspondientes según las instrucciones dadas].\n\nSe extiende la presente ${tipoDoc.toLowerCase()} a solicitud del interesado para los fines que estime convenientes.`);
      setIsGeneratingDoc(false);
    }, 1500);
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return date.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const agregarMedicamento = () => {
    setMedicamentos([...medicamentos, { 
      nombre: "", concentracion: "", unidadConcentracion: "mg", 
      dosis: "", unidadDosis: "tableta(s)", via: "Vía Oral", 
      frecuencia: "", duracion: "", indicaciones: "" 
    }]);
  };

  const removerMedicamento = (index) => {
    const nuevosMeds = [...medicamentos];
    nuevosMeds.splice(index, 1);
    setMedicamentos(nuevosMeds);
  };

  const updateMed = (index, campo, valor) => {
    const nuevosMeds = [...medicamentos];
    nuevosMeds[index][campo] = valor;
    setMedicamentos(nuevosMeds);
  };

  if (loading) return <div style={{ padding: "2rem", color: "#6b7280" }}>Cargando consulta...</div>;

  const S = {
    editBtn: { fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999, cursor: savingVitals ? "wait" : "pointer", border: "1px solid #0d9488", backgroundColor: editVitals ? "#0d9488" : "white", color: editVitals ? "white" : "#0d9488", transition: "all 0.2s" },
    vitalInput: { width: "100%", border: "1px solid #0d9488", borderRadius: "6px", fontSize: "0.95rem", padding: "4px 8px", fontWeight: 700, color: "#0f766e", backgroundColor: "#f0fdfa", outline: "none" },
    grid: { display: 'grid', gridTemplateColumns: '370px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 80px)' },
    aside: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', overflowY: 'auto' },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    patientCard: { marginBottom: '16px', padding: '14px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' },
    vitalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' },
    vitalBox: (evalInfo) => ({ padding: "10px 12px", borderRadius: "10px", backgroundColor: "white", border: `1px solid ${evalInfo ? evalInfo.color + "40" : "#e2e8f0"}` }),
    vitalLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block" },
    vitalValue: { fontSize: "1.05rem", fontWeight: 800, color: "#1f2937" },
    vitalIndicator: (evalInfo) => ({ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 999, marginLeft: 6, backgroundColor: evalInfo ? evalInfo.color + "18" : "transparent", color: evalInfo ? evalInfo.color : "#6b7280", verticalAlign: "middle" }),
    imcCard: { marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: imcData.bg, border: `1.5px solid ${imcData.border}` },
    main: { display: 'flex', flexDirection: 'column', backgroundColor: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowY: 'auto' },
    contentArea: { flex: 1 },
    actionBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "20px", borderTop: "2px dashed #e5e7eb" },
    docDropdownContainer: { position: "relative" },
    btnDocumento: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", border: "1.5px solid #0d9488", color: "#0d9488", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" },
    docMenu: { position: "absolute", bottom: "110%", left: 0, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: showDocMenu ? "flex" : "none", flexDirection: "column", width: "220px", overflow: "hidden", zIndex: 10 },
    docMenuItem: { padding: "12px 16px", backgroundColor: "white", border: "none", borderBottom: "1px solid #f3f4f6", textAlign: "left", cursor: "pointer", fontSize: "0.95rem", color: "#374151", fontWeight: 600, transition: "background 0.2s" },
    medCard: { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px", marginBottom: "15px", position: "relative" },
    medGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "10px" },
    medInputGroup: { display: "flex", flexDirection: "column", gap: "4px" },
    medLabel: { fontSize: "0.8rem", fontWeight: "600", color: "#4b5563" },
    medInput: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.9rem", outline: "none" },
    medSelect: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.9rem", outline: "none", backgroundColor: "white" },
    btnRemoveMed: { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#ef4444", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" },
    modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(4px)" },
    modalContent: { backgroundColor: "white", borderRadius: "14px", width: "100%", maxWidth: "750px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
    modalHeader: { padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" },
    modalBody: { padding: "24px", overflowY: "auto", flex: 1 },
    modalFooter: { padding: "20px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8fafc" }
  };

  return (
    <div style={S.grid}>
      <aside style={S.aside}>
        <div style={S.sectionHeader}>
          <h2 style={{ fontSize: '1.15rem', color: '#0f766e', margin: 0 }}>Expediente</h2>
          <button
            type="button"
            onClick={() => setShowHistorial(true)}
            style={{ ...S.editBtn, backgroundColor: "#f0fdfa", color: "#0f766e", border: "1px solid #ccfbf1" }}
          >
            📋 Ver Historial
          </button>
        </div>
        <div style={S.patientCard}>
          <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1.1rem" }}>
            {p.nombre}
          </p>
          <p style={{ fontSize: "0.9rem", color: "#4b5563" }}>
            <strong>Edad:</strong> {p.edad} años
          </p>
          {data?.isMinor && (
            <div style={{
              marginTop: 8,
              padding: "8px",
              backgroundColor: "#f0f9ff",
              borderRadius: "6px",
              border: "1px solid #bae6fd"
            }}>
              <span style={{ fontSize: "0.75rem", color: "#0369a1", fontWeight: 700, display: "block" }}>
                RESPONSABLE LEGAL
              </span>
              <span style={{ fontSize: "0.85rem", color: "#0c4a6e", fontWeight: 800 }}>
                {data?.responsibleName || "No registrado"}
              </span>
            </div>
          )}
          <p style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: 8 }}>
            <strong>Fecha preclínica:</strong> {formatDate(p.createdAt)}
          </p>
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
            <span style={S.vitalLabel}>P. Arterial</span>
            {editVitals ? (
              <input style={S.vitalInput} value={vitals.presion} onChange={(e) => setVitals({ ...vitals, presion: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>
                {isVoid(vitals.presion) ? "N/A" : vitals.presion}
                {evalPA && <span style={S.vitalIndicator(evalPA)}>{evalPA.label}</span>}
              </span>
            )}
          </div>
          <div style={S.vitalBox(evalTemp)}>
            <span style={S.vitalLabel}>Temp °C</span>
            {editVitals ? (
              <input style={S.vitalInput} type="number" step="0.1" value={vitals.temperatura} onChange={(e) => setVitals({ ...vitals, temperatura: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>
                {isVoid(vitals.temperatura) ? "N/A" : `${vitals.temperatura}°C`}
                {evalTemp && <span style={S.vitalIndicator(evalTemp)}>{evalTemp.label}</span>}
              </span>
            )}
          </div>

          <div style={S.vitalBox(_evalFC)}>
            <span style={S.vitalLabel}>F. Cardíaca</span>
            {editVitals ? (
              <input style={S.vitalInput} type="number" value={vitals.frecuencia} onChange={(e) => setVitals({ ...vitals, frecuencia: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>
                {isVoid(vitals.frecuencia) ? "N/A" : `${vitals.frecuencia} bpm`}
                {_evalFC && <span style={S.vitalIndicator(_evalFC)}>{_evalFC.label}</span>}
              </span>
            )}
          </div>

          {/* O2 */}
          <div style={S.vitalBox(evalO2)}>
            <span style={S.vitalLabel}>Saturación O₂</span>
            {editVitals ? (
              <input style={S.vitalInput} type="number" value={vitals.saturacion} onChange={(e) => setVitals({ ...vitals, saturacion: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>
                {isVoid(vitals.saturacion) ? "N/A" : `${vitals.saturacion}%`}
                {evalO2 && <span style={S.vitalIndicator(evalO2)}>{evalO2.label}</span>}
              </span>
            )}
          </div>
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Peso (lb)</span>
            {editVitals ? (
              <input style={S.vitalInput} type="number" value={vitals.peso} onChange={(e) => setVitals({ ...vitals, peso: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>{isVoid(vitals.peso) ? "N/A" : `${vitals.peso} lb`}</span>
            )}
          </div>
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Estatura (m)</span>
            {editVitals ? (
              <input style={S.vitalInput} type="number" step="0.01" value={vitals.altura} onChange={(e) => setVitals({ ...vitals, altura: e.target.value })} />
            ) : (
              <span style={S.vitalValue}>{isVoid(vitals.altura) ? "N/A" : `${vitals.altura} m`}</span>
            )}
          </div>
        </div>

        <div style={S.imcCard}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}>IMC: {imcData.valor}</span>
          <div style={{ color: imcData.color, fontWeight: 800, fontSize: "1.1rem", marginTop: 2 }}>{imcData.clase}</div>
        </div>

        <button className="submit-btn" style={{ marginTop: '20px', width: '100%', backgroundColor: "#64748b" }} onClick={() => navigate("/doctor")}>
          Volver
        </button>
      </aside>

      <main style={S.main}>
        <div style={S.contentArea}>
          <h2 style={{ marginBottom: "20px", color: "#1f2937" }}>Consulta Actual</h2>

          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label className="form-label">Anamnesis / Motivo</label>
            <textarea className="form-input" rows="3" value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label className="form-label">Examen Físico</label>
            <textarea className="form-input" rows="3" value={examen} onChange={(e) => setExamen(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label className="form-label">Diagnóstico</label>
            <textarea className="form-input" rows="2" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label className="form-label">🧬 Resultados de Laboratorio</label>
            <textarea className="form-input" rows="3" value={resultadosLab} onChange={(e) => setResultadosLab(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label className="form-label">📝 Observaciones</label>
            <textarea className="form-input" rows="3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px", marginTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.2rem' }}>Medicamentos Recetados</h3>
              <button type="button" onClick={agregarMedicamento} style={{ ...S.btnDocumento, padding: "6px 12px", fontSize: "0.85rem" }}>
                + Agregar Medicamento
              </button>
            </div>

            {medicamentos.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "10px", border: "1px dashed #d1d5db" }}>
                No se han recetado medicamentos en esta consulta.
              </div>
            )}

            {medicamentos.map((med, index) => (
              <div key={index} style={S.medCard}>
                <button type="button" onClick={() => removerMedicamento(index)} style={S.btnRemoveMed}>✖ Quitar</button>
                
                <div style={S.medGrid}>
                  <div style={{ ...S.medInputGroup, gridColumn: "span 2" }}>
                    <label style={S.medLabel}>Nombre del Medicamento</label>
                    <input type="text" style={S.medInput} placeholder="Ej. Paracetamol" value={med.nombre} onChange={(e) => updateMed(index, 'nombre', e.target.value)} />
                  </div>
                  
                  <div style={S.medInputGroup}>
                    <label style={S.medLabel}>Concentración</label>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <input type="text" style={{ ...S.medInput, width: "60%" }} placeholder="Ej. 500" value={med.concentracion} onChange={(e) => updateMed(index, 'concentracion', e.target.value)} />
                      <select style={{ ...S.medSelect, width: "40%", padding: "8px 2px" }} value={med.unidadConcentracion} onChange={(e) => updateMed(index, 'unidadConcentracion', e.target.value)}>
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                        <option value="mcg">mcg</option>
                        <option value="ml">ml</option>
                        <option value="%">%</option>
                        <option value="UI">UI</option>
                      </select>
                    </div>
                  </div>

                  <div style={S.medInputGroup}>
                    <label style={S.medLabel}>Dosis</label>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <input type="text" style={{ ...S.medInput, width: "40%" }} placeholder="Ej. 1" value={med.dosis} onChange={(e) => updateMed(index, 'dosis', e.target.value)} />
                      <select style={{ ...S.medSelect, width: "60%", padding: "8px 2px" }} value={med.unidadDosis} onChange={(e) => updateMed(index, 'unidadDosis', e.target.value)}>
                        <option value="tableta(s)">Tableta(s)</option>
                        <option value="cápsula(s)">Cápsula(s)</option>
                        <option value="ml">ml</option>
                        <option value="gotas">Gotas</option>
                        <option value="cucharadita(s)">Cucharadita(s)</option>
                        <option value="aplicación">Aplicación</option>
                        <option value="puff(s)">Puff(s)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={S.medGrid}>
                  <div style={S.medInputGroup}>
                    <label style={S.medLabel}>Vía de Administración</label>
                    <select style={S.medSelect} value={med.via} onChange={(e) => updateMed(index, 'via', e.target.value)}>
                      <option value="Vía Oral">Vía Oral</option>
                      <option value="Tópica">Tópica</option>
                      <option value="Intramuscular">Intramuscular</option>
                      <option value="Intravenosa">Intravenosa</option>
                      <option value="Sublingual">Sublingual</option>
                      <option value="Oftálmica">Oftálmica</option>
                      <option value="Ótica">Ótica</option>
                      <option value="Respiratoria">Respiratoria / Inhalatoria</option>
                    </select>
                  </div>

                  <div style={S.medInputGroup}>
                    <label style={S.medLabel}>Frecuencia</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Cada</span>
                      <input type="text" style={{ ...S.medInput, width: "50px", textAlign: "center" }} placeholder="8" value={med.frecuencia} onChange={(e) => updateMed(index, 'frecuencia', e.target.value)} />
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>hrs</span>
                    </div>
                  </div>

                  <div style={S.medInputGroup}>
                    <label style={S.medLabel}>Duración</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Por</span>
                      <input type="text" style={{ ...S.medInput, width: "50px", textAlign: "center" }} placeholder="7" value={med.duracion} onChange={(e) => updateMed(index, 'duracion', e.target.value)} />
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>días</span>
                    </div>
                  </div>
                </div>

                <div style={S.medInputGroup}>
                  <label style={S.medLabel}>Indicaciones adicionales (Opcional)</label>
                  <input type="text" style={S.medInput} placeholder="Ej. Tomar después de las comidas" value={med.indicaciones} onChange={(e) => updateMed(index, 'indicaciones', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.actionBar}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={S.docDropdownContainer}>
              <div style={S.docMenu}>
                <button style={S.docMenuItem} onClick={() => handleGenerarDocumento('receta')} onMouseEnter={(e) => e.target.style.background = '#f0fdfa'} onMouseLeave={(e) => e.target.style.background = 'white'}>💊 Emitir Receta</button>
                <button style={S.docMenuItem} onClick={() => handleGenerarDocumento('constancia')} onMouseEnter={(e) => e.target.style.background = '#f0fdfa'} onMouseLeave={(e) => e.target.style.background = 'white'}>📄 Constancia Médica</button>
                <button style={{...S.docMenuItem, borderBottom: 'none'}} onClick={() => handleGenerarDocumento('incapacidad')} onMouseEnter={(e) => e.target.style.background = '#f0fdfa'} onMouseLeave={(e) => e.target.style.background = 'white'}>🛌 Incapacidad</button>
              </div>
              <button 
                type="button" 
                style={{...S.btnDocumento, backgroundColor: showDocMenu ? '#f0fdfa' : 'white'}} 
                onClick={() => setShowDocMenu(!showDocMenu)}
              >
                📝 Documentos {showDocMenu ? '▲' : '▼'}
              </button>
            </div>
            <button
              type="button"
              style={{ ...S.btnDocumento, border: "1.5px solid #0ea5e9", color: "#0ea5e9" }}
              onClick={() => setShowAgendarModal(true)}
            >
              📅 Agendar Seguimiento
            </button>
          </div>

          <button className="submit-btn" type="button" onClick={handleFinish} style={{ margin: 0, width: "auto" }}>
            Finalizar y Guardar Consulta
          </button>
        </div>
      </main>


      {/* MODAL: SEGUIMIENTO */}
      {showAgendarModal && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modalContent, maxWidth: "450px" }}>
            <div style={S.modalHeader}>
              <h2 style={{ margin: 0, color: "#0ea5e9" }}>📅 Agendar Control</h2>
              <button onClick={() => setShowAgendarModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>✖</button>
            </div>
            <div style={S.modalBody}>
              <div className="form-group">
                <label className="form-label">Fecha de Control</label>
                <input type="date" className="form-input" value={seguimiento.fecha} onChange={(e) => setSeguimiento({ ...seguimiento, fecha: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: "15px" }}>
                <label className="form-label">Hora</label>
                <input type="time" className="form-input" value={seguimiento.hora} onChange={(e) => setSeguimiento({ ...seguimiento, hora: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: "15px" }}>
                <label className="form-label">Motivo</label>
                <input type="text" className="form-input" placeholder="Motivo" value={seguimiento.motivo} onChange={(e) => setSeguimiento({ ...seguimiento, motivo: e.target.value })} />
              </div>
            </div>
            <div style={S.modalFooter}>
              <button className="submit-btn" style={{ margin: 0, backgroundColor: "#0ea5e9" }} onClick={() => setShowAgendarModal(false)}>Confirmar Fecha</button>
            </div>
          </div>
        </div>
      )}

      {showHistorial && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={{ margin: 0, color: "#0d9488", fontSize: "1.4rem" }}>Historial Clínico</h2>
                <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: "0.9rem" }}>Paciente: {p.nombre}</p>
              </div>
              <button onClick={() => setShowHistorial(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}>✖</button>
            </div>

            <div style={S.modalBody}>
              {historialMock.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6b7280" }}>No hay registros previos para este paciente.</p>
              ) : (
                historialMock.map((registro) => (
                  <div key={registro.id} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px dashed #d1d5db", paddingBottom: "10px" }}>
                      <span style={{ fontWeight: "bold", color: "#1f2937" }}>Consulta del {formatDate(registro.fecha)}</span>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: "999px" }}>Pre-clínica</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.95rem" }}><strong>Motivo:</strong> {registro.motivo}</p>
                    <p style={{ margin: "0 0 8px", fontSize: "0.95rem" }}><strong>Diagnóstico:</strong> {registro.diagnostico}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#4b5563" }}><strong>Signos:</strong> {registro.signos}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeDocModal && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modalContent, maxWidth: activeDocModal === 'receta' ? '600px' : '750px' }}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={{ margin: 0, color: "#0f766e", fontSize: "1.4rem" }}>
                  {activeDocModal === 'receta' ? '💊 Emitir Receta Médica' : 
                   activeDocModal === 'constancia' ? '📄 Generar Constancia Médica' : '🛌 Generar Incapacidad'}
                </h2>
                <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: "0.9rem" }}>Paciente: {p.nombre}</p>
              </div>
              <button onClick={() => setActiveDocModal(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}>✖</button>
            </div>

            <div style={S.modalBody}>
              {activeDocModal === 'receta' && (
                <div>
                  {medicamentos.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#b91c1c", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                      <strong>Atención:</strong> No has agregado ningún medicamento a la receta en la consulta actual.
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: "#4b5563", marginBottom: "15px" }}>Se imprimirán los siguientes medicamentos:</p>
                      <ul style={{ paddingLeft: "20px", color: "#1f2937", lineHeight: "1.6" }}>
                        {medicamentos.map((m, i) => (
                          <li key={i} style={{ marginBottom: "10px" }}>
                            <strong>{m.nombre} {m.concentracion}{m.unidadConcentracion}</strong> <br/>
                            <span style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                              Tomar/Aplicar: {m.dosis} {m.unidadDosis} por {m.via}, cada {m.frecuencia} hrs por {m.duracion} días. 
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(activeDocModal === 'constancia' || activeDocModal === 'incapacidad') && (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ backgroundColor: "#f0fdfa", padding: "15px", borderRadius: "10px", border: "1px solid #ccfbf1" }}>
                    <label style={{ ...S.medLabel, display: "block", marginBottom: "8px", color: "#0f766e" }}>Instrucciones para la IA:</label>
                    <textarea 
                      style={{ ...S.medInput, width: "100%", height: "80px", resize: "none" }} 
                      placeholder="Ej. Reposo por faringitis..." 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                    <button 
                      onClick={handleSimularIA} 
                      disabled={isGeneratingDoc}
                      style={{ ...S.btnDocumento, marginTop: "10px", width: "100%", justifyContent: "center", backgroundColor: isGeneratingDoc ? "#e5e7eb" : "white" }}>
                      {isGeneratingDoc ? "Generando..." : "✨ Generar Redacción"}
                    </button>
                  </div>
                  {generatedDocText && (
                    <textarea 
                      style={{ ...S.medInput, width: "100%", height: "200px", lineHeight: "1.5" }} 
                      value={generatedDocText}
                      onChange={(e) => setGeneratedDocText(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>

            <div style={S.modalFooter}>
              <button onClick={() => setActiveDocModal(null)} style={{ padding: "10px 18px", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", background: "white" }}>Cancelar</button>
              <button style={{ padding: "10px 18px", background: "linear-gradient(90deg, #0ea5e9, #22c55e)", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: "bold" }}>🖨️ Imprimir PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};