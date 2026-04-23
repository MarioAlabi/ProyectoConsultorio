import { useEffect, useRef } from "react";

/**
 * Modal reutilizable con accesibilidad (focus trap, Escape, aria).
 * @param {{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, size?: 'sm'|'md'|'lg'|'xl' }} props
 */
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = { sm: "420px", md: "560px", lg: "760px", xl: "960px" };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(26, 28, 26, 0.48)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "1rem",
        animation: "fadeIn 180ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        ref={contentRef}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth: widths[size],
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "var(--shadow-xl)",
          padding: "1.75rem 2rem 2rem",
          border: "1px solid var(--border-subtle)",
          animation: "slideUp 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            id="modal-title"
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "1.35rem",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--fg-primary)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--fg-muted)",
              lineHeight: 1,
              padding: "0.2rem 0.4rem",
              borderRadius: "var(--radius-sm)",
              transition: "background-color 140ms, color 140ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-surface-alt)";
              e.currentTarget.style.color = "var(--fg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--fg-muted)";
            }}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
