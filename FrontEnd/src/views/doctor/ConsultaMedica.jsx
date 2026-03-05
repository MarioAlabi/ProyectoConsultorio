import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

/* ── Calcular edad desde fecha de nacimiento ── */
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
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [anamnesis, setAnamnesis] = useState("");
  const [examen, setExamen] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  useEffect(() => {
    let cancel = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/preclinical/${id}`);
        const payload = res.data?.data ?? res.data;

        if (!cancel) {
          setData(payload);
          setAnamnesis(payload?.motivo ?? "");
        }
      } catch (e) {
        console.error(e);
        if (!cancel) setError("No se pudo cargar la pre-cl\u00ednica.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();
    return () => { cancel = true; };
  }, [id]);

  const pFallback = state?.paciente || null;

  // Mapeo unificado de datos del paciente y precl\u00ednica
  const p = useMemo(() => {
    if (data) {
      return {
        nombre: data.fullName ?? "Paciente",
        edad: calcularEdad(data.yearOfBirth),
        esMenor: Boolean(data.isMinor),
        genero: data.gender ?? "",
        motivo: data.motivo ?? "",
        presion: data.bloodPressure ?? null,
        temperatura: data.temperature ?? null,
        peso: data.weight ?? null,
        altura: data.height ?? null,
        frecuencia: data.heartRate ?? null,
        bmi: data.bmi ?? null,
        createdAt: data.createdAt ?? null,
      };
    }

    if (pFallback) {
      return {
        nombre: pFallback.nombre ?? "Paciente",
        edad: pFallback.edad ?? "",
        esMenor: Boolean(pFallback.esMenor ?? false),
        genero: "",
        motivo: pFallback.motivo ?? "",
        presion: pFallback.presion ?? null,
        temperatura: pFallback.temperatura ?? null,
        peso: pFallback.peso ?? null,
        altura: pFallback.altura ?? null,
        frecuencia: pFallback.frecuencia ?? null,
        bmi: null,
        createdAt: null,
      };
    }

    return {
      nombre: "Paciente", edad: "", esMenor: false, genero: "",
      motivo: "", presion: null, temperatura: null, peso: null,
      altura: null, frecuencia: null, bmi: null, createdAt: null,
    };
  }, [data, pFallback]);

  // IMC: usar el valor del backend (ahora corregido con conversi\u00f3n lb->kg)
  const imcData = useMemo(() => {
    if (isVoid(p.bmi)) return { valor: "N/A", clase: "Sin datos", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };

    const valorNum = Number(p.bmi);
    if (Number.isNaN(valorNum)) return { valor: "N/A", clase: "Sin datos", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };

    const info = clasificarIMC(valorNum);
    return { valor: valorNum.toFixed(2), ...info };
  }, [p.bmi]);

  // Evaluaciones de signos vitales
  const evalPA = useMemo(() => evaluarPresion(p.presion), [p.presion]);
  const evalTemp = useMemo(() => evaluarTemperatura(p.temperatura), [p.temperatura]);
  const evalFC = useMemo(() => evaluarFC(p.frecuencia), [p.frecuencia]);

  const handleFinish = async () => {
    if (!diagnostico || diagnostico.trim().length === 0) {
      const ok = confirm("No has escrito diagn\u00f3stico. \u00bfDeseas finalizar de todas formas?");
      if (!ok) return;
    }

    try {
      await api.patch(`/preclinical/${id}/status`, { status: "done" });
      alert("Consulta finalizada correctamente.");
      navigate("/doctor");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error al finalizar consulta.");
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "#6b7280" }}>Cargando consulta...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "crimson" }}>{error}</p>
        <button className="submit-btn" onClick={() => navigate("/doctor")}>Volver</button>
      </div>
    );
  }

  /* ── Estilos inline ── */
  const S = {
    grid: { display: 'grid', gridTemplateColumns: '370px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 80px)' },
    aside: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', overflowY: 'auto' },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    readOnlyBadge: {
      fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: 999,
      backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
      userSelect: "none",
    },
    patientCard: { marginBottom: '16px', padding: '14px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' },
    vitalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' },
    vitalBox: (evalInfo) => ({
      padding: "10px 12px", borderRadius: "10px", backgroundColor: "white",
      border: `1px solid ${evalInfo ? evalInfo.color + "40" : "#e2e8f0"}`,
      position: "relative",
    }),
    vitalLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: 2, display: "block" },
    vitalValue: { fontSize: "1rem", fontWeight: 700, color: "#1f2937" },
    vitalIndicator: (evalInfo) => ({
      display: "inline-block", fontSize: "0.68rem", fontWeight: 700,
      padding: "2px 6px", borderRadius: 999, marginLeft: 6,
      backgroundColor: evalInfo ? evalInfo.color + "18" : "transparent",
      color: evalInfo ? evalInfo.color : "#6b7280",
    }),
    imcCard: {
      marginTop: '16px', padding: '16px', borderRadius: '12px',
      backgroundColor: imcData.bg, border: `1.5px solid ${imcData.border}`,
    },
    main: { backgroundColor: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowY: 'auto' },
  };

  return (
    <div style={S.grid}>

      {/* ──────── COLUMNA IZQUIERDA: DATOS + PRECLINICA ──────── */}
      <aside style={S.aside}>

        {/* Encabezado */}
        <div style={S.sectionHeader}>
          <h2 style={{ fontSize: '1.15rem', color: '#0f766e', margin: 0 }}>Expediente</h2>
        </div>

        {/* Datos del paciente */}
        <div style={S.patientCard}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "1.05rem", color: "#1f2937" }}>{p.nombre}</p>
          <p style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "#4b5563" }}>
            <strong>Edad:</strong> {p.edad !== "" ? `${p.edad} a\u00f1os` : "N/A"}
            {p.genero && <> &middot; <strong>Sexo:</strong> {p.genero === "male" ? "Masculino" : "Femenino"}</>}
          </p>
          {p.esMenor && (
            <span style={{
              display: "inline-block", fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
              borderRadius: 999, backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe",
            }}>
              MENOR DE EDAD
            </span>
          )}
          <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
            <strong>Fecha precl\u00ednica:</strong> {formatDate(p.createdAt)}
          </p>
        </div>

        {/* ── Signos Vitales (HU-25) ── */}
        <div style={S.sectionHeader}>
          <h3 style={{ fontSize: '0.95rem', color: '#0f766e', margin: 0 }}>Signos Vitales (Pre-cl\u00ednica)</h3>
          <span style={S.readOnlyBadge}>Solo lectura</span>
        </div>

        <div style={S.vitalGrid}>
          {/* Presi\u00f3n Arterial */}
          <div style={S.vitalBox(evalPA)}>
            <span style={S.vitalLabel}>Presi\u00f3n Arterial</span>
            <span style={S.vitalValue}>
              {isVoid(p.presion) ? "N/A" : p.presion}
              {evalPA && <span style={S.vitalIndicator(evalPA)}>{evalPA.label}</span>}
            </span>
          </div>

          {/* Temperatura */}
          <div style={S.vitalBox(evalTemp)}>
            <span style={S.vitalLabel}>Temperatura</span>
            <span style={S.vitalValue}>
              {isVoid(p.temperatura) ? "N/A" : `${p.temperatura}\u00b0C`}
              {evalTemp && <span style={S.vitalIndicator(evalTemp)}>{evalTemp.label}</span>}
            </span>
          </div>

          {/* Peso */}
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Peso</span>
            <span style={S.vitalValue}>{isVoid(p.peso) ? "N/A" : `${p.peso} lb`}</span>
          </div>

          {/* Estatura */}
          <div style={S.vitalBox(null)}>
            <span style={S.vitalLabel}>Estatura</span>
            <span style={S.vitalValue}>{isVoid(p.altura) ? "N/A" : `${p.altura} m`}</span>
          </div>

          {/* Frecuencia Card\u00edaca */}
          <div style={{ ...S.vitalBox(evalFC), gridColumn: "1 / -1" }}>
            <span style={S.vitalLabel}>Frecuencia Card\u00edaca</span>
            <span style={S.vitalValue}>
              {isVoid(p.frecuencia) ? "N/A" : `${p.frecuencia} bpm`}
              {evalFC && <span style={S.vitalIndicator(evalFC)}>{evalFC.label}</span>}
            </span>
          </div>
        </div>

        {/* ── IMC (HU-22) ── */}
        <div style={S.imcCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151" }}>IMC</span>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontStyle: "italic" }}>Calculado autom\u00e1ticamente</span>
          </div>
          <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0 4px', color: imcData.color }}>
            {imcData.valor}
          </p>
          <span style={{
            display: "inline-block", fontWeight: 700, fontSize: "0.82rem",
            padding: "3px 10px", borderRadius: 999,
            backgroundColor: imcData.color + "18", color: imcData.color,
          }}>
            {imcData.clase}
          </span>
        </div>

        {/* Botones de navegaci\u00f3n */}
        <button
          className="submit-btn"
          style={{ marginTop: '20px', width: '100%', backgroundColor: "#64748b" }}
          onClick={() => navigate("/doctor")}
        >
          Volver a Sala de Espera
        </button>
      </aside>

      {/* ──────── COLUMNA DERECHA: CONSULTA ──────── */}
      <main style={S.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Consulta Actual</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="doc-btn" type="button">Receta</button>
            <button className="doc-btn" type="button">Constancia</button>
            <button className="doc-btn" type="button">Incapacidad</button>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Motivo de consulta / Anamnesis</label>
          <textarea className="form-input" rows="3" value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Examen F\u00edsico</label>
          <textarea className="form-input" rows="4" placeholder="Hallazgos del examen..." value={examen} onChange={(e) => setExamen(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Diagn\u00f3stico e Indicaciones</label>
          <textarea className="form-input" rows="4" placeholder="Diagn\u00f3stico definitivo..." value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
        </div>

        <button className="submit-btn" style={{ marginTop: '10px' }} type="button" onClick={handleFinish}>
          Finalizar y Guardar Consulta
        </button>
      </main>
    </div>
  );
};
