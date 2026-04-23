import { useState } from "react";
import toast from "react-hot-toast";
import { useFormContext } from "react-hook-form";
import { useSettings } from "../../hooks/useSettings";
import { authClient } from "../../lib/auth-client";
import { calcularEdad } from "../../lib/utils";
import { PrescriptionPreviewModal } from "../../components/PrescriptionPreviewModal";
import { useCheckPrescription } from "../../hooks/useAIClinical"; // <-- NUEVO HOOK

const preventNegative = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
};

const createMedicationDraft = () => ({
  clientId: crypto.randomUUID(),
  name: "", concentration: "", concentrationUnit: "mg",
  doseAmount: "", doseUnit: "Tableta(s)", route: "Oral",
  frequencyAmount: "", frequencyUnit: "horas",
  durationAmount: "", durationUnit: "días",
  additionalInstructions: "",
});

const fieldLabel = { fontSize: "0.78rem", color: "var(--fg-muted)", marginBottom: "0.3rem", display: "block", fontWeight: 500 };
const medSelect = { padding: "0.6rem 0.75rem", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", outline: "none", width: "100%", fontSize: "0.9rem", color: "var(--fg-primary)", fontFamily: "var(--font-body)" };

export const MedicationSection = ({ medicamentos, setMedicamentos, data, patientProfile }) => {
  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();
  
  const [prescriptionPreview, setPrescriptionPreview] = useState({ open: false, html: "" });

  // --- HOOK DE SEGURIDAD IA ---
  const checkSafetyMutation = useCheckPrescription();

  const agregarMedicamento = () => setMedicamentos((current) => [...current, createMedicationDraft()]);
  
  const updateMed = (idx, field, value) => {
    setMedicamentos((current) => {
      const copy = [...current];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };
  
  const removeMed = (idx) => setMedicamentos((current) => current.filter((_, i) => i !== idx));

  // --- FUNCIÓN DE ESCÁNER IA ---
  const handleCheckSafety = () => {
    const validMeds = medicamentos.filter((m) => m.name.trim() !== "");
    if (validMeds.length === 0) {
      return toast.error("Agregue al menos un medicamento válido para escanear.");
    }

    // Le mandamos los medicamentos y el perfil completo del paciente (para que la IA lea antecedentes y edad)
    checkSafetyMutation.mutate(
      { medications: validMeds, patient: patientProfile },
      {
        onSuccess: (response) => {
          if (response.allClear) {
            toast.success("Receta segura. No se detectaron interacciones ni riesgos mayores.", {
              icon: '✅',
              duration: 4000
            });
          } else {
            toast("La IA detectó advertencias clínicas. Revisa el panel de alertas.", {
              icon: '⚠️',
              duration: 5000
            });
          }
        }
      }
    );
  };

  const buildPrescriptionHtml = () => {
    const datosClinica = {
      nombreClinica: settings?.clinicName || "Consultorio Médico Integral",
      nombreMedico: session?.user?.name ? `Dr/Dra. ${session.user.name}` : "Médico Tratante",
      jvpm: session?.user?.jvpm || settings?.jvpm || "---",
      telefono: session?.user?.phone || settings?.phone || "---",
      direccion: settings?.address || "---",
      logoUrl: settings?.logoUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%23285444' d='M35 15h30v20h20v30H65v20H35V65H15V35h20z'/></svg>",
    };

    const patientName = data?.patientName || data?.fullName || patientProfile?.fullName || "Paciente";
    
    const dobToUse = data?.patientDob || patientProfile?.yearOfBirth;
    const safeDob = typeof dobToUse === "string" ? dobToUse.split("T")[0] : dobToUse;
    const edad = safeDob ? calcularEdad(safeDob) : null;

    const medsHTML = medicamentos
      .filter((m) => m.name.trim())
      .map((med) => {
        const fullName = med.concentration ? `${med.name} ${med.concentration}${med.concentrationUnit}` : med.name;
        return `
          <div style="margin-bottom: 22px; padding-bottom: 15px; border-bottom: 1px dashed #e5e7eb;">
            <h3 style="margin: 0 0 6px 0; color: #111827; font-size: 1.15rem;">${fullName}</h3>
            <p style="margin: 0 0 6px 0; font-size: 1rem; color: #374151;">
              <strong>Tomar/Aplicar:</strong> ${med.doseAmount} ${med.doseUnit}
              cada ${med.frequencyAmount} ${med.frequencyUnit}
              por ${med.durationAmount} ${med.durationUnit}.
              <br/><span style="color:#6b7280; font-size: 0.9rem;">Vía de administración: ${med.route}</span>
            </p>
            ${med.additionalInstructions ? `<p style="margin: 0; font-size: 0.95rem; color: #1f2937;"><strong>Indicaciones:</strong> ${med.additionalInstructions}</p>` : ""}
          </div>
        `;
      })
      .join("");

    return `<!doctype html>
      <html>
        <head>
          <title>Receta Médica - ${patientName}</title>
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
              <p><strong>Paciente:</strong> ${patientName}</p>
              <p><strong>Edad:</strong> ${edad !== null && edad >= 0 ? `${edad} años` : "No registrada"}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>N° Expediente:</strong> ${data?.patientFileNumber || patientProfile?.fileNumber || "N/A"}</p>
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
  };

  const handlePreviewPrescription = () => {
    if (medicamentos.length === 0 || !medicamentos.some((m) => m.name.trim() !== "")) {
      return toast.error("Agrega al menos un medicamento válido para previsualizar.");
    }
    setPrescriptionPreview({ open: true, html: buildPrescriptionHtml() });
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.6rem" }}>
        <h2 className="card-heading" style={{ margin: 0 }}>
          Receta médica ({medicamentos.length})
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          
          {/* NUEVO: Botón de Escáner IA */}
          <button 
            type="button" 
            onClick={handleCheckSafety} 
            className="btn btn-sm" 
            style={{ background: "var(--accent-plum-soft)", color: "var(--accent-plum)", border: "1px solid var(--accent-plum)" }}
            disabled={checkSafetyMutation.isPending || medicamentos.length === 0}
            title="Analizar interacciones, dosis y alergias según historial del paciente"
          >
            <i className="ri-shield-check-line"></i> {checkSafetyMutation.isPending ? "Escaneando..." : "Escáner IA"}
          </button>

          <button type="button" onClick={handlePreviewPrescription} className="btn btn-secondary btn-sm">
            <i className="ri-eye-line"></i> Previsualizar
          </button>
          <button type="button" onClick={agregarMedicamento} className="btn btn-primary btn-sm">
            <i className="ri-add-line"></i> Agregar
          </button>
        </div>
      </div>

      {/* PANEL DE ADVERTENCIAS IA */}
      {checkSafetyMutation.data?.warnings?.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #f87171", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#b91c1c", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="ri-error-warning-line" style={{ fontSize: "1.2rem" }}></i> Alertas Farmacológicas (IA)
          </h4>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#7f1d1d", fontSize: "0.9rem" }}>
            {checkSafetyMutation.data.warnings.map((w, i) => (
              <li key={i} style={{ marginBottom: "0.4rem", lineHeight: 1.4 }}>
                <strong>{w.medication}:</strong> {w.message}
                <span 
                  style={{ 
                    marginLeft: "0.5rem", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px",
                    background: w.severity === 'high' ? '#dc2626' : w.severity === 'medium' ? '#f59e0b' : '#6b7280',
                    color: "white", fontWeight: "bold"
                  }}
                >
                  {w.severity.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ margin: "0.6rem 0 0 0", fontSize: "0.8rem", color: "#991b1b", fontStyle: "italic" }}>
            * Recordatorio: La IA es una herramienta de apoyo, la decisión final siempre es médica.
          </p>
        </div>
      )}

      {medicamentos.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--fg-muted)", padding: "2rem 1rem", background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-default)" }}>
          No se han agregado medicamentos.
        </div>
      ) : (
        medicamentos.map((med, idx) => (
          <div key={med.clientId} style={{ padding: "1.2rem", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", marginBottom: "1rem", background: "var(--bg-surface-alt)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
              <strong style={{ color: "var(--fg-secondary)", fontSize: "0.9rem" }}>Medicamento #{idx + 1}</strong>
              <button type="button" onClick={() => removeMed(idx)} style={{ color: "var(--accent-coral)", background: "none", border: "none", cursor: "pointer", padding: "0.3rem" }} title="Eliminar">
                <i className="ri-delete-bin-line" style={{ fontSize: "1.2rem" }}></i>
              </button>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={fieldLabel}>Nombre *</label>
                  <input placeholder="Ej. Paracetamol" className="form-input" value={med.name} onChange={(e) => updateMed(idx, "name", e.target.value)} />
                </div>
                <div>
                  <label style={fieldLabel}>Concentración</label>
                  <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 500" className="form-input" value={med.concentration} onChange={(e) => updateMed(idx, "concentration", e.target.value)} />
                </div>
                <div>
                  <label style={fieldLabel}>Unidad</label>
                  <select style={medSelect} value={med.concentrationUnit} onChange={(e) => updateMed(idx, "concentrationUnit", e.target.value)}>
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="mcg">mcg</option>
                    <option value="UI">UI</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr", gap: "0.75rem" }}>
                <div>
                  <label style={fieldLabel}>Vía admin.</label>
                  <select style={medSelect} value={med.route} onChange={(e) => updateMed(idx, "route", e.target.value)}>
                    <option value="Oral">Oral</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Intravenosa">Intravenosa</option>
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Ótica">Ótica (Oído)</option>
                    <option value="Oftálmica">Oftálmica (Ojos)</option>
                    <option value="Vaginal">Vaginal</option>
                    <option value="Rectal">Rectal</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabel}>Tomar/aplicar</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 1" className="form-input" value={med.doseAmount} onChange={(e) => updateMed(idx, "doseAmount", e.target.value)} style={{ width: "72px" }} />
                    <select style={{ ...medSelect, flex: 1 }} value={med.doseUnit} onChange={(e) => updateMed(idx, "doseUnit", e.target.value)}>
                      <option value="Tableta(s)">Tableta(s)</option>
                      <option value="Cápsula(s)">Cápsula(s)</option>
                      <option value="Mililitro(s)">Mililitro(s)</option>
                      <option value="Gota(s)">Gota(s)</option>
                      <option value="Supositorio(s)">Supositorio(s)</option>
                      <option value="Ampolleta(s)">Ampolleta(s)</option>
                      <option value="Óvulo(s)">Óvulo(s)</option>
                      <option value="Aplicación(es)">Aplicación(es)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={fieldLabel}>Frecuencia (cada…)</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 8" className="form-input" value={med.frequencyAmount} onChange={(e) => updateMed(idx, "frequencyAmount", e.target.value)} style={{ width: "72px" }} />
                    <select style={{ ...medSelect, flex: 1 }} value={med.frequencyUnit} onChange={(e) => updateMed(idx, "frequencyUnit", e.target.value)}>
                      <option value="horas">Hora(s)</option>
                      <option value="días">Día(s)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                <div>
                  <label style={fieldLabel}>Duración (por…)</label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input type="number" min="0" onKeyDown={preventNegative} placeholder="Ej. 5" className="form-input" value={med.durationAmount} onChange={(e) => updateMed(idx, "durationAmount", e.target.value)} style={{ width: "84px" }} />
                    <select style={{ ...medSelect, flex: 1 }} value={med.durationUnit} onChange={(e) => updateMed(idx, "durationUnit", e.target.value)}>
                      <option value="días">Día(s)</option>
                      <option value="semanas">Semana(s)</option>
                      <option value="meses">Mes(es)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={fieldLabel}>Indicaciones de uso</label>
                  <input placeholder="Ej. Tomar después de las comidas" className="form-input" value={med.additionalInstructions} onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)} />
                </div>
              </div>

            </div>
          </div>
        ))
      )}

      <PrescriptionPreviewModal
        isOpen={prescriptionPreview.open}
        onClose={() => setPrescriptionPreview({ open: false, html: "" })}
        html={prescriptionPreview.html}
        patientName={data?.patientName || data?.fullName || patientProfile?.fullName || "Paciente"}
      />

    </section>
  );
};