import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useWaitingRoom, useUpdatePreclinicalStatus } from "../../hooks/usePreclinical";
import { Modal } from "../../components/Modal";
import { calcularEdad, getStatusBadge } from "../../lib/utils";
import "../../views/shared/Shared.css";

export const SalaEspera = () => {
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);

  const { data: items = [], isLoading, error } = useWaitingRoom();
  const statusMutation = useUpdatePreclinicalStatus();

  const today = new Date().toLocaleDateString("es-SV", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const sortedItems = useMemo(() => {
    const order = { waiting: 0, in_consultation: 1, done: 2, cancelled: 3 };
    return [...items].sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
  }, [items]);

  const waitingCount = items.filter((i) => i.status === "waiting").length;
  const inConsultCount = items.filter((i) => i.status === "in_consultation").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  const handleCancel = (id) => {
    if (!window.confirm("Cancelar este registro pre-clinico?")) return;
    statusMutation.mutate({ id, status: "cancelled" });
  };

  const handleConsulta = (item) => {
    statusMutation.mutate({ id: item.id, status: "in_consultation" }, {
      onSuccess: () => navigate(`/doctor/consulta/${item.id}`),
    });
  };

  const evaluarPresion = (bp) => {
    if (!bp) return { label: "N/A", color: "#6b7280" };
    const [sys, dia] = bp.split("/").map(Number);
    if (sys < 120 && dia < 80) return { label: "Normal", color: "#22c55e" };
    if (sys < 140 && dia < 90) return { label: "Elevada", color: "#f59e0b" };
    return { label: "Alta", color: "#ef4444" };
  };

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem" },
    container: { maxWidth: "1100px", margin: "0 auto" },
    statsRow: { display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" },
    stat: (color) => ({ padding: "1rem 1.5rem", backgroundColor: "white", borderRadius: "12px", borderLeft: `4px solid ${color}`, boxShadow: "0 2px 6px rgba(0,0,0,0.04)", flex: "1", minWidth: "180px" }),
    card: { backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden" },
    row: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "1rem 1.5rem", alignItems: "center", borderBottom: "1px solid #f3f4f6" },
    th: { padding: "1rem 1.5rem", color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" },
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ margin: 0, color: "#1f2937" }}>Sala de Espera</h1>
            <p style={{ color: "#6b7280", margin: "0.3rem 0 0" }}>{today}</p>
          </div>
          <button onClick={() => setShowSummary(true)} className="doc-btn" style={{ color: "#0d9488", padding: "0.6rem 1.2rem" }}>
            Resumen del dia
          </button>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div style={S.stat("#f59e0b")}><div style={{ color: "#6b7280", fontSize: "0.85rem" }}>En Espera</div><div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{waitingCount}</div></div>
          <div style={S.stat("#0ea5e9")}><div style={{ color: "#6b7280", fontSize: "0.85rem" }}>En Consulta</div><div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{inConsultCount}</div></div>
          <div style={S.stat("#22c55e")}><div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Atendidos</div><div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{doneCount}</div></div>
        </div>

        {/* Lista */}
        <div style={S.card}>
          <div style={{ ...S.row, backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
            <span style={S.th}>Paciente</span>
            <span style={S.th}>Signos Vitales</span>
            <span style={S.th}>Estado</span>
            <span style={{ ...S.th, textAlign: "right" }}>Acciones</span>
          </div>

          {isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Cargando lista de espera...</div>
          ) : error ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>Error al cargar la lista.</div>
          ) : sortedItems.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No hay pacientes en espera hoy.</div>
          ) : (
            sortedItems.map((item) => {
              const badge = getStatusBadge(item.status);
              const bp = evaluarPresion(item.bloodPressure);
              const edad = calcularEdad(item.patientDob);
              return (
                <div key={item.id} style={{ ...S.row, opacity: item.status === "cancelled" ? 0.5 : 1 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.patientName || "Paciente"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{edad > 0 ? `${edad} anios` : ""} | Motivo: {item.motivo || "N/A"}</div>
                  </div>
                  <div style={{ fontSize: "0.85rem" }}>
                    <div>PA: <span style={{ color: bp.color, fontWeight: 600 }}>{item.bloodPressure || "N/A"}</span></div>
                    <div>T: {item.temperature ? `${item.temperature}C` : "N/A"} | FC: {item.heartRate || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>{badge.label}</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {item.status === "waiting" && (
                      <>
                        <button onClick={() => handleConsulta(item)} className="doc-btn" style={{ color: "#0d9488" }}>Atender</button>
                        <button onClick={() => handleCancel(item.id)} className="doc-btn" style={{ color: "#ef4444" }}>Cancelar</button>
                      </>
                    )}
                    {item.status === "in_consultation" && (
                      <button onClick={() => navigate(`/doctor/consulta/${item.id}`)} className="doc-btn" style={{ color: "#0ea5e9" }}>Continuar</button>
                    )}
                    {item.status === "done" && item.consultationId && (
                      <button onClick={() => navigate(`/doctor/consulta-detalle/${item.consultationId}`)} className="doc-btn">Ver detalle</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal resumen */}
      <Modal isOpen={showSummary} onClose={() => setShowSummary(false)} title="Resumen del Dia" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "8px" }}><strong>En espera:</strong> {waitingCount}</div>
          <div style={{ padding: "1rem", backgroundColor: "#dbeafe", borderRadius: "8px" }}><strong>En consulta:</strong> {inConsultCount}</div>
          <div style={{ padding: "1rem", backgroundColor: "#dcfce7", borderRadius: "8px" }}><strong>Atendidos:</strong> {doneCount}</div>
          <div style={{ padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "8px" }}><strong>Total registros:</strong> {items.length}</div>
        </div>
      </Modal>
    </div>
  );
};
