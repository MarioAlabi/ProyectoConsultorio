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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setErrorMsg("");

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
                    onClick={() => handleAbrirModal(p)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0ea5e9",
                      cursor: "pointer",
                      marginRight: "1rem",
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
                    Pre-clínica
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