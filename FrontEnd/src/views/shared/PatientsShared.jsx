import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "../../lib/validations/patientSchema";
import { usePatients, useCreatePatient, useUpdatePatient, useUpdatePatientStatus, usePatientClinicalHistory } from "../../hooks/usePatients";
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, formatDUI, formatPhone, getStatusBadge } from "../../lib/utils";
import "./Shared.css";

export const PatientsShared = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDoctor = location.pathname.startsWith("/doctor");

  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [historialPatientId, setHistorialPatientId] = useState(null);

  const [statusModal, setStatusModal] = useState({ isOpen: false, patient: null, newStatus: "" });

  const { data: patients = [], isLoading } = usePatients("");
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const updateStatusMutation = useUpdatePatientStatus();
  const { data: historialClinico, isLoading: historialLoading, isError: historialError } = usePatientClinicalHistory(historialPatientId);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "", dateOfBirth: "", identityDocument: "", gender: "male",
      phone: "", address: "", isMinor: false, responsibleName: "",
      personalHistory: "", familyHistory: "",
    },
  });

  const esMenor = watch("isMinor");
  const fechaNacimiento = watch("dateOfBirth");
  const edadActual = fechaNacimiento ? calcularEdad(fechaNacimiento) : 0;
  const isAdult = fechaNacimiento && edadActual >= 18;
  useEffect(() => {
    if (fechaNacimiento) {
      if (edadActual < 18) {
        setValue("isMinor", true, { shouldValidate: true });
      } else {
        setValue("isMinor", false, { shouldValidate: true });
      }
    }
  }, [fechaNacimiento, edadActual, setValue]);

  const filtered = useMemo(() => {
    let list = patients;

    if (!mostrarInactivos) {
      list = list.filter((p) => p.status === "active");
    }

    if (!search) return list;

    const q = search.toLowerCase();
    return list.filter((p) =>
      p.fullName?.toLowerCase().includes(q) ||
      p.identityDocument?.includes(q) ||
      p.fileNumber?.toLowerCase().includes(q)
    );
  }, [patients, search, mostrarInactivos]);

  const openCreate = () => {
    setEditingPatient(null);
    reset({
      fullName: "", dateOfBirth: "", identityDocument: "", gender: "male",
      phone: "", address: "", isMinor: false, responsibleName: "",
      personalHistory: "", familyHistory: "",
    });
    setShowModal(true);
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    reset({
      fullName: patient.fullName || "",
      dateOfBirth: patient.yearOfBirth?.split("T")[0] || "",
      identityDocument: patient.identityDocument || "",
      gender: patient.gender || "male",
      phone: patient.phone || "",
      address: patient.address || "",
      isMinor: !!patient.isMinor,
      responsibleName: patient.responsibleName || "",
      personalHistory: patient.personalHistory || "",
      familyHistory: patient.familyHistory || "",
    });
    setShowModal(true);
  };

  const onSubmit = (data) => {
    if (!data.isMinor) {
      data.responsibleName = null;
    }

    if (editingPatient) {
      updateMutation.mutate(
        { id: editingPatient.id, data },
        { onSuccess: () => { setShowModal(false); setEditingPatient(null); } }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setShowModal(false) });
    }
  };

  const openStatusModal = (patient) => {
    setStatusModal({ isOpen: true, patient, newStatus: patient.status || "active" });
  };

  const handleStatusSave = () => {
    if (statusModal.newStatus === "deceased") {
      const confirmed = window.confirm(` ADVERTENCIA:\n\n¿Está seguro que desea marcar a ${statusModal.patient.fullName} como "Fallecido"?\n\nEsta acción lo ocultará de las búsquedas principales.`);
      if (!confirmed) return;
    }

    updateStatusMutation.mutate(
      { id: statusModal.patient.id, status: statusModal.newStatus },
      { onSuccess: () => setStatusModal({ isOpen: false, patient: null, newStatus: "" }) }
    );
  };

  const goToPreclinica = (patient) => {
    const basePath = isDoctor ? "/doctor" : "/reception";
    navigate(`${basePath}/preclinica`, { state: { paciente: patient, redirectTo: `${basePath}/pacientes` } });
  };

  const patientSelectedForHistory = useMemo(
    () => patients.find((patient) => patient.id === historialPatientId) || null,
    [patients, historialPatientId]
  );

  const S = {
    page: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" },
    table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
    th: { padding: "1rem 1.2rem", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.9rem" },
    td: { padding: "1rem 1.2rem", borderBottom: "1px solid #f3f4f6" },
    card: { backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" },
    errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
    gridForm: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Pacientes</h1>
          <p style={{ color: "#6b7280", margin: "0.3rem 0 0" }}>Gestión de expedientes clínicos</p>
        </div>
        
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Toggle para mostrar/ocultar inactivos */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.95rem", color: "#4b5563", userSelect: "none" }}>
            <input 
              type="checkbox" 
              checked={mostrarInactivos} 
              onChange={(e) => setMostrarInactivos(e.target.checked)} 
              style={{ width: "16px", height: "16px", accentColor: "#0d9488" }} 
            />
            Mostrar Archivados
          </label>

          <input type="text" className="form-input" placeholder="Buscar por nombre, DUI o expediente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "280px" }} />
          <button onClick={openCreate} className="submit-btn" style={{ margin: 0, padding: "0.75rem 1.5rem", whiteSpace: "nowrap" }}>+ Nuevo Paciente</button>
        </div>
      </div>

      <div style={S.card}>
        {isLoading ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Cargando pacientes...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No se encontraron pacientes.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Paciente</th>
                <th style={S.th}>Expediente</th>
                <th style={S.th}>DUI</th>
                <th style={S.th}>Edad</th>
                <th style={S.th}>Estado</th> 
                <th style={S.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const edad = calcularEdad(p.yearOfBirth);
                const badge = getStatusBadge(p.status || "active"); // Salvaguarda visual
                return (
                  <tr key={p.id}>
                    <td style={{ ...S.td, fontWeight: 500 }}>
                      {p.fullName}
                      {p.isMinor ? <span style={{ fontSize: "0.75rem", color: "#f59e0b", marginLeft: "6px" }}>(Menor)</span> : null}
                    </td>
                    <td style={{ ...S.td, color: "#6b7280" }}>{p.fileNumber}</td>
                    <td style={{ ...S.td, color: "#6b7280" }}>{p.identityDocument}</td>
                    <td style={S.td}>{edad} años</td>
                    <td style={S.td}>
                      <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button onClick={() => openEdit(p)} className="doc-btn" style={{ color: "#0ea5e9" }}>Editar</button>
                        <button onClick={() => openStatusModal(p)} className="doc-btn" style={{ color: "#f59e0b" }}>Estado</button>
                        <button onClick={() => setHistorialPatientId(p.id)} className="doc-btn">Historial</button>
                        
                        {/* Ocultamos botón de pre-clínica si está inactivo o fallecido para evitar agendar citas por error (Escenario 1) */}
                        {p.status === "active" && (
                          <button onClick={() => goToPreclinica(p)} className="doc-btn" style={{ color: "#0d9488" }}>Pre-clínica</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingPatient(null); }} title={editingPatient ? "Editar Paciente" : "Nuevo Paciente"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">

          <div style={S.gridForm}>
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input type="text" className="form-input" {...register("fullName")} />
              {errors.fullName && <span style={S.errorMsg}>{errors.fullName.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento *</label>
              <input type="date" className="form-input" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <span style={S.errorMsg}>{errors.dateOfBirth.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                {esMenor ? "DUI del Responsable *" : "DUI *"}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="12345678-9"
                {...register("identityDocument")}
                onChange={(e) =>
                  setValue("identityDocument", formatDUI(e.target.value), { shouldValidate: true })
                }
              />
              {errors.identityDocument && <span style={S.errorMsg}>{errors.identityDocument.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Género *</label>
              <select className="form-input" {...register("gender")} style={{ backgroundColor: "white" }}>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" className="form-input" placeholder="0000-0000" {...register("phone")}
                onChange={(e) => setValue("phone", formatPhone(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input type="text" className="form-input" {...register("address")} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: isAdult ? "not-allowed" : "pointer", opacity: isAdult ? 0.6 : 1 }}>
              <input 
                type="checkbox" 
                {...register("isMinor")} 
                disabled={isAdult} // Se bloquea si tiene 18 años o más
              />
              <span className="form-label" style={{ margin: 0 }}>
                Paciente es menor de edad {isAdult && <span style={{ color: "#ef4444", fontSize: "0.8rem", marginLeft: "5px" }}>(Bloqueado por fecha de nacimiento.)</span>}
              </span>
            </label>
          </div>

          {esMenor && (
            <div className="form-group">
              <label className="form-label">Nombre del Responsable *</label>
              <input type="text" className="form-input" {...register("responsibleName")} />
              {errors.responsibleName && <span style={S.errorMsg}>{errors.responsibleName.message}</span>}
            </div>
          )}

          <div style={{ ...S.gridForm, marginTop: "0.5rem" }}>
            <div className="form-group">
              <label className="form-label">Antecedentes Personales</label>
              <textarea className="form-input" rows={2} {...register("personalHistory")} />
            </div>

            <div className="form-group">
              <label className="form-label">Antecedentes Familiares</label>
              <textarea className="form-input" rows={2} {...register("familyHistory")} />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending)
              ? "Guardando..."
              : editingPatient ? "Guardar Cambios" : "Registrar Paciente"}
          </button>

        </form>
      </Modal>
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, patient: null, newStatus: "" })}
        title="Archivo y Estado del Paciente"
        size="sm"
      >
        {statusModal.patient && (
          <div className="login-form">
            <p style={{ color: "#4b5563", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Modificar estado de <strong>{statusModal.patient.fullName}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Estado Actual</label>
              <select
                className="form-input"
                value={statusModal.newStatus}
                onChange={(e) => setStatusModal(prev => ({ ...prev, newStatus: e.target.value }))}
                style={{ backgroundColor: "white" }}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="deceased">Fallecido</option>
              </select>
            </div>
            <button 
              onClick={handleStatusSave} 
              className="submit-btn" 
              disabled={updateStatusMutation.isPending || statusModal.newStatus === statusModal.patient.status}
            >
              {updateStatusMutation.isPending ? "Actualizando..." : "Guardar Estado"}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!historialPatientId}
        onClose={() => setHistorialPatientId(null)}
        title={`Historial Clínico${patientSelectedForHistory ? ` - ${patientSelectedForHistory.fullName}` : ""}`}
        size="xl"
      >
        <ClinicalHistoryTimeline history={historialClinico} isLoading={historialLoading} isError={historialError} />
      </Modal>
    </div>
  );
};