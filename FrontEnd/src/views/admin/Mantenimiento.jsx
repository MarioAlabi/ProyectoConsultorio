import { useState, useRef } from "react";
import toast from "react-hot-toast";

const Mantenimiento = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Lógica para descargar el .sql
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Abre la ruta de descarga en una nueva pestaña
      window.open(`${API_URL}/api/admin/backup`, '_blank');
      toast.success("Respaldo generado con éxito.");
    } catch (error) {
      console.error("Error generando respaldo:", error);
      toast.error("Error al generar el respaldo.");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Manejo del archivo seleccionado
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Lógica para enviar el .sql al servidor
  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo .sql primero.");
      return;
    }

    const confirmacion = window.confirm(
      "⚠️ ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales de la clínica con los del archivo seleccionado. Esta acción no se puede deshacer. ¿Estás seguro de continuar?"
    );

    if (!confirmacion) return;

    setIsRestoring(true);
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Aquí iría tu fetch al backend para subir el archivo
       const response = await fetch(`${API_URL}/api/admin/restore`, {
         method: 'POST',
         body: formData,
         credentials: 'include'
       });
      
       if (response.ok) {
      toast.success("Base de datos restaurada con éxito.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Limpiar el input visualmente
       }
    } catch (error) {
      console.error("Error restaurando base de datos:", error);
      toast.error("Error al restaurar la base de datos.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>Mantenimiento y Seguridad</h1>
      <p style={{ color: "#4b5563", marginBottom: "2rem" }}>
        Gestiona los respaldos de la clínica para evitar la pérdida de información (HU-05).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
        
        {/* Tarjeta de Respaldo */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "2rem", 
          borderRadius: "1rem", 
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          borderTop: "5px solid #0ea5e9" // Azul para indicar acción segura
        }}>
          <h2 style={{ fontSize: "1.25rem", color: "#1f2937", marginBottom: "1rem" }}>Generar Respaldo</h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
            Descarga una copia completa de la base de datos actual. Incluye pacientes, historiales clínicos, citas y usuarios del sistema.
          </p>
          
          <button 
            onClick={handleBackup} 
            disabled={isBackingUp}
            className="submit-btn" 
            style={{ 
              width: "100%", 
              backgroundColor: isBackingUp ? "#9ca3af" : "#0ea5e9", // Cambia a gris si está cargando
              opacity: isBackingUp ? 0.7 : 1,
              cursor: isBackingUp ? "not-allowed" : "pointer",
              marginTop: "0" // Anula el margin-top de tu clase CSS para alinear mejor aquí
            }}
          >
            {isBackingUp ? 'Generando Archivo...' : 'Generar Respaldo Ahora'}
          </button>
        </div>

        {/* Tarjeta de Restauración */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "2rem", 
          borderRadius: "1rem", 
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          borderTop: "5px solid #ef4444" // Rojo para advertir acción destructiva
        }}>
          <h2 style={{ fontSize: "1.25rem", color: "#1f2937", marginBottom: "1rem" }}>Restaurar Sistema</h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
            Sube un archivo <strong style={{ color: "#ef4444" }}>.sql</strong> para restaurar la base de datos. <br/>
            <span style={{ color: "#991b1b", fontWeight: "600", fontSize: "0.85rem" }}>
              ⚠️ Esta acción sobrescribirá todos los datos actuales.
            </span>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input 
              type="file" 
              accept=".sql,.dump"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="form-input"
              style={{ padding: "0.6rem", fontSize: "0.9rem" }}
            />
            
            <button 
              onClick={handleRestore} 
              disabled={isRestoring || !selectedFile}
              className="submit-btn" 
              style={{ 
                width: "100%", 
                backgroundColor: (isRestoring || !selectedFile) ? "#fca5a5" : "#ef4444", // Rojo deshabilitado vs activo
                opacity: (isRestoring || !selectedFile) ? 0.7 : 1,
                cursor: (isRestoring || !selectedFile) ? "not-allowed" : "pointer",
                marginTop: "0"
              }}
            >
              {isRestoring ? 'Restaurando...' : 'Restaurar Base de Datos'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Mantenimiento;