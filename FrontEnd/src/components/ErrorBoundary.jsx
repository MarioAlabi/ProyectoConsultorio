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
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", padding: "2rem", textAlign: "center",
        }}>
          <div style={{
            backgroundColor: "white", padding: "3rem", borderRadius: "1.5rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)", maxWidth: "500px", width: "100%",
          }}>
            <h2 style={{ color: "#b91c1c", marginTop: 0, fontSize: "1.5rem" }}>
              Algo salio mal
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
              Ocurrio un error inesperado. Por favor, recarga la pagina o contacta soporte si el problema persiste.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#0d9488", color: "white", border: "none", padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "1rem",
              }}
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
