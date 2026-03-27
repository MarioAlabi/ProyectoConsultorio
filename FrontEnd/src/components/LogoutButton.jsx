import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { Modal } from "./Modal";

export const LogoutButton = ({ className = "" }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmLogout = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: { onSuccess: () => navigate("/login") },
      });
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={className}
        style={{
          backgroundColor: "#ef4444", color: "white", padding: "0.5rem 1rem",
          borderRadius: "0.5rem", border: "none", fontWeight: "bold", cursor: "pointer",
        }}
      >
        Cerrar Sesion
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Cerrar Sesion?" size="sm">
        <p style={{ color: "#4b5563", marginBottom: "2rem" }}>Estas seguro que quieres salir del sistema?</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button onClick={() => setShowModal(false)} disabled={isPending} className="doc-btn">Cancelar</button>
          <button
            onClick={confirmLogout}
            disabled={isPending}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? "Saliendo..." : "Si, salir"}
          </button>
        </div>
      </Modal>
    </>
  );
};
