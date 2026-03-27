import { useState, useTransition } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { resetPasswordSchema } from "../../lib/validations/userSchema";
import logoClinica from "../../assets/logo.png";
import "./Shared.css";

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
      <div className="landing-container">
        <div className="landing-card" style={{ maxWidth: "450px", width: "90%", padding: "3rem", gap: "1.5rem", boxSizing: "border-box" }}>
          <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: "160px", height: "auto" }} />
          <h2 className="landing-title" style={{ fontSize: "2rem" }}>Enlace invalido</h2>
          <p className="landing-description">El enlace para restablecer la contrasena es invalido o ha expirado.</p>
          <Link to="/forgot-password" className="forgot-password">Solicitar un nuevo enlace</Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data) => {
    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: data.password, token });
      if (error) { toast.error(error.message || "Error al restablecer contrasena."); return; }
      setSuccess(true);
      toast.success("Contrasena actualizada correctamente.");
      setTimeout(() => navigate("/login"), 3000);
    });
  };

  return (
    <div className="landing-container">
      <div className="landing-card" style={{ maxWidth: "450px", width: "90%", padding: "3rem", gap: "1.5rem", boxSizing: "border-box" }}>
        <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: "160px", height: "auto" }} />
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2 className="landing-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{success ? "Contrasena actualizada" : "Nueva Contrasena"}</h2>
          <p className="landing-description" style={{ fontSize: "1rem" }}>{success ? "Tu contrasena ha sido restablecida. Seras redirigido..." : "Ingresa tu nueva contrasena."}</p>
        </div>
        {!success && (
          <form className="login-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <div className="form-group"><label className="form-label">Nueva Contrasena</label><input type="password" className="form-input" placeholder="........" {...register("password")} />{errors.password && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.password.message}</span>}</div>
            <div className="form-group"><label className="form-label">Confirmar Contrasena</label><input type="password" className="form-input" placeholder="........" {...register("confirmPassword")} />{errors.confirmPassword && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.confirmPassword.message}</span>}</div>
            <button type="submit" className="submit-btn" disabled={isPending} style={{ opacity: isPending ? 0.7 : 1 }}>{isPending ? "Guardando..." : "Restablecer Contrasena"}</button>
          </form>
        )}
        <Link to="/login" className="forgot-password" style={{ fontSize: "0.9rem", textAlign: "center" }}>Volver al inicio de sesion</Link>
      </div>
    </div>
  );
};
