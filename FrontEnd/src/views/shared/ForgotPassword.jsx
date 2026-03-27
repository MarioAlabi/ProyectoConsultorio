import { useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { forgotPasswordSchema } from "../../lib/validations/userSchema";
import logoClinica from "../../assets/logo.png";
import "./Shared.css";

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
    <div className="landing-container">
      <div className="landing-card" style={{ maxWidth: "450px", width: "90%", padding: "3rem", gap: "1.5rem", boxSizing: "border-box" }}>
        <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: "160px", height: "auto" }} />
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2 className="landing-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Recuperar Contrasena</h2>
          <p className="landing-description" style={{ fontSize: "1rem" }}>
            {sent ? "Revisa tu bandeja de entrada. Si el correo existe, recibiras un enlace para restablecer tu contrasena." : "Ingresa tu correo electronico y te enviaremos un enlace."}
          </p>
        </div>
        {!sent && (
          <form className="login-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo Electronico</label>
              <input type="email" id="email" className="form-input" placeholder="ej. doctor@ejemplo.com" {...register("email")} />
              {errors.email && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.email.message}</span>}
            </div>
            <button type="submit" className="submit-btn" disabled={isPending} style={{ opacity: isPending ? 0.7 : 1 }}>{isPending ? "Enviando..." : "Enviar enlace"}</button>
          </form>
        )}
        <Link to="/login" className="forgot-password" style={{ fontSize: "0.9rem", textAlign: "center" }}>Volver al inicio de sesion</Link>
      </div>
    </div>
  );
};
