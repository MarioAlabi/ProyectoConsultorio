import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";

export const ConfiguracionClinica = () => {
  const { data: settingsData, isLoading } = useSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();

  const [formData, setFormData] = useState({ clinicName: "", address: "" });
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    if (settingsData) {
      setFormData({
        clinicName: settingsData.clinicName || "",
        address: settingsData.address || "",
      });
      if (settingsData.logoUrl) setVistaPrevia(settingsData.logoUrl);
    }
  }, [settingsData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast.error("Solo se permiten imágenes PNG o JPG.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result);
      setVistaPrevia(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        clinicName: formData.clinicName,
        address: formData.address,
        logoBase64: logoBase64 || null,
      });
      toast.success("Configuración actualizada.");
      setLogoBase64("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar la configuración.");
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando configuración…
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "820px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Identidad institucional</span>
          <h1 className="page-header__heading">Configuración de la clínica</h1>
          <p className="page-header__sub">
            Define el logo, nombre comercial y dirección. Aparecerán automáticamente en encabezados, recetas y documentos clínicos.
          </p>
        </div>
      </header>

      <form onSubmit={handleGuardar} className="card-elevated" style={{ padding: "2rem" }}>
        {/* Logo uploader */}
        <section
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            marginBottom: "2rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface-alt)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "2px dashed var(--border-default)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {vistaPrevia ? (
              <img
                src={vistaPrevia}
                alt="Logo"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "var(--fg-subtle)" }}>
                <i className="ri-image-line" style={{ fontSize: "1.6rem", display: "block", marginBottom: 4 }}></i>
                <span style={{ fontSize: "0.82rem" }}>Sin logo</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: "220px" }}>
            <h3 className="card-heading">Logo de la clínica</h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              Formato PNG o JPG, máximo 2 MB. Se guardará como base64 en el servidor.
            </p>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="form-input"
            />
          </div>
        </section>

        {/* Campos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label">Nombre comercial</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ej. Clínica Esperanza"
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección principal</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. 27 Av. Norte #123, San Salvador"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isPending}>
            <i className="ri-save-line"></i>
            {isPending ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  );
};
