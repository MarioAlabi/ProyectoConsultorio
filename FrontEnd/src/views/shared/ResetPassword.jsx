import { useState, useTransition } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { resetPasswordSchema } from "../../lib/validations/userSchema";
import "./Login.css";

const shellCard = {
  position: "relative",
  zIndex: 1,
  maxWidth: "460px",
  width: "100%",
  padding: "2.5rem 2.25rem",
  animation: "slideUp 380ms var(--ease-smooth)",
};

const headerTitle = {
  fontFamily: "var(--font-display)",
  fontSize: "1.9rem",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "var(--fg-primary)",
  margin: "0.45rem 0 0.6rem",
};

const backLink = {
  color: "var(--brand)",
  fontSize: "0.9rem",
  fontWeight: 500,
};

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="auth-screen__ornament auth-screen__ornament--1" aria-hidden="true" />
        <div className="auth-screen__ornament auth-screen__ornament--2" aria-hidden="true" />

        <article className="card-elevated" style={shellCard}>
          <header style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <span className="eyebrow">Enlace caducado</span>
            <h1 style={headerTitle}>Enlace inválido</h1>
            <p style={{ color: "var(--fg-secondary)", fontSize: "0.95rem", margin: 0 }}>
              El enlace para restablecer la contraseña es inválido o ha expirado.
            </p>
          </header>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link to="/forgot-password" className="btn btn-primary">
              Solicitar un nuevo enlace
            </Link>
          </div>
        </article>
      </div>
    );
  }

  const onSubmit = (data) => {
    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: data.password, token });
      if (error) {
        toast.error(error.message || "Error al restablecer la contraseña.");
        return;
      }
      setSuccess(true);
      toast.success("Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/login"), 3000);
    });
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__ornament auth-screen__ornament--1" aria-hidden="true" />
      <div className="auth-screen__ornament auth-screen__ornament--2" aria-hidden="true" />

      <article className="card-elevated" style={shellCard}>
        <header style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <span className="eyebrow">Seguridad</span>
          <h1 style={headerTitle}>
            {success ? "Contraseña actualizada" : "Nueva contraseña"}
          </h1>
          <p style={{ color: "var(--fg-secondary)", fontSize: "0.95rem", margin: 0 }}>
            {success
              ? "Tu contraseña ha sido restablecida. Serás redirigido…"
              : "Ingresa tu nueva contraseña."}
          </p>
        </header>

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "grid", gap: "1.1rem" }}>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword.message}</span>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isPending}
                style={{ width: "100%" }}
              >
                {isPending ? "Guardando…" : "Restablecer contraseña"}
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            marginTop: "1.75rem",
            textAlign: "center",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <Link to="/login" style={backLink}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </article>
    </div>
  );
};
