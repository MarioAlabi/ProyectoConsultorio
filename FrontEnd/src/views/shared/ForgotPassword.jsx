import { useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { forgotPasswordSchema } from "../../lib/validations/userSchema";
import "./Login.css";

export const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message || "Error al enviar el correo.");
        return;
      }
      setSent(true);
      toast.success("Correo enviado. Revisa tu bandeja de entrada.");
    });
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__ornament auth-screen__ornament--1" aria-hidden="true" />
      <div className="auth-screen__ornament auth-screen__ornament--2" aria-hidden="true" />

      <article
        className="card-elevated"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "460px",
          width: "100%",
          padding: "2.5rem 2.25rem",
          animation: "slideUp 380ms var(--ease-smooth)",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <span className="eyebrow">Recuperación</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.9rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--fg-primary)",
              margin: "0.45rem 0 0.6rem",
            }}
          >
            Recuperar contraseña
          </h1>
          <p style={{ color: "var(--fg-secondary)", fontSize: "0.95rem", margin: 0 }}>
            {sent
              ? "Revisa tu bandeja de entrada. Si el correo existe, recibirás un enlace para restablecer tu contraseña."
              : "Ingresa tu correo electrónico y te enviaremos un enlace."}
          </p>
        </header>

        {!sent && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "grid", gap: "1.1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="ej. doctor@ejemplo.com"
                  {...register("email")}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isPending}
                style={{ width: "100%" }}
              >
                {isPending ? "Enviando…" : "Enviar enlace"}
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
          <Link
            to="/login"
            style={{ color: "var(--brand)", fontSize: "0.9rem", fontWeight: 500 }}
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </article>
    </div>
  );
};
