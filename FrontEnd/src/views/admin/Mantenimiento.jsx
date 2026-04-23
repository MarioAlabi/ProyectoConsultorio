import { useState, useRef } from "react";
import toast from "react-hot-toast";

const Mantenimiento = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      window.open(`${API_URL}/api/admin/backup`, "_blank");
      toast.success("Respaldo generado correctamente.");
    } catch (error) {
      console.error("Error generando respaldo:", error);
      toast.error("Error al generar el respaldo.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo .sql primero.");
      return;
    }

    const confirmacion = window.confirm(
      "ADVERTENCIA: esta acción sobrescribirá todos los datos actuales de la clínica con los del archivo seleccionado. No se puede deshacer. ¿Deseas continuar?"
    );
    if (!confirmacion) return;

    setIsRestoring(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/admin/restore`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Base de datos restaurada correctamente.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error("Error al restaurar la base de datos.");
      }
    } catch (error) {
      console.error("Error restaurando base de datos:", error);
      toast.error("Error al restaurar la base de datos.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Seguridad de datos</span>
          <h1 className="page-header__heading">Mantenimiento</h1>
          <p className="page-header__sub">
            Gestiona los respaldos completos de la clínica para proteger la información clínica (HU-05).
          </p>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Backup card */}
        <article
          className="card-elevated"
          style={{
            borderTop: "3px solid var(--accent-slate)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <header style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              aria-hidden="true"
              style={{
                width: 46,
                height: 46,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-slate-soft)",
                color: "var(--accent-slate)",
                display: "grid",
                placeItems: "center",
                fontSize: "1.3rem",
                flexShrink: 0,
              }}
            >
              <i className="ri-download-cloud-2-line"></i>
            </div>
            <div>
              <h2 className="card-heading" style={{ marginBottom: 0 }}>
                Generar respaldo
              </h2>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                Descarga una copia completa en SQL
              </p>
            </div>
          </header>

          <p style={{ color: "var(--fg-secondary)", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>
            Incluye pacientes, historiales clínicos, citas y usuarios del sistema en un único archivo
            <code style={{ fontFamily: "var(--font-mono)", background: "var(--bg-surface-alt)", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>.sql</code>
            listo para descargar.
          </p>

          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="btn btn-primary btn-lg"
            style={{ justifyContent: "center", width: "100%" }}
          >
            <i className="ri-download-line"></i>
            {isBackingUp ? "Generando archivo…" : "Generar respaldo ahora"}
          </button>
        </article>

        {/* Restore card */}
        <article
          className="card-elevated"
          style={{
            borderTop: "3px solid var(--accent-coral)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <header style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              aria-hidden="true"
              style={{
                width: 46,
                height: 46,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-coral-soft)",
                color: "var(--accent-coral)",
                display: "grid",
                placeItems: "center",
                fontSize: "1.3rem",
                flexShrink: 0,
              }}
            >
              <i className="ri-upload-cloud-2-line"></i>
            </div>
            <div>
              <h2 className="card-heading" style={{ marginBottom: 0 }}>
                Restaurar sistema
              </h2>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                Sube un archivo
                <code style={{ fontFamily: "var(--font-mono)", marginLeft: 4 }}>.sql</code>
              </p>
            </div>
          </header>

          <div
            style={{
              background: "var(--accent-coral-soft)",
              color: "var(--accent-coral)",
              padding: "0.7rem 0.9rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-start",
            }}
          >
            <i className="ri-alert-line" style={{ fontSize: "1rem", marginTop: 1 }}></i>
            <span>
              Esta acción sobrescribirá todos los datos actuales y no puede deshacerse. Hacé un
              respaldo antes de continuar.
            </span>
          </div>

          <input
            type="file"
            accept=".sql,.dump"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="form-input"
          />

          <button
            onClick={handleRestore}
            disabled={isRestoring || !selectedFile}
            className="btn btn-danger-solid btn-lg"
            style={{ justifyContent: "center", width: "100%" }}
          >
            <i className="ri-refresh-line"></i>
            {isRestoring ? "Restaurando…" : "Restaurar base de datos"}
          </button>
        </article>
      </div>
    </div>
  );
};

export default Mantenimiento;
