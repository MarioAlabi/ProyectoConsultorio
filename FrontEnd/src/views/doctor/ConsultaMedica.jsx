import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from "../../lib/api";
import '../../views/shared/Shared.css';

export const ConsultaMedica = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // Estado de carga de preclínica real
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  // Campos de la consulta (para "Finalizar y Guardar")
  const [anamnesis, setAnamnesis] = useState("");
  const [examen, setExamen] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  const showNA = (v) => (v === null || v === undefined || v === "" ? "N/A" : v);

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

          // Precargar motivo en anamnesis
          const motivo = payload?.motivo ?? "";
          setAnamnesis(motivo);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) setError("No se pudo cargar la pre-clínica.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();

    return () => {
      cancel = true;
    };
  }, [id]);

  // Fallback SOLO si vienes desde state (modo antiguo)
  const pFallback = state?.paciente || null;

  // Mapeo a una estructura única para render
  const p = useMemo(() => {
    if (data) {
      return {
        nombre: data.fullName ?? "Paciente",
        edad: data.age ?? "",
        esMenor: Boolean(data.isMinor ?? false),

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
      nombre: "Paciente",
      edad: "",
      esMenor: false,
      motivo: "",
      presion: null,
      temperatura: null,
      peso: null,
      altura: null,
      frecuencia: null,
      bmi: null,
      createdAt: null,
    };
  }, [data, pFallback]);

  // IMC: si backend manda bmi lo usamos; si no, lo calculamos cuando haya peso+talla
  const imcData = useMemo(() => {
    if (p.bmi !== null && p.bmi !== undefined && p.bmi !== "") {
      const valorNum = Number(p.bmi);
      const valor = Number.isNaN(valorNum) ? String(p.bmi) : valorNum.toFixed(2);

      let clase = "Sin datos";
      if (!Number.isNaN(valorNum)) {
        if (valorNum < 18.5) clase = "Bajo Peso";
        else if (valorNum < 25) clase = "Normal";
        else if (valorNum < 30) clase = "Sobrepeso";
        else clase = "Obesidad";
      }
      return { valor, clase };
    }

    if (!p.peso || !p.altura) return { valor: "N/A", clase: "Sin datos" };

    const pesoNum = Number(p.peso);
    const alturaNum = Number(p.altura);

    if (Number.isNaN(pesoNum) || Number.isNaN(alturaNum) || alturaNum <= 0) {
      return { valor: "N/A", clase: "Sin datos" };
    }

    const pesoKg = pesoNum / 2.2046; // lb a kg
    const valorNum = pesoKg / (alturaNum * alturaNum);
    const valor = valorNum.toFixed(2);

    let clase = "";
    if (valorNum < 18.5) clase = "Bajo Peso";
    else if (valorNum < 25) clase = "Normal";
    else if (valorNum < 30) clase = "Sobrepeso";
    else clase = "Obesidad";

    return { valor, clase };
  }, [p.bmi, p.peso, p.altura]);

  const handleFinish = async () => {
    // Validación mínima (puedes endurecerla si quieres)
    if (!diagnostico || diagnostico.trim().length === 0) {
      const ok = confirm("No has escrito diagnóstico. ¿Deseas finalizar de todas formas?");
      if (!ok) return;
    }

    try {
      // Por ahora solo cerramos la preclínica en done (flujo completo)
      await api.patch(`/preclinical/${id}/status`, { status: "done" });

      alert("Consulta finalizada correctamente ✅");
      navigate("/doctor");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error al finalizar consulta.");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Cargando consulta...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "crimson" }}>{error}</p>
        <button className="submit-btn" onClick={() => navigate("/doctor")}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 80px)' }}>

      {/* COLUMNA IZQUIERDA: DATOS Y PRECLÍNICA */}
      <aside style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0f766e' }}>Expediente</h2>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <p><strong>Nombre:</strong> {p.nombre}</p>
          <p><strong>Edad:</strong> {p.edad !== "" ? `${p.edad} años` : "N/A"}</p>
          {p.esMenor && <span className="badge-menor">MENOR DE EDAD</span>}
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#6b7280" }}>
            <strong>Fecha preclínica:</strong> {showNA(p.createdAt)}
          </p>
        </div>

        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #ddd' }}>Signos Vitales</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div className="vitals-box">PA: {showNA(p.presion)}</div>
          <div className="vitals-box">Temp: {p.temperatura === null || p.temperatura === undefined || p.temperatura === "" ? "N/A" : `${p.temperatura}°C`}</div>
          <div className="vitals-box">Peso: {p.peso === null || p.peso === undefined || p.peso === "" ? "N/A" : `${p.peso} lb`}</div>
          <div className="vitals-box">Est: {p.altura === null || p.altura === undefined || p.altura === "" ? "N/A" : `${p.altura} m`}</div>
          <div className="vitals-box">FC: {p.frecuencia === null || p.frecuencia === undefined || p.frecuencia === "" ? "N/A" : `${p.frecuencia} bpm`}</div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}><strong>IMC (Calculado):</strong></p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{imcData.valor}</p>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>{imcData.clase}</span>
          {p.esMenor && <p style={{ fontSize: '0.8rem', color: '#1e40af' }}>Percentil: N/A</p>}
        </div>

        <button className="secondary-btn" style={{ marginTop: '20px', width: '100%' }}>
          Ver Historial Completo
        </button>

        <button
          className="secondary-btn"
          style={{ marginTop: '10px', width: '100%' }}
          onClick={() => navigate("/doctor")}
        >
          Volver a Sala de Espera
        </button>
      </aside>

      {/* COLUMNA DERECHA: CONSULTA Y DOCUMENTOS */}
      <main style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Consulta Actual</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="doc-btn" type="button">📄 Receta</button>
            <button className="doc-btn" type="button">📝 Constancia</button>
            <button className="doc-btn" type="button">🏥 Incapacidad</button>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Motivo de consulta / Anamnesis</label>
          <textarea
            className="form-input"
            rows="3"
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Examen Físico</label>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Hallazgos del examen..."
            value={examen}
            onChange={(e) => setExamen(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Diagnóstico e Indicaciones</label>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Diagnóstico definitivo..."
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
          />
        </div>

        <button
          className="submit-btn"
          style={{ marginTop: '10px' }}
          type="button"
          onClick={handleFinish}
        >
          Finalizar y Guardar Consulta
        </button>
      </main>
    </div>
  );
};