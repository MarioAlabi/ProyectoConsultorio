import { useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

// Importa el modal que creamos al inicio de la sesión
import { DocumentGeneratorModal } from "../../components/DocumentGeneratorModal";

export const DocumentsSection = ({ preclinicalId, data, patientProfile, documentosGenerados, setDocumentosGenerados }) => {
  // Extraemos la función watch del cerebro central para leer el diagnóstico en tiempo real
  const { watch } = useFormContext();
  const currentDiagnosis = watch("diagnosis");

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("certificate");

  const handleAbrirDocumento = () => {
    if (!currentDiagnosis || currentDiagnosis.trim() === "") {
      toast.error("Por favor, ingrese un diagnóstico primero para que la IA tenga contexto.");
      return;
    }
    setIsDocModalOpen(true);
  };

  const patientId = data?.patientId || data?.patient?.id || patientProfile?.id;

  return (
    <section className="card">
      <h2 className="card-heading">Documentos Clínicos</h2>
      <p style={{ margin: "0 0 1rem", color: "var(--fg-muted)", fontSize: "0.95rem" }}>
        Genere constancias, incapacidades o recetas adicionales con asistencia de IA antes de finalizar la consulta. (Requiere ingresar el diagnóstico primero).
      </p>
      
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: "250px" }}>
          <label className="form-label">Tipo de Documento</label>
          <select 
            className="form-input" 
            value={selectedDocType} 
            onChange={(e) => setSelectedDocType(e.target.value)}
            style={{ backgroundColor: "var(--bg-surface)" }}
          >
            <option value="certificate">Constancia Médica (Buena Salud, Embarazo, etc.)</option>
            <option value="sick_leave">Incapacidad Médica</option>
            <option value="prescription">Receta Médica Extra</option>
            <option value="other">Documento Libre / Otro</option>
          </select>
        </div>
        
        <button 
          type="button" 
          onClick={handleAbrirDocumento} 
          className="btn btn-primary" 
          style={{ margin: 0, padding: "0.75rem 1.5rem" }}
        >
          <i className="ri-file-text-line" style={{ marginRight: "8px" }}></i>
          Redactar Documento
        </button>
      </div>

      {/* Lista de documentos adjuntados */}
      {documentosGenerados && documentosGenerados.length > 0 && (
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.92rem", color: "var(--fg-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Documentos adjuntos a emitir ({documentosGenerados.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {documentosGenerados.map((doc, idx) => {
              const labelMap = {
                certificate: "Constancia médica",
                sick_leave: "Incapacidad médica",
                prescription: "Receta extra",
                other: "Documento libre",
              };
              const label = labelMap[doc.documentType] || doc.documentType || "Documento";

              const handlePrintSingle = () => {
                if (!doc.pdfBase64) {
                  return toast.error("Este documento no tiene PDF disponible para impresión.");
                }
                try {
                  const cleanBase64 = doc.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
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
                        console.warn("Print fallback:", e);
                        window.open(blobUrl, "_blank");
                      }
                    }, 300);
                  };
                } catch (err) {
                  console.error(err);
                  toast.error("Error al preparar la impresión del documento.");
                }
              };

              const handleRemoveSingle = () => {
                const updated = documentosGenerados.filter((_, i) => i !== idx);
                setDocumentosGenerados(updated);
                toast.success("Documento removido.");
              };

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-surface-alt)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: "200px" }}>
                    <i className="ri-file-pdf-2-line" style={{ color: "var(--brand)", fontSize: "1.25rem" }}></i>
                    <div>
                      <strong style={{ fontSize: "0.92rem", display: "block" }}>{label}</strong>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--fg-muted)",
                          display: "inline-block",
                          maxWidth: "360px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.textContent || "PDF listo para imprimir"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handlePrintSingle}
                      title="Imprimir documento de prueba o copia"
                    >
                      <i className="ri-printer-line"></i> Imprimir PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleRemoveSingle}
                      style={{ color: "var(--danger)" }}
                      title="Eliminar documento"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Renderizamos el Modal de Gemini IA */}
      <DocumentGeneratorModal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        initialDocType={selectedDocType} 
        patientId={patientId} 
        currentDiagnosis={currentDiagnosis} 
        onDocumentGenerated={(nuevoDoc) => {
          // Agregamos el documento al arreglo central
          setDocumentosGenerados([...documentosGenerados, nuevoDoc]);
        }}
      />
    </section>
  );
};