import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { Modal } from "./Modal";

export const LogoutButton = ({ className = "", style = {}, label = "Cerrar sesión" }) => {
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

  const fallbackClass = className && className.trim().length > 0
    ? className
    : "btn btn-ghost btn-sm";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={fallbackClass}
        style={style}
      >
        <i className="ri-logout-box-r-line" aria-hidden="true" style={{ marginRight: "0.3rem" }}></i>
        {label}
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="¿Cerrar sesión?"
        size="sm"
      >
        <p style={{ color: "var(--fg-secondary)", marginBottom: "1.75rem", lineHeight: 1.55 }}>
          ¿Seguro que quieres salir del sistema? Tendrás que volver a iniciar sesión para continuar.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={isPending}
            className="btn btn-secondary btn-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmLogout}
            disabled={isPending}
            className="btn btn-danger-solid btn-sm"
          >
            {isPending ? "Saliendo..." : "Sí, salir"}
          </button>
        </div>
      </Modal>
    </>
  );
};
