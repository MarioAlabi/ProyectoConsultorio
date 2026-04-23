import { useEffect, useRef } from "react";
import { Modal } from "./Modal";

/**
 * Modal de previsualización de receta médica (HU-29).
 * Recibe el HTML de la receta completo y lo muestra dentro de un iframe con sandbox,
 * permitiendo al médico verificar antes de enviar a imprimir.
 */
export const PrescriptionPreviewModal = ({ isOpen, onClose, html, patientName }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !html) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [isOpen, html]);

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  const iframeStyle = {
    width: "100%",
    height: "520px",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-surface)",
  };

  const hintStyle = {
    color: "var(--fg-muted)",
    fontSize: "0.82rem",
    margin: 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vista previa de receta${patientName ? ` — ${patientName}` : ""}`}
      size="xl"
    >
      <p style={{ ...hintStyle, marginBottom: "0.75rem" }}>
        Revisa las dosis y frecuencias antes de imprimir. Este paso valida la receta (HU-29).
      </p>
      <iframe
        ref={iframeRef}
        title="Vista previa de receta"
        style={iframeStyle}
        sandbox="allow-same-origin allow-modals"
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1rem",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <span style={hintStyle}>
          Si detectas errores, cierra este diálogo y edita la receta antes de imprimir.
        </span>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar sin imprimir
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <i className="ri-printer-line"></i> Confirmar e imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
};
