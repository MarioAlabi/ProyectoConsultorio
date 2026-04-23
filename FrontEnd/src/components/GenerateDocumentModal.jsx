import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "./Modal";
import { useDocumentTemplates, useGenerateDocument } from "../hooks/useDocumentTemplates";

const TYPE_LABELS = {
  constancia: "Constancia Médica",
  incapacidad: "Incapacidad / Reposo",
};

const LOCAL_PLACEHOLDERS = new Set([
  "paciente.nombre",
  "paciente.dui",
  "paciente.expediente",
  "paciente.edad",
  "paciente.genero",
  "paciente.telefono",
  "paciente.direccion",
  "paciente.responsable",
  "medico.nombre",
  "medico.jvpm",
  "medico.telefono",
  "medico.correo",
  "clinica.nombre",
  "clinica.direccion",
  "consulta.diagnostico",
  "consulta.motivo",
  "fecha.hoy",
]);

const renderPreview = (template, mergedVars) => {
  if (!template) return "";
  return template.bodyTemplate.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const trimmed = key.trim();
    if (Object.prototype.hasOwnProperty.call(mergedVars, trimmed) && mergedVars[trimmed] !== "") {
      return mergedVars[trimmed];
    }
    return match;
  });
};

export const GenerateDocumentModal = ({
  isOpen,
  onClose,
  type,
  patientId,
  consultationId,
  patientName,
  clinicSettings,
  doctor,
  patient,
  diagnosis,
  motivo,
}) => {
  const { data: templates = [], isLoading } = useDocumentTemplates({ type });
  const generateMutation = useGenerateDocument();

  const [selectedId, setSelectedId] = useState("");
  const [extras, setExtras] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const def = templates.find((t) => t.isDefault) || templates[0];
    if (def) setSelectedId((current) => current || def.id);
  }, [isOpen, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const systemVars = useMemo(() => {
    const today = new Date().toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric" });
    return {
      "paciente.nombre": patient?.fullName || patientName || "",
      "paciente.dui": patient?.identityDocument || "",
      "paciente.expediente": patient?.fileNumber || "",
      "paciente.telefono": patient?.phone || "",
      "paciente.direccion": patient?.address || "",
      "paciente.genero": patient?.gender === "male" ? "Masculino" : patient?.gender === "female" ? "Femenino" : "",
      "medico.nombre": doctor?.name || "",
      "medico.jvpm": doctor?.jvpm || "",
      "medico.telefono": doctor?.phone || "",
      "medico.correo": doctor?.email || "",
      "clinica.nombre": clinicSettings?.clinicName || "",
      "clinica.direccion": clinicSettings?.address || "",
      "consulta.diagnostico": diagnosis || "",
      "consulta.motivo": motivo || "",
      "fecha.hoy": today,
    };
  }, [patient, patientName, doctor, clinicSettings, diagnosis, motivo]);

  const extraFields = useMemo(() => {
    if (!selectedTemplate?.placeholders) return [];
    return selectedTemplate.placeholders.filter((p) => !LOCAL_PLACEHOLDERS.has(p));
  }, [selectedTemplate]);

  useEffect(() => {
    const init = {};
    for (const p of extraFields) init[p] = extras[p] || "";
    setExtras(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  const previewContent = useMemo(() => {
    if (!selectedTemplate) return "";
    return renderPreview(selectedTemplate, { ...systemVars, ...extras });
  }, [selectedTemplate, systemVars, extras]);

  const printDocument = (content, title) => {
    const logoUrl = clinicSettings?.logoUrl || "";
    const clinicName = clinicSettings?.clinicName || "Consultorio Médico";
    const address = clinicSettings?.address || "";
    const printWindow = window.open("", "_blank", "width=820,height=900");
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana de impresión. Habilítala para imprimir.");
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>
        @media print { @page { margin: 18mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1f2937; padding: 24px; line-height: 1.55; }
        .letterhead { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #285444; padding-bottom: 14px; margin-bottom: 20px; }
        .letterhead img { height: 70px; width: auto; object-fit: contain; }
        .letterhead h1 { margin: 0; color: #285444; font-size: 22px; letter-spacing: 1px; text-transform: uppercase; font-family: Helvetica, Arial, sans-serif; }
        .letterhead p { margin: 2px 0 0; color: #4b5563; font-size: 12px; font-family: Helvetica, Arial, sans-serif; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-family: Georgia, serif; font-size: 14px; }
      </style></head><body>
      <div class="letterhead">
        ${logoUrl ? `<img src="${logoUrl}" alt="logo" />` : ""}
        <div>
          <h1>${clinicName}</h1>
          ${address ? `<p>${address}</p>` : ""}
        </div>
      </div>
      <pre>${content.replace(/</g, "&lt;")}</pre>
      </body></html>`);
    printWindow.document.close();
    // Diferimos el print desde el padre para evitar inyectar <script> en el HTML.
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } catch {
        // silencioso: la ventana de impresión puede ser cerrada por el usuario antes de terminar
      }
    };
    if (printWindow.document.readyState === "complete") {
      setTimeout(triggerPrint, 300);
    } else {
      printWindow.addEventListener("load", () => setTimeout(triggerPrint, 300));
    }
  };

  const handleGenerate = () => {
    if (!selectedTemplate) {
      return toast.error("Seleccione una plantilla.");
    }
    const missing = extraFields.filter((p) => !extras[p] || String(extras[p]).trim() === "");
    if (missing.length > 0) {
      return toast.error(`Complete los campos: ${missing.join(", ")}`);
    }

    const payloadExtras = { ...extras };
    if (diagnosis && !payloadExtras["consulta.diagnostico"]) {
      payloadExtras["consulta.diagnostico"] = diagnosis;
    }
    if (motivo && !payloadExtras["consulta.motivo"]) {
      payloadExtras["consulta.motivo"] = motivo;
    }

    generateMutation.mutate(
      {
        templateId: selectedTemplate.id,
        patientId,
        consultationId: consultationId || null,
        extras: payloadExtras,
      },
      {
        onSuccess: (doc) => {
          toast.success("Documento generado correctamente.");
          printDocument(doc.content, doc.title);
        },
      }
    );
  };

  const sectionStyle = {
    background: "var(--bg-surface-alt)",
    borderRadius: "var(--radius-md)",
    padding: "1rem 1.15rem",
    marginBottom: "1rem",
    border: "1px solid var(--border-subtle)",
  };
  const smallLabel = {
    fontSize: "0.78rem",
    color: "var(--fg-secondary)",
    marginBottom: "0.3rem",
    display: "block",
    fontWeight: 600,
  };
  const previewStyle = {
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-md)",
    padding: "1.2rem",
    border: "1px solid var(--border-subtle)",
    whiteSpace: "pre-wrap",
    fontFamily: "Georgia, serif",
    fontSize: "0.95rem",
    color: "var(--fg-primary)",
    maxHeight: "380px",
    overflowY: "auto",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generar ${TYPE_LABELS[type] || "documento"}`} size="xl">
      {isLoading ? (
        <p style={{ textAlign: "center", color: "var(--fg-muted)", padding: "2rem" }}>
          Cargando plantillas…
        </p>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--fg-muted)" }}>
            No hay plantillas de tipo "{TYPE_LABELS[type]}" configuradas.
          </p>
          <p style={{ color: "var(--fg-secondary)", fontSize: "0.88rem" }}>
            Solicita al administrador que cree plantillas en <strong>Plantillas de documentos</strong>.
          </p>
        </div>
      ) : (
        <>
          <div style={sectionStyle}>
            <label style={smallLabel}>Plantilla *</label>
            <select
              className="form-input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Seleccione una plantilla</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.isDefault ? " (por defecto)" : ""}
                </option>
              ))}
            </select>
            {selectedTemplate?.description && (
              <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", margin: "0.5rem 0 0" }}>
                {selectedTemplate.description}
              </p>
            )}
          </div>

          {extraFields.length > 0 && (
            <div style={sectionStyle}>
              <strong style={{ color: "var(--fg-secondary)", fontSize: "0.9rem" }}>
                Campos a completar
              </strong>
              <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", margin: "0.2rem 0 0.8rem" }}>
                Estas variables no son resueltas automáticamente por el sistema.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "0.8rem",
                }}
              >
                {extraFields.map((key) => (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ ...smallLabel, fontFamily: "var(--font-mono)" }}>{`{{${key}}}`}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={extras[key] || ""}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <strong style={{ color: "var(--fg-secondary)", fontSize: "0.9rem" }}>Vista previa</strong>
            <div style={{ ...previewStyle, marginTop: "0.5rem" }}>
              {previewContent || "Seleccione una plantilla."}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedTemplate || generateMutation.isPending}
              onClick={handleGenerate}
            >
              {generateMutation.isPending ? "Generando…" : "Generar e imprimir"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
