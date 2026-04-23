import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            padding: "2rem",
            textAlign: "center",
            background: "var(--bg-canvas)",
          }}
        >
          <article
            className="card-elevated"
            style={{ maxWidth: "520px", width: "100%", padding: "2.5rem 2rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-coral-soft)",
                color: "var(--accent-coral)",
                fontSize: "1.75rem",
                marginBottom: "1rem",
              }}
            >
              <i className="ri-error-warning-line"></i>
            </div>
            <h2
              style={{
                color: "var(--fg-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                letterSpacing: "-0.02em",
                margin: "0 0 0.5rem",
              }}
            >
              Algo salió mal
            </h2>
            <p style={{ color: "var(--fg-secondary)", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
              Ocurrió un error inesperado. Por favor, recarga la página o contacta a soporte si el problema persiste.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-lg"
            >
              <i className="ri-refresh-line"></i> Recargar página
            </button>
          </article>
        </div>
      );
    }

    return this.props.children;
  }
}
