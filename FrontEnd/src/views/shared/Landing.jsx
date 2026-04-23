import { Link } from "react-router-dom";
import { useSettings } from "../../hooks/useSettings";

export const Landing = () => {
  const { data: settings, isLoading } = useSettings();
  const clinicName = isLoading ? "Cargando clínica…" : (settings?.clinicName || "Esperanza");
  const initial = (settings?.clinicName || "E").charAt(0).toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1.5rem",
        background: "var(--bg-canvas)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-160px",
          right: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, var(--brand-soft), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-180px",
          left: "-140px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, var(--accent-plum-soft), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <article
        className="card-elevated"
        style={{
          position: "relative",
          maxWidth: "620px",
          width: "100%",
          textAlign: "center",
          padding: "2.75rem 2.5rem 2.5rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "88px",
            height: "88px",
            borderRadius: "var(--radius-xl)",
            background: "var(--brand-soft)",
            color: "var(--brand)",
            fontFamily: "var(--font-display)",
            fontSize: "2.75rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`Logo ${clinicName}`}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            initial
          )}
        </div>

        <span
          style={{
            display: "block",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            marginBottom: "0.75rem",
          }}
        >
          Sistema clínico
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.85rem, 3vw, 2.4rem)",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            color: "var(--fg-primary)",
            margin: "0 0 0.75rem",
            lineHeight: 1.1,
          }}
        >
          Sistema de gestión clínica
        </h1>
        <p
          style={{
            color: "var(--fg-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
            margin: "0 auto 1.75rem",
            maxWidth: "52ch",
          }}
        >
          Plataforma integral para la administración de expedientes médicos y generación de documentación clínica con asistencia inteligente para{" "}
          <strong style={{ color: "var(--fg-primary)" }}>{clinicName}</strong>. Acceso exclusivo para personal autorizado.
        </p>

        <Link to="/login" className="btn btn-primary btn-lg" style={{ minWidth: "220px" }}>
          <i className="ri-login-circle-line"></i> Iniciar sesión
        </Link>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            color: "var(--fg-muted)",
            fontSize: "0.8rem",
          }}
        >
          <span>© {new Date().getFullYear()} {clinicName}</span>
          <span>v1.0</span>
        </div>
      </article>
    </div>
  );
};
