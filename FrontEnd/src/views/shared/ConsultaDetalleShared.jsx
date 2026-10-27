import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConsultation } from "../../hooks/useConsultations";
import { useSettings } from "../../hooks/useSettings";
import { PrescriptionPreviewModal } from "../../components/PrescriptionPreviewModal";

const label = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
  marginBottom: "0.35rem",
};

const textValue = {
  margin: 0,
  color: "var(--fg-primary)",
  fontSize: "0.95rem",
  lineHeight: 1.55,
  background: "var(--bg-surface-alt)",
  padding: "0.85rem 1rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
  whiteSpace: "pre-wrap",
};

const diagnosisValue = {
  ...textValue,
  background: "var(--accent-ochre-soft)",
  border: "1px solid var(--accent-ochre-soft)",
  color: "var(--accent-ochre)",
};

const medCard = {
  background: "var(--accent-slate-soft)",
  border: "1px solid var(--accent-slate-soft)",
  borderRadius: "var(--radius-md)",
  padding: "1rem 1.1rem",
  marginBottom: "0.8rem",
};

const medGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.7rem",
};

export const ConsultaDetalleShared = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: consulta, isLoading, isError } = useConsultation(id);
  const { data: clinicSettings } = useSettings();
  const [prescriptionPreview, setPrescriptionPreview] = useState({ open: false, html: "" });

  const printPdfDirect = (base64Raw) => {
    if (!base64Raw) return;
    try {
      const cleanBase64 = base64Raw.replace(/^data:application\/pdf;base64,/, "");
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (e) {
            console.warn("Iframe auto-print fallback:", e);
            window.open(blobUrl, "_blank");
          }
        }, 300);
      };
    } catch (e) {
      console.error("Error al preparar PDF para impresión:", e);
    }
  };

  const handlePrintReceta = () => {
    if (!consulta?.receta || consulta.receta.length === 0) return;

    const datosClinica = {
      nombreClinica: clinicSettings?.clinicName || "Consultorio Médico Integral",
      nombreMedico: consulta.doctorName || "Médico Tratante",
      jvpm: consulta.doctorJvpm || clinicSettings?.jvpm || "---",
      telefono: clinicSettings?.phone || "---",
      direccion: clinicSettings?.address || "---",
      logoUrl: clinicSettings?.logoUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%23285444' d='M35 15h30v20h20v30H65v20H35V65H15V35h20z'/></svg>",
    };

    const medsHTML = consulta.receta
      .filter((m) => m.name && m.name.trim())
      .map((med) => {
        const fullName = med.concentration ? `${med.name} ${med.concentration}${med.concentrationUnit || ""}` : med.name;
        return `
          <div style="margin-bottom: 22px; padding-bottom: 15px; border-bottom: 1px dashed #e5e7eb;">
            <h3 style="margin: 0 0 6px 0; color: #111827; font-size: 1.15rem;">${fullName}</h3>
            <p style="margin: 0 0 6px 0; font-size: 1rem; color: #374151;">
              <strong>Tomar/Aplicar:</strong> ${med.dose || ""} ${med.doseUnit || ""}
              ${med.frequency ? `cada ${med.frequency}` : ""}
              ${med.duration ? `por ${med.duration}` : ""}.
              <br/><span style="color:#6b7280; font-size: 0.9rem;">Vía de administración: ${med.route || "Oral"}</span>
            </p>
            ${med.additionalInstructions ? `<p style="margin: 0; font-size: 0.95rem; color: #1f2937;"><strong>Indicaciones:</strong> ${med.additionalInstructions}</p>` : ""}
          </div>
        `;
      })
      .join("");

    const html = `<!doctype html>
      <html>
        <head>
          <title>Receta Médica - ${consulta.patientName || "Paciente"}</title>
          <style>
            @media print { @page { margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; align-items: center; border-bottom: 3px solid #285444; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
            .clinic-info { flex-grow: 1; }
            .clinic-name { color: #285444; margin: 0 0 5px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
            .doc-name { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; color: #111827; }
            .doc-details { font-size: 12px; color: #4b5563; margin: 0; line-height: 1.4; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .patient-box p { margin: 3px 0; font-size: 14px; }
            .rx { font-size: 40px; color: #285444; font-family: Georgia, serif; font-style: italic; line-height: 1; margin-bottom: 20px; }
            .signature-section { margin-top: 80px; display: flex; justify-content: flex-end; }
            .signature-line { width: 250px; border-top: 1px solid #1f2937; text-align: center; padding-top: 8px; }
            .signature-line p { margin: 2px 0; font-size: 12px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${datosClinica.logoUrl}" class="logo" alt="Logo Clínica" />
            <div class="clinic-info">
              <h1 class="clinic-name">${datosClinica.nombreClinica}</h1>
              <h2 class="doc-name">${datosClinica.nombreMedico}</h2>
              <p class="doc-details">
                <strong>JVPM:</strong> ${datosClinica.jvpm} | <strong>Tel:</strong> ${datosClinica.telefono}<br/>
                <strong>Dirección:</strong> ${datosClinica.direccion}
              </p>
            </div>
          </div>
          <div class="patient-box">
            <div>
              <p><strong>Paciente:</strong> ${consulta.patientName || "Paciente"}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Fecha:</strong> ${new Date(consulta.consultationDate || consulta.createdAt || Date.now()).toLocaleDateString()}</p>
              <p><strong>N° Expediente:</strong> ${consulta.patientFileNumber || "N/A"}</p>
            </div>
          </div>
          <div class="content">
            <div class="rx">Rx</div>
            ${medsHTML}
          </div>
          <div class="signature-section">
            <div class="signature-line">
              <strong>${datosClinica.nombreMedico}</strong>
              <p>Firma y Sello</p>
            </div>
          </div>
        </body>
      </html>`;

    setPrescriptionPreview({ open: true, html });
  };

  if (isLoading) {
    return (
      <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando expediente médico…
      </div>
    );
  }

  if (isError || !consulta) {
    return (
      <div className="page" style={{ maxWidth: "900px" }}>
        <header className="page-header">
          <div className="page-header__title">
            <span className="page-header__eyebrow">Error</span>
            <h1 className="page-header__heading">No se pudo cargar la consulta</h1>
          </div>
          <div className="page-header__actions">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Regresar
            </button>
          </div>
        </header>
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--accent-coral)", background: "var(--accent-coral-soft)" }}
        >
          <p style={{ fontWeight: 600, fontSize: "1.05rem", margin: 0 }}>
            No se pudo cargar el detalle de la consulta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Expediente</span>
          <h1 className="page-header__heading">Detalle de consulta médica</h1>
        </div>
        <div className="page-header__actions">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Regresar
          </button>
        </div>
      </header>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-heading">Evaluación clínica</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
          <div>
            <span style={label}>Anamnesis</span>
            <div style={textValue}>{consulta.anamnesis || "No registrado"}</div>
          </div>
          <div>
            <span style={label}>Examen físico</span>
            <div style={textValue}>{consulta.physicalExam || "No registrado"}</div>
          </div>
          <div>
            <span style={label}>Diagnóstico</span>
            <div style={diagnosisValue}>{consulta.diagnosis || "No registrado"}</div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-heading">Notas adicionales</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
          <div>
            <span style={label}>Cobertura</span>
            <div style={textValue}>
              {consulta.insurer?.companyName || "Particular"}
              {consulta.agreedAmount
                ? ` | Monto aplicado: $${Number(consulta.agreedAmount).toFixed(2)}`
                : ""}
            </div>
          </div>
          <div>
            <span style={label}>Resultados de laboratorio</span>
            <div style={textValue}>{consulta.labResults || "Sin resultados reportados."}</div>
          </div>
          <div>
            <span style={label}>Observaciones médicas</span>
            <div style={textValue}>{consulta.observations || "Ninguna observación adicional."}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
          <h2 className="card-heading" style={{ margin: 0 }}>
            Receta médica ({consulta.receta?.length || 0})
          </h2>
          {consulta.receta && consulta.receta.length > 0 && (
            <button type="button" onClick={handlePrintReceta} className="btn btn-secondary btn-sm">
              <i className="ri-printer-line"></i> Imprimir receta
            </button>
          )}
        </div>

        {!consulta.receta || consulta.receta.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.25rem",
              color: "var(--fg-muted)",
              background: "var(--bg-surface-alt)",
              borderRadius: "var(--radius-md)",
              marginTop: "0.75rem",
            }}
          >
            No se prescribieron medicamentos en esta consulta.
          </div>
        ) : (
          <div style={{ marginTop: "0.75rem" }}>
            {consulta.receta.map((med) => (
              <div key={med.id} style={medCard}>
                <h3
                  style={{
                    margin: "0 0 0.7rem",
                    color: "var(--accent-slate)",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {med.name}{" "}
                  <span style={{ fontSize: "0.85rem", color: "var(--accent-slate)", fontWeight: 500 }}>
                    ({med.concentration} {med.concentrationUnit})
                  </span>
                </h3>
                <div style={medGrid}>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Dosis: <strong style={{ color: "var(--fg-primary)" }}>{med.dose} {med.doseUnit}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Vía: <strong style={{ color: "var(--fg-primary)" }}>{med.route}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Frecuencia: <strong style={{ color: "var(--fg-primary)" }}>Cada {med.frequency} hrs</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Duración: <strong style={{ color: "var(--fg-primary)" }}>Por {med.duration} días</strong>
                  </div>
                </div>
                {med.additionalInstructions && (
                  <div
                    style={{
                      marginTop: "0.7rem",
                      fontSize: "0.85rem",
                      color: "var(--accent-slate)",
                      background: "var(--bg-surface)",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <strong>Indicaciones:</strong> {med.additionalInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección de Documentos Clínicos Emitidos */}
      {consulta.documentos && consulta.documentos.length > 0 && (
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2 className="card-heading">Documentos clínicos emitidos ({consulta.documentos.length})</h2>
          <div style={{ display: "grid", gap: "0.8rem", marginTop: "0.75rem" }}>
            {consulta.documentos.map((doc, idx) => {
              const tipoLabel =
                doc.documentType === "sick_leave"
                  ? "Incapacidad médica"
                  : doc.documentType === "certificate"
                  ? "Constancia médica"
                  : doc.documentType === "prescription"
                  ? "Receta médica adicional"
                  : "Documento clínico";

              return (
                <div
                  key={doc.id || idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--bg-surface-alt)",
                    padding: "0.9rem 1.1rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    flexWrap: "wrap",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <i className="ri-file-text-line" style={{ color: "var(--brand)", fontSize: "1.2rem" }}></i>
                      <strong style={{ color: "var(--fg-primary)" }}>{tipoLabel}</strong>
                    </div>
                    {doc.textContent && (
                      <p
                        style={{
                          margin: "0.3rem 0 0",
                          color: "var(--fg-muted)",
                          fontSize: "0.85rem",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {doc.textContent}
                      </p>
                    )}
                  </div>
                  {doc.pdfBase64 && (
                    <button
                      type="button"
                      onClick={() => printPdfDirect(doc.pdfBase64)}
                      className="btn btn-secondary btn-sm"
                    >
                      <i className="ri-printer-line"></i> Imprimir PDF
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal de Previsualización e Impresión de Receta */}
      <PrescriptionPreviewModal
        isOpen={prescriptionPreview.open}
        onClose={() => setPrescriptionPreview({ open: false, html: "" })}
        html={prescriptionPreview.html}
        patientName={consulta.patientName || "Paciente"}
      />
    </div>
  );
};
