import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../shared/Shared.css";
import { api } from "../../lib/api";

export const PreclinicaShared = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const redirectTo = location.state?.redirectTo || "/reception";
  const title = location.state?.title || "Registro de Pre-clínica";

  const pacienteInicial =
    location.state?.paciente ??
    location.state?.pacienteSeleccionado ??
    null;

  const [paciente, setPaciente] = useState(pacienteInicial);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [saving, setSaving] = useState(false);

  // ✅ faltaba este state en tu código
  const [searching, setSearching] = useState(false);

  // ✅ Errores “bonitos”
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formulario, setFormulario] = useState({
    motivo: "",
    presion: "",
    temperatura: "",
    peso: "",
    altura: "",
    frecuencia: "",
    saturacion: "",
  });

  const toNull = (v) => (v === "" || v === undefined ? null : v);

  const allEmptyVitals = (f) =>
    !f.presion &&
    (f.temperatura === "" || f.temperatura == null) &&
    (f.peso === "" || f.peso == null) &&
    (f.altura === "" || f.altura == null) &&
    (f.frecuencia === "" || f.frecuencia == null) &&
    (f.saturacion === "" || f.saturacion == null);

  const validate = () => {
    const errs = {};

    if (!formulario.motivo || formulario.motivo.trim().length === 0) {
      errs.motivo =
        "Escribe el motivo de atención (ej: consulta, curación, inyectable...).";
    } else if (formulario.motivo.trim().length < 3) {
      errs.motivo = "El motivo es muy corto. Agrega un poco más de detalle.";
    }

    if (formulario.presion) {
      const bp = formulario.presion.trim();
      const bpRegex = /^\d{2,3}\s*\/\s*\d{2,3}$/;
      if (!bpRegex.test(bp)) errs.presion = "Formato recomendado: 120/80";
    }

    if (formulario.temperatura !== "") {
      const t = Number(formulario.temperatura);
      if (Number.isNaN(t)) errs.temperatura = "Temperatura inválida.";
      else if (t < 30 || t > 45) errs.temperatura = "Rango esperado: 30°C a 45°C.";
    }

    if (formulario.peso !== "") {
      const w = Number(formulario.peso);
      if (Number.isNaN(w)) errs.peso = "Peso inválido.";
      else if (w <= 0 || w > 1500) errs.peso = "Rango esperado: 1 a 1500 lb.";
    }

    if (formulario.altura !== "") {
      const h = Number(formulario.altura);
      if (Number.isNaN(h)) errs.altura = "Estatura inválida.";
      else if (h < 0.3 || h > 3) errs.altura = "Rango esperado: 0.30 a 3.00 m.";
    }

    if (formulario.frecuencia !== "") {
      const hr = Number(formulario.frecuencia);
      if (Number.isNaN(hr)) errs.frecuencia = "Frecuencia inválida.";
      else if (hr < 20 || hr > 250) errs.frecuencia = "Rango esperado: 20 a 250 bpm.";
    }
    if (formulario.saturacion !== "") {
      const o2 = Number(formulario.saturacion);
      if (Number.isNaN(o2)) errs.saturacion = "Valor inválido.";
      else if (o2 < 0 || o2 > 100) errs.saturacion = "Rango esperado: 0 a 100%.";
    }

    return errs;
  };

  const parseBackendError = (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || "";

    if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (status === 403) return "No tienes permisos para registrar pre-clínica con este usuario.";
    if (status === 404) return "No se encontró el paciente. Vuelve a seleccionarlo.";
    if (status === 409) return msg || "Conflicto al guardar. Revisa los datos e intenta de nuevo.";
    if (status === 400) return msg || "Datos inválidos. Revisa los campos marcados.";
    if(status === 100) return msg || "El paciente ya está en sala de espera. Espera a que el doctor lo atienda o cancela la visita anterior.";
    if (status >= 500) return "Error del servidor. Intenta nuevamente en unos segundos.";
    return msg || "No se pudo guardar la pre-clínica. Verifica tu conexión e intenta de nuevo.";
  };

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (paciente) return;

      const q = busqueda.trim();
      if (q.length <= 2) {
        setResultadosBusqueda([]);
        return;
      }

      try {
        setSearching(true);
        setGeneralError("");
        const res = await api.get(`/patients`, { params: { q } });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (!isCancelled) setResultadosBusqueda(data);
      } catch (err) {
        console.error(err);
        if (!isCancelled) setResultadosBusqueda([]);
        if (!isCancelled)
          setGeneralError("No se pudo buscar pacientes. Verifica conexión o permisos.");
      } finally {
        if (!isCancelled) setSearching(false);
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [busqueda, paciente]);

  const mapPaciente = (p) => ({
    id: p.id,
    nombre: p.fullName ?? p.nombre ?? "Paciente",
    esMenor: Boolean(p.isMinor ?? p.esMenor),
    edad: p.age ?? p.edad ?? "",
    dui: p.identityDocument ?? p.dui ?? "",
    responsibleName: p.responsibleName || "",
  });

  useEffect(() => {
    if (!pacienteInicial) return;
    if (pacienteInicial?.nombre && pacienteInicial?.dui !== undefined) return;
    setPaciente(mapPaciente(pacienteInicial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeleccionarPaciente = (p) => {
    setPaciente(mapPaciente(p));
    setBusqueda("");
    setResultadosBusqueda([]);
    setGeneralError("");
    setSuccessMsg("");
    setFormErrors({});
  };

  const onChangeField = (field) => (e) => {
    setFormulario((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError("");
    setSuccessMsg("");

    if (!paciente?.id) {
      setGeneralError("Selecciona un paciente antes de guardar la pre-clínica.");
      return;
    }

    const errs = validate();
    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      setGeneralError("Revisa los campos marcados antes de continuar.");
      return;
    }

    if (allEmptyVitals(formulario)) {
      const ok = confirm("No se han ingresado signos vitales. ¿Desea continuar solo con el motivo?");
      if (!ok) return;
    }

    const payload = {
      patientId: paciente.id,
      motivo: formulario.motivo.trim(),
      bloodPressure: toNull(formulario.presion?.trim()),
      temperature: toNull(formulario.temperatura),
      weight: toNull(formulario.peso),
      height: toNull(formulario.altura),
      heartRate: toNull(formulario.frecuencia),
      oxygenSaturation: toNull(formulario.saturacion), 
    };

    try {
      setSaving(true);
      await api.post("/preclinical", payload);

      setSuccessMsg("Pre-clínica registrada Se envió a sala de espera del médico.");
      
      setFormulario({
        motivo: "",
        presion: "",
        temperatura: "",
        peso: "",
        altura: "",
        frecuencia: "",
        saturacion: "",
      });

      setTimeout(() => navigate(redirectTo), 1500);
      
    } catch (err) {
      console.error(err);
      const errorMsg = parseBackendError(err);
      setGeneralError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // ✅ estilos base reutilizables (sin Tailwind, puro inline)
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      padding: "28px 14px",
    },
    container: { maxWidth: 920, margin: "0 auto" },

    header: {
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(10px)",
      border: "1px solid #e5e7eb",
      borderRadius: 18,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      marginBottom: 18,
    },
    title: { margin: 0, color: "#0f172a", fontSize: 22, fontWeight: 900 },

    card: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 18,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      padding: 18,
    },
    sectionTitle: { margin: 0, color: "#0f172a", fontWeight: 900 },
    sectionSub: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },

    alertBase: {
      borderRadius: 14,
      padding: "12px 14px",
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
      border: "1px solid",
    },
    alertError: { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" },
    alertOk: { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" },

    inputWrap: { position: "relative" },
    iconLeft: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      fontSize: 16,
      pointerEvents: "none",
    },
    input: {
      width: "100%",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "11px 12px",
      outline: "none",
      background: "#fff",
      transition: "box-shadow .15s, border-color .15s",
    },
    inputWithIcon: { paddingLeft: 38 },
    help: { marginTop: 8, color: "#64748b", fontSize: 13 },
    fieldErr: { marginTop: 6, color: "#b91c1c", fontWeight: 800, fontSize: 13 },

    dropdown: {
      position: "absolute",
      top: "calc(100% + 10px)",
      left: 0,
      right: 0,
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      zIndex: 20,
      boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
    },
    dropdownItem: {
      width: "100%",
      textAlign: "left",
      padding: "12px 14px",
      background: "white",
      border: "none",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    badge: (minor) => ({
      fontSize: 12,
      fontWeight: 900,
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${minor ? "#93c5fd" : "#86efac"}`,
      background: minor ? "#dbeafe" : "#ecfdf5",
      color: minor ? "#1e40af" : "#065f46",
      whiteSpace: "nowrap",
    }),

    patientCard: (minor) => ({
      background: minor ? "#eff6ff" : "#f0fdf4",
      border: `1px solid ${minor ? "#bfdbfe" : "#bbf7d0"}`,
      borderRadius: 18,
      padding: 18,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    }),

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 14,
    },

    btnPrimary: {
      width: "100%",
      marginTop: 18,
      border: "none",
      borderRadius: 14,
      padding: "12px 14px",
      fontWeight: 900,
      cursor: "pointer",
      background: "linear-gradient(90deg, #0d9488, #22c55e)",
      color: "white",
      boxShadow: "0 12px 25px rgba(13,148,136,0.25)",
      transition: "transform .08s",
    },
    btnPrimaryDisabled: { opacity: 0.7, cursor: "not-allowed" },

    btnSecondary: {
      border: "1px solid #e5e7eb",
      background: "white",
      borderRadius: 12,
      padding: "10px 12px",
      cursor: "pointer",
      fontWeight: 800,
      color: "#0f172a",
    },
    linkDanger: {
      color: "#ef4444",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontWeight: 900,
      padding: 8,
      borderRadius: 10,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header con botón de volver */}
        <div style={styles.header}>
          <h1 style={styles.title}>{title}</h1>
          <button
            type="button"
            onClick={() => navigate(redirectTo)}
            style={styles.btnSecondary}
          >
            ← Volver
          </button>
        </div>

        {/* Alertas de Mensajes Generales */}
        {generalError && (
          <div style={{ ...styles.alertBase, ...styles.alertError }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>{generalError}</span>
              {generalError.includes("espera") && (
                <small style={{ fontWeight: 400, marginTop: 4 }}>
                  El paciente debe ser atendido por el doctor o cancelado antes de registrar una nueva visita.
                </small>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ ...styles.alertBase, ...styles.alertOk }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sección de Selección de Paciente */}
        {!paciente ? (
          <div style={styles.card}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={styles.sectionTitle}>Seleccionar paciente</h3>
              <p style={styles.sectionSub}>
                Busca por nombre, DUI o número de expediente.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={styles.inputWrap}>
                <span style={styles.iconLeft}>🔎</span>
                <input
                  type="text"
                  placeholder="Ej: Ana López, 01234567-8..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ ...styles.input, ...styles.inputWithIcon }}
                />
              </div>

              {searching && <div style={styles.help}>Buscando en la base de datos...</div>}

              {resultadosBusqueda.length > 0 && (
                <div style={styles.dropdown}>
                  {resultadosBusqueda.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSeleccionarPaciente(res)}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>{res.fullName}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{res.identityDocument}</div>
                      </div>
                      <span style={styles.badge(res.isMinor)}>{res.isMinor ? "MENOR" : "ADULTO"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Tarjeta de Paciente Seleccionado */
          <div style={styles.patientCard(paciente.esMenor)}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>{paciente.nombre}</h3>
                <span style={styles.badge(paciente.esMenor)}>
                  {paciente.esMenor ? "PACIENTE MENOR" : "PACIENTE ADULTO"}
                </span>
              </div>

              <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                <strong>{paciente.esMenor ? "DUI Responsable:" : "DUI Paciente:"}</strong> {paciente.dui}
              </p>
              
              {paciente.esMenor && paciente.responsibleName && (
                <p style={{ margin: "4px 0 0", color: "#0369a1", fontSize: 14, fontWeight: 700 }}>
                  Acompañado por: {paciente.responsibleName}
                </p>
              )}
            </div>

            <button
              onClick={() => { setPaciente(null); setGeneralError(""); }}
              type="button"
              style={styles.linkDanger}
            >
              Cambiar Paciente
            </button>
          </div>
        )}

        {/* Formulario de Registro de Signos Vitales */}
        {paciente && (
          <div style={{ ...styles.card, padding: 24 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
                  Motivo de Atención *
                </label>
                <textarea
                  rows="2"
                  value={formulario.motivo}
                  onChange={onChangeField("motivo")}
                  placeholder="Ej: Control de embarazo, fiebre alta, dolor de espalda..."
                  style={{ ...styles.input, resize: "vertical", borderColor: formErrors.motivo ? "#ef4444" : "#e5e7eb" }}
                />
                {formErrors.motivo && <div style={styles.fieldErr}>{formErrors.motivo}</div>}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 15 }}>
                <h4 style={{ margin: 0, color: "#0d9488", fontWeight: 900, fontSize: 16 }}>
                  Signos Vitales
                </h4>
                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>DATOS OPCIONALES</span>
              </div>

              <div style={styles.grid}>
                {/* Presión Arterial */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>P. Arterial (mmHg)</label>
                  <input type="text" placeholder="120/80" value={formulario.presion} onChange={onChangeField("presion")} style={styles.input} />
                  {formErrors.presion && <div style={styles.fieldErr}>{formErrors.presion}</div>}
                </div>

                {/* Temperatura */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>Temperatura (°C)</label>
                  <input type="number" step="0.1" placeholder="36.5" value={formulario.temperatura} onChange={onChangeField("temperatura")} style={styles.input} />
                  {formErrors.temperatura && <div style={styles.fieldErr}>{formErrors.temperatura}</div>}
                </div>

                {/* Frecuencia Cardíaca */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>Frec. Cardíaca (bpm)</label>
                  <input type="number" placeholder="75" value={formulario.frecuencia} onChange={onChangeField("frecuencia")} style={styles.input} />
                  {formErrors.frecuencia && <div style={styles.fieldErr}>{formErrors.frecuencia}</div>}
                </div>

                {/* Saturación de Oxígeno (NUEVO) */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>Saturación O₂ (%)</label>
                  <input type="number" placeholder="98" value={formulario.saturacion} onChange={onChangeField("saturacion")} 
                    style={{ ...styles.input, borderColor: formErrors.saturacion ? "#ef4444" : "#e5e7eb" }} 
                  />
                  {formErrors.saturacion && <div style={styles.fieldErr}>{formErrors.saturacion}</div>}
                </div>

                {/* Peso */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>Peso (lb)</label>
                  <input type="number" step="0.1" placeholder="160" value={formulario.peso} onChange={onChangeField("peso")} style={styles.input} />
                  {formErrors.peso && <div style={styles.fieldErr}>{formErrors.peso}</div>}
                </div>

                {/* Estatura */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 6 }}>Estatura (m)</label>
                  <input type="number" step="0.01" placeholder="1.70" value={formulario.altura} onChange={onChangeField("altura")} style={styles.input} />
                  {formErrors.altura && <div style={styles.fieldErr}>{formErrors.altura}</div>}
                </div>
              </div>

              {/* Botón de envío dinámico */}
              <button
                type="submit"
                disabled={saving || generalError.includes("espera")}
                style={{
                  ...styles.btnPrimary,
                  ...(saving || generalError.includes("espera") ? styles.btnPrimaryDisabled : {}),
                  background: generalError.includes("espera") ? "#94a3b8" : "linear-gradient(90deg, #0d9488, #22c55e)",
                  marginTop: 30
                }}
              >
                {saving ? "Registrando..." : generalError.includes("espera") ? "Paciente ya en espera" : "Confirmar e ingresar a sala"}
              </button>

              <p style={{ marginTop: 14, color: "#94a3b8", fontSize: 12, textAlign: "center", fontWeight: 600 }}>
                Esta acción notificará al médico de turno.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};