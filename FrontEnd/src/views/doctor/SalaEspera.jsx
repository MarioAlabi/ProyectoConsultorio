import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../../views/shared/Shared.css";
import { api } from "../../lib/api";

export const SalaEspera = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [cancellingId, setCancellingId] = useState(null);

  const fetchWaiting = async (cancelFlag) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/preclinical", { params: { status: "waiting" } });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

      if (!cancelFlag?.current) setItems(data);
    } catch (e) {
      console.error(e);
      if (!cancelFlag?.current)
        setError("No se pudo cargar la sala de espera. Revisa tu conexión o permisos.");
    } finally {
      if (!cancelFlag?.current) setLoading(false);
    }
  };

  useEffect(() => {
    const cancelFlag = { current: false };

    fetchWaiting(cancelFlag);
    const t = setInterval(() => fetchWaiting(cancelFlag), 8000);

    return () => {
      cancelFlag.current = true;
      clearInterval(t);
    };
  }, []);

  const handleAttend = async (preclinicalId, row) => {
    try {
      await api.patch(`/preclinical/${preclinicalId}/status`, { status: "in_consultation" });

      const paciente = {
        id: row.patientId,
        nombre: row.fullName ?? "Paciente",
        esMenor: Boolean(row.isMinor),
        dui: row.identityDocument ?? "",
        fileNumber: row.fileNumber ?? "",
      };

      navigate(`/doctor/consulta/${preclinicalId}`, {
        state: { paciente, preclinicalId },
      });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.status === 403
          ? "No tienes permiso para iniciar esta consulta."
          : e?.response?.data?.message || "No se pudo iniciar la consulta.";
      alert(msg);
    }
  };

  const handleCancel = async (preclinicalId) => {
    if (cancellingId) return;

    const ok = confirm("¿Seguro que deseas cancelar esta pre-clínica?\n\nSe eliminará de la sala de espera.");
    if (!ok) return;

    try {
      setCancellingId(preclinicalId);
      await api.patch(`/preclinical/${preclinicalId}/status`, { status: "cancelled" });

      setItems((prev) => prev.filter((x) => x.id !== preclinicalId));
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.status === 403
          ? "No tienes permiso para cancelar esta pre-clínica."
          : e?.response?.data?.message || "No se pudo cancelar. Intenta nuevamente.";
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  };

  const count = items.length;

  const stats = useMemo(() => {
    const minors = items.filter((x) => Boolean(x.isMinor)).length;
    const adults = count - minors;
    return { minors, adults };
  }, [items, count]);

  // ✅ estilos “más pro”
  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      padding: "28px 14px",
    },
    container: { maxWidth: 1050, margin: "0 auto" },

    header: {
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(10px)",
      border: "1px solid #e5e7eb",
      borderRadius: 18,
      padding: "16px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      marginBottom: 14,
    },
    title: { margin: 0, color: "#0f172a", fontSize: 22, fontWeight: 950 },
    sub: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },

    pillRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
    pill: (bg, border, color) => ({
      background: bg,
      border: `1px solid ${border}`,
      color,
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 900,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    }),

    topActions: { display: "flex", gap: 10, alignItems: "center" },
    btnBlue: {
      background: "linear-gradient(90deg, #0ea5e9, #22c55e)",
      border: "none",
      color: "white",
      borderRadius: 14,
      padding: "11px 14px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 25px rgba(14,165,233,0.18)",
      width: "auto",
      transition: "transform .08s ease",
    },
    btnGhost: {
      background: "white",
      border: "1px solid #e5e7eb",
      color: "#0f172a",
      borderRadius: 14,
      padding: "11px 14px",
      fontWeight: 900,
      cursor: "pointer",
      width: "auto",
    },

    alertBase: {
      borderRadius: 14,
      padding: "12px 14px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: 10,
      border: "1px solid",
      marginBottom: 14,
    },
    alertErr: { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" },

    list: { marginTop: 12, display: "grid", gap: 12 },

    card: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 18,
      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      padding: 16,
      display: "flex",
      gap: 14,
      alignItems: "center",
      justifyContent: "space-between",
    },

    left: { flex: 1, minWidth: 0 },

    nameRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
    name: { margin: 0, color: "#0f172a", fontSize: 17, fontWeight: 950 },

    badge: (minor) => ({
      borderRadius: 999,
      padding: "6px 10px",
      fontSize: 12,
      fontWeight: 950,
      border: `1px solid ${minor ? "#93c5fd" : "#86efac"}`,
      background: minor ? "#dbeafe" : "#ecfdf5",
      color: minor ? "#1e40af" : "#065f46",
    }),

    motivo: { marginTop: 8, color: "#475569", fontSize: 14, lineHeight: 1.35 },
    label: { fontWeight: 900, color: "#0f172a" },

    meta: { marginTop: 6, color: "#94a3b8", fontSize: 12 },

    actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

    btnDanger: (disabled) => ({
      background: disabled ? "#fecaca" : "#ef4444",
      border: `1px solid ${disabled ? "#fecaca" : "#ef4444"}`,
      color: disabled ? "#7f1d1d" : "white",
      borderRadius: 14,
      padding: "10px 12px",
      fontWeight: 950,
      cursor: disabled ? "not-allowed" : "pointer",
      width: "auto",
      transition: "transform .08s ease",
    }),

    btnPrimary: (disabled) => ({
      background: disabled ? "#c7d2fe" : "linear-gradient(90deg, #0d9488, #22c55e)",
      border: "none",
      color: disabled ? "#1e3a8a" : "white",
      borderRadius: 14,
      padding: "10px 12px",
      fontWeight: 950,
      cursor: disabled ? "not-allowed" : "pointer",
      width: "auto",
      boxShadow: disabled ? "none" : "0 12px 25px rgba(13,148,136,0.18)",
      transition: "transform .08s ease",
    }),

    empty: {
      background: "white",
      border: "1px dashed #cbd5e1",
      borderRadius: 18,
      padding: 18,
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },

    skeleton: {
      height: 86,
      borderRadius: 18,
      border: "1px solid #e5e7eb",
      background:
        "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)",
      backgroundSize: "400% 100%",
      animation: "skeleton 1.1s ease infinite",
    },
  };

  return (
    <div style={S.page}>
      {/* animación skeleton (inline) */}
      <style>
        {`@keyframes skeleton{0%{background-position:100% 0}100%{background-position:0 0}}`}
      </style>

      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Sala de Espera</h1>
            <p style={S.sub}>Pacientes con pre-clínica en espera.</p>

            <div style={S.pillRow}>
              <span style={S.pill("#eef2ff", "#c7d2fe", "#1e3a8a")}>
                🧾 Total: <b>{count}</b>
              </span>
              <span style={S.pill("#dbeafe", "#93c5fd", "#1e40af")}>
                👶 Menores: <b>{stats.minors}</b>
              </span>
              <span style={S.pill("#ecfdf5", "#86efac", "#065f46")}>
                🧑 Adultos: <b>{stats.adults}</b>
              </span>
            </div>
          </div>

          <div style={S.topActions}>
            <button
              type="button"
              style={S.btnGhost}
              onClick={() => fetchWaiting({ current: false })}
            >
              ↻ Actualizar
            </button>

            <button
              type="button"
              style={S.btnBlue}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              onClick={() =>
                navigate("/doctor/preclinica", {
                  state: { redirectTo: "/doctor", title: "Pre-clínica (Doctor)" },
                })
              }
            >
              + Atención Directa
            </button>
          </div>
        </div>

        {!loading && error && (
          <div style={{ ...S.alertBase, ...S.alertErr }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div style={S.list}>
            <div style={S.skeleton} />
            <div style={S.skeleton} />
            <div style={S.skeleton} />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={S.empty}>
            <span style={{ fontSize: 20 }}>🕒</span>
            <div>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>No hay pacientes en espera</div>
              <div style={{ fontSize: 13, marginTop: 2, color: "#64748b" }}>
                Cuando registren pre-clínica, aparecerán aquí automáticamente.
              </div>
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div style={S.list}>
            {items.map((p) => {
              const isCancelling = cancellingId === p.id;
              const minor = Boolean(p.isMinor);

              return (
                <div key={p.id} style={S.card}>
                  <div style={S.left}>
                    <div style={S.nameRow}>
                      <h3 style={S.name}>{p.fullName ?? "Paciente"}</h3>
                      <span style={S.badge(minor)}>{minor ? "MENOR" : "ADULTO"}</span>
                    </div>

                    <div style={S.motivo}>
                      <span style={S.label}>Motivo:</span> {p.motivo ?? "Sin motivo"}
                    </div>

                    <div style={S.meta}>
                      {p.createdAt ? (
                        <>
                          Registrado: <b style={{ color: "#475569" }}>{formatTime(p.createdAt)}</b>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div style={S.actions}>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancel(p.id)}
                      style={S.btnDanger(isCancelling)}
                      onMouseDown={(e) => !isCancelling && (e.currentTarget.style.transform = "translateY(1px)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                    >
                      {isCancelling ? "Cancelando..." : "Cancelar"}
                    </button>

                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleAttend(p.id, p)}
                      style={S.btnPrimary(isCancelling)}
                      onMouseDown={(e) => !isCancelling && (e.currentTarget.style.transform = "translateY(1px)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                      title={isCancelling ? "Espera a que termine la cancelación" : "Iniciar consulta"}
                    >
                      🩺 Iniciar Consulta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* tip pequeño */}
        {!loading && !error && items.length > 0 && (
          <div style={{ marginTop: 10, color: "#64748b", fontSize: 12 }}>
           
          </div>
        )}
      </div>
    </div>
  );
};