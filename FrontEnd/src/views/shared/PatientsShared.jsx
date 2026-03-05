import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../lib/api.js";
import "../shared/Shared.css";

export const PatientsShared = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctor = location.pathname.startsWith("/doctor");
  const basePath = isDoctor ? "/doctor" : "/reception";

  const pageTitle = isDoctor ? "Pacientes (Doctor)" : "Gestión de Pacientes";

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [, setIntentado] = useState(false);

  const [mostrarExpediente, setMostrarExpediente] = useState(false);
  const [expedientePaciente, setExpedientePaciente] = useState(null);
  const [historialPreclinicas, setHistorialPreclinicas] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const estadoInicial = useMemo(
    () => ({
      id: null,
      fullName: "",
      identityDocument: "",
      dateOfBirth: "",
      gender: "female",
      phone: "",
      address: "",
      esMenor: false,
    }),
    []
  );

  const [formData, setFormData] = useState(estadoInicial);

  const cargarPacientes = async () => {
    try {
      setErrorMsg("");
      const response = await api.get("/patients");
      if (response.data?.success) setPacientes(response.data.data || []);
      else setPacientes(response.data?.data || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      setErrorMsg(
        error?.response?.status === 403
          ? "No tienes permisos para ver pacientes."
          : "No se pudieron cargar los pacientes. Revisa tu conexión."
      );
    }
  };

  useEffect(() => {
    cargarPacientes();
     
  }, []);

  const handleDUIChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8) + "-" + value.slice(8, 9);
    setFormData({ ...formData, identityDocument: value });
  };

  const handleAbrirModal = (paciente = null) => {
    setErrorMsg("");

    if (paciente) {
      setFormData({
        id: paciente.id,
        fullName: paciente.fullName ?? "",
        identityDocument: paciente.identityDocument ?? "",
        dateOfBirth: paciente.yearOfBirth ? String(paciente.yearOfBirth).split("T")[0] : "",
        gender: paciente.gender ?? "female",
        phone: paciente.phone || "",
        address: paciente.address || "",
        esMenor: paciente.isMinor === 1 || paciente.isMinor === true,
      });
      setModoEdicion(true);
    } else {
      setFormData(estadoInicial);
      setModoEdicion(false);
    }

    setMostrarModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    setErrorMsg("");
    if (!formData.fullName || !formData.identityDocument || !formData.dateOfBirth) {
      setErrorMsg("Por favor, completa los campos obligatorios en rojo.");
    return;}

    const duiRegex = /^\d{8}-\d{1}$/;
    if (!duiRegex.test(formData.identityDocument)) {
      setErrorMsg("El DUI debe tener el formato 00000000-0");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        isMinor: formData.esMenor,
        dateOfBirth: formData.dateOfBirth,
      };

      if (modoEdicion) {
        await api.put(`/patients/${formData.id}`, payload);
        alert("Información del paciente actualizada ✅");
      } else {
        await api.post("/patients/register", payload);
        alert("¡Registro exitoso! ✅");
      }

      setMostrarModal(false);
      await cargarPacientes();
    } catch (error) {
      console.error(error);
      setErrorMsg(
        error?.response?.status === 403
          ? "No tienes permisos para crear/editar pacientes."
          : error?.response?.data?.message || "Ocurrió un error en el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes;

    return pacientes.filter((p) => {
      const fullName = (p.fullName ?? "").toLowerCase();
      const dui = String(p.identityDocument ?? "");
      const file = String(p.fileNumber ?? "");
      return fullName.includes(q) || dui.includes(q) || file.includes(q);
    });
  }, [pacientes, busqueda]);

  const goPreclinica = (paciente) => {
    navigate(`${basePath}/preclinica`, {
      state: {
        paciente,
        redirectTo: isDoctor ? "/doctor" : "/reception/pacientes",
        title: isDoctor ? "Pre-clínica (Doctor)" : "Registro de Pre-clínica",
      },
    });
  };

  const handleVerExpediente = async (paciente) => {
    setExpedientePaciente(paciente);
    setMostrarExpediente(true);
    setHistorialPreclinicas([]);
    setLoadingHistorial(true);
    try {
      const res = await api.get(`/preclinical/patient/${paciente.id}`);
      setHistorialPreclinicas(res.data?.data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setHistorialPreclinicas([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const calcularEdad = (yearOfBirth) => {
    if (!yearOfBirth) return "N/A";
    const nacimiento = new Date(yearOfBirth);
    if (Number.isNaN(nacimiento.getTime())) return "N/A";
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return `${edad} a\u00f1os`;
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusLabel = (s) => {
    const map = { waiting: "En espera", in_consultation: "En consulta", done: "Finalizada", cancelled: "Cancelada" };
    return map[s] || s;
  };

  const statusColor = (s) => {
    const map = {
      waiting: { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
      in_consultation: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
      done: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
      cancelled: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    };
    return map[s] || { bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
  };

  const clasificarIMC = (bmi) => {
    if (!bmi) return null;
    const v = Number(bmi);
    if (Number.isNaN(v)) return null;
    if (v < 18.5) return { valor: v.toFixed(2), clase: "Bajo Peso", color: "#ea580c" };
    if (v < 25) return { valor: v.toFixed(2), clase: "Normal", color: "#16a34a" };
    if (v < 30) return { valor: v.toFixed(2), clase: "Sobrepeso", color: "#ca8a04" };
    return { valor: v.toFixed(2), clase: "Obesidad", color: "#dc2626" };
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>{pageTitle}</h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            {isDoctor ? "Puedes ver, registrar y editar pacientes." : "Registra, edita y gestiona pacientes desde recepción."}
          </p>
        </div>

        <button
          onClick={() => handleAbrirModal()}
          className="submit-btn"
          style={{ width: "auto", padding: "0.8rem 1.5rem", margin: 0 }}
        >
          + Nuevo Paciente
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fee2e2",
            color: "#991b1b",
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Buscar por nombre, DUI o expediente..."
          className="form-input"
          style={{ width: "100%", maxWidth: "450px" }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr style={{ color: "#4b5563", fontSize: "0.9rem" }}>
              <th style={{ padding: "1.2rem 1.5rem" }}>Nombre / Expediente</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>DUI / Responsable</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Estado</th>
              <th style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pacientesFiltrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "1.2rem 1.5rem" }}>
                  <div style={{ fontWeight: 700, color: "#1f2937" }}>{p.fullName}</div>
                  <div style={{ fontSize: "0.85rem", color: "#0d9488", fontWeight: "bold" }}>
                    {p.fileNumber ?? "—"}
                  </div>
                </td>

                <td style={{ padding: "1.2rem 1.5rem", color: "#6b7280" }}>{p.identityDocument}</td>

                <td style={{ padding: "1.2rem 1.5rem" }}>
                  <span
                    style={{
                      padding: "0.3rem 0.6rem",
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      backgroundColor: p.isMinor ? "#dbeafe" : "#ecfdf5",
                      color: p.isMinor ? "#1e40af" : "#065f46",
                      border: "1px solid " + (p.isMinor ? "#bfdbfe" : "#bbf7d0"),
                    }}
                  >
                    {p.isMinor ? "MENOR" : "ADULTO"}
                  </span>
                </td>

                <td style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>
                  <button
                    onClick={() => handleVerExpediente(p)}
                    style={{
                      background: "none",
                      border: "1px solid #0d9488",
                      color: "#0d9488",
                      cursor: "pointer",
                      marginRight: "0.5rem",
                      fontWeight: 700,
                      padding: "0.4rem 0.8rem",
                      borderRadius: "0.4rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    Ver
                  </button>

                  <button
                    onClick={() => handleAbrirModal(p)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0ea5e9",
                      cursor: "pointer",
                      marginRight: "0.5rem",
                      fontWeight: 700,
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => goPreclinica(p)}
                    className="submit-btn"
                    style={{
                      backgroundColor: "#0ea5e9",
                      padding: "0.5rem 1rem",
                      width: "auto",
                      fontSize: "0.85rem",
                      margin: 0,
                    }}
                  >
                    Pre-clinica
                  </button>
                </td>
              </tr>
            ))}

            {pacientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "1.2rem 1.5rem", color: "#6b7280" }}>
                  No hay pacientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Ver Expediente Completo (HU-19) ── */}
      {mostrarExpediente && expedientePaciente && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000, padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white", padding: "2rem", borderRadius: "1.2rem",
              width: "100%", maxWidth: "750px", maxHeight: "90vh", overflowY: "auto",
              border: "1px solid #e5e7eb", boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#0d9488" }}>Expediente del Paciente</h2>
              <button
                type="button"
                onClick={() => setMostrarExpediente(false)}
                style={{
                  background: "none", border: "none", fontSize: "1.5rem",
                  cursor: "pointer", color: "#6b7280", lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Datos Personales */}
            <div style={{
              backgroundColor: "#f8fafc", borderRadius: "0.8rem", padding: "1.2rem",
              border: "1px solid #e2e8f0", marginBottom: "1.5rem",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "#374151" }}>Datos Personales</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Nombre</span>
                  <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#1f2937" }}>{expedientePaciente.fullName}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>No. Expediente</span>
                  <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#0d9488" }}>{expedientePaciente.fileNumber ?? "N/A"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>DUI</span>
                  <p style={{ margin: "2px 0 0", color: "#1f2937" }}>{expedientePaciente.identityDocument}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Edad</span>
                  <p style={{ margin: "2px 0 0", color: "#1f2937" }}>{calcularEdad(expedientePaciente.yearOfBirth)}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Sexo</span>
                  <p style={{ margin: "2px 0 0", color: "#1f2937" }}>{expedientePaciente.gender === "male" ? "Masculino" : "Femenino"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Tipo</span>
                  <span style={{
                    display: "inline-block", marginTop: 2, fontSize: "0.75rem", fontWeight: 700,
                    padding: "3px 10px", borderRadius: 999,
                    backgroundColor: expedientePaciente.isMinor ? "#dbeafe" : "#ecfdf5",
                    color: expedientePaciente.isMinor ? "#1e40af" : "#065f46",
                    border: `1px solid ${expedientePaciente.isMinor ? "#bfdbfe" : "#bbf7d0"}`,
                  }}>
                    {expedientePaciente.isMinor ? "MENOR DE EDAD" : "ADULTO"}
                  </span>
                </div>
                {expedientePaciente.phone && (
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Telefono</span>
                    <p style={{ margin: "2px 0 0", color: "#1f2937" }}>{expedientePaciente.phone}</p>
                  </div>
                )}
                {expedientePaciente.address && (
                  <div style={{ gridColumn: expedientePaciente.phone ? "auto" : "1 / -1" }}>
                    <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Direccion</span>
                    <p style={{ margin: "2px 0 0", color: "#1f2937" }}>{expedientePaciente.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Pre-clinicas */}
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", color: "#374151" }}>
                Historial de Pre-clinicas
                {!loadingHistorial && <span style={{ fontWeight: 400, color: "#6b7280", fontSize: "0.82rem" }}> ({historialPreclinicas.length})</span>}
              </h3>

              {loadingHistorial && (
                <p style={{ color: "#6b7280", fontSize: "0.9rem", padding: "1rem 0" }}>Cargando historial...</p>
              )}

              {!loadingHistorial && historialPreclinicas.length === 0 && (
                <div style={{
                  padding: "1.5rem", textAlign: "center", color: "#6b7280",
                  backgroundColor: "#f9fafb", borderRadius: "0.8rem", border: "1px solid #e5e7eb",
                }}>
                  Este paciente no tiene registros de pre-clinica.
                </div>
              )}

              {!loadingHistorial && historialPreclinicas.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {historialPreclinicas.map((rec) => {
                    const sc = statusColor(rec.status);
                    const imc = clasificarIMC(rec.bmi);
                    return (
                      <div
                        key={rec.id}
                        style={{
                          padding: "12px 14px", borderRadius: "10px",
                          backgroundColor: "#fff", border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>{formatDate(rec.createdAt)}</span>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          }}>
                            {statusLabel(rec.status)}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#1f2937", fontSize: "0.9rem" }}>{rec.motivo}</p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.8rem", color: "#4b5563" }}>
                          {rec.bloodPressure && <span>PA: <strong>{rec.bloodPressure}</strong></span>}
                          {rec.temperature && <span>Temp: <strong>{rec.temperature}C</strong></span>}
                          {rec.weight && <span>Peso: <strong>{rec.weight} lb</strong></span>}
                          {rec.height && <span>Est: <strong>{rec.height} m</strong></span>}
                          {rec.heartRate && <span>FC: <strong>{rec.heartRate} bpm</strong></span>}
                          {imc && (
                            <span>IMC: <strong style={{ color: imc.color }}>{imc.valor} ({imc.clase})</strong></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setMostrarExpediente(false)}
                className="submit-btn"
                style={{ width: "auto", padding: "0.7rem 1.5rem", margin: 0 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2.5rem",
              borderRadius: "1.2rem",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#0d9488", textAlign: "center" }}>
              {modoEdicion ? "Actualizar Expediente" : "Nuevo Registro Clínico"}
            </h2>

            <form onSubmit={handleGuardar} className="login-form">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "1.5rem",
                  backgroundColor: "#f0fdfa",
                  padding: "15px",
                  borderRadius: "10px",
                  border: "1px solid #ccfbf1",
                }}
              >
                <input
                  type="checkbox"
                  id="esMenor"
                  checked={formData.esMenor}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  onChange={(e) => setFormData({ ...formData, esMenor: e.target.checked })}
                />
                <label htmlFor="esMenor" style={{ fontWeight: "bold", color: "#0f766e", cursor: "pointer" }}>
                  El paciente es menor de edad
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{formData.esMenor ? "DUI del Responsable" : "DUI del Paciente"}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00000000-0"
                    maxLength="10"
                    required
                    value={formData.identityDocument}
                    onChange={handleDUIChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Dirección de Residencia</label>
                <textarea
                  className="form-input"
                  rows="2"
                  style={{ padding: "0.8rem" }}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    color: "#991b1b",
                    backgroundColor: "#fee2e2",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                    marginTop: "1.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="form-input"
                  style={{ flex: 1, cursor: "pointer", background: "#f9fafb" }}
                >
                  Cancelar
                </button>

                <button type="submit" disabled={loading} className="submit-btn" style={{ flex: 1, margin: 0 }}>
                  {loading ? "Procesando..." : modoEdicion ? "Guardar Cambios" : "Finalizar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
