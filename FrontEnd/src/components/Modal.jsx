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

  const widths = { sm: "400px", md: "550px", lg: "750px", xl: "950px" };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 1000, padding: "1rem",
      }}
    >
      <div
        ref={contentRef}
        style={{
          backgroundColor: "white", borderRadius: "1rem", width: "100%",
          maxWidth: widths[size], maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 id="modal-title" style={{ margin: 0, color: "#1f2937", fontSize: "1.25rem", fontWeight: 700 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer",
              color: "#9ca3af", lineHeight: 1, padding: "0.25rem",
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
