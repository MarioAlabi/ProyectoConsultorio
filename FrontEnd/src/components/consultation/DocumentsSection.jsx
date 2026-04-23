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