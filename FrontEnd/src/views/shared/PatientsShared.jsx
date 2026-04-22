import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "../../lib/validations/patientSchema";
import { usePatients, useCreatePatient, useUpdatePatient, usePatientClinicalHistory } from "../../hooks/usePatients";
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, formatDUI, formatPhone, getStatusBadge } from "../../lib/utils";
import "./Shared.css";

export const PatientsShared = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDoctor = location.pathname.startsWith("/doctor");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [historialPatientId, setHistorialPatientId] = useState(null);

  const { data: patients = [], isLoading } = usePatients("");
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
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
  useEffect(() => {
    if (fechaNacimiento) {
      const edad = calcularEdad(fechaNacimiento);

      if (edad < 18) {
        setValue("isMinor", true, { shouldValidate: true });
      } else {
        setValue("isMinor", false, { shouldValidate: true });
      }
    }
  }, [fechaNacimiento, setValue]);

  const filtered = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) =>
      p.fullName?.toLowerCase().includes(q) ||
      p.identityDocument?.includes(q) ||
      p.fileNumber?.toLowerCase().includes(q)
    );
  }, [patients, search]);

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
          <p style={{ color: "#6b7280", margin: "0.3rem 0 0" }}>Gestion de expedientes clinicos</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
                const badge = getStatusBadge(p.status);
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
                        <button onClick={() => setHistorialPatientId(p.id)} className="doc-btn">Historial</button>
                        <button onClick={() => goToPreclinica(p)} className="doc-btn" style={{ color: "#0d9488" }}>Pre-clinica</button>
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
              <label className="form-label">Genero *</label>
              <select className="form-input" {...register("gender")} style={{ backgroundColor: "white" }}>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input type="text" className="form-input" placeholder="0000-0000" {...register("phone")}
                onChange={(e) => setValue("phone", formatPhone(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Direccion</label>
              <input type="text" className="form-input" {...register("address")} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" {...register("isMinor")} />
              <span className="form-label" style={{ margin: 0 }}>Paciente es menor de edad</span>
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
        isOpen={!!historialPatientId}
        onClose={() => setHistorialPatientId(null)}
        title={`Historial Clinico${patientSelectedForHistory ? ` - ${patientSelectedForHistory.fullName}` : ""}`}
        size="xl"
      >
        <ClinicalHistoryTimeline history={historialClinico} isLoading={historialLoading} isError={historialError} />
      </Modal>
    </div>
  );
};