import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { changePasswordSchema } from "../../lib/validations/userSchema";
import logoClinica from "../../assets/logo.png";
import "./Shared.css";

export const ChangePassword = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        setError("root", { message: error.message || "Error al actualizar contrasena." });
        toast.error(error.message || "Error al actualizar contrasena.");
        return;
      }
      setSuccess(true);
      toast.success("Contrasena actualizada correctamente.");
      setTimeout(() => navigate(-1), 3000);
    });
  };

  return (
    <div className="landing-container" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="landing-card" style={{ maxWidth: "450px", width: "90%", padding: "2.5rem", gap: "1.2rem", boxSizing: "border-box", marginTop: "2rem" }}>
        <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: "130px", height: "auto" }} />
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2 className="landing-title" style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{success ? "Exito" : "Seguridad"}</h2>
          <p className="landing-description" style={{ fontSize: "0.95rem" }}>{success ? "Tu contrasena ha sido actualizada correctamente." : "Ingresa tus datos para actualizar tu clave de acceso."}</p>
        </div>
        {!success && (
          <form className="login-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <div className="form-group"><label className="form-label">Contrasena Actual</label><input type="password" className="form-input" placeholder="........" {...register("currentPassword")} />{errors.currentPassword && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.currentPassword.message}</span>}</div>
            <div className="form-group"><label className="form-label">Nueva Contrasena</label><input type="password" className="form-input" placeholder="Minimo 6 caracteres" {...register("newPassword")} />{errors.newPassword && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.newPassword.message}</span>}</div>
            <div className="form-group"><label className="form-label">Confirmar Nueva Contrasena</label><input type="password" className="form-input" placeholder="........" {...register("confirmPassword")} />{errors.confirmPassword && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.confirmPassword.message}</span>}</div>
            {errors.root && <div style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>{errors.root.message}</div>}
            <button type="submit" className="submit-btn" disabled={isPending} style={{ opacity: isPending ? 0.7 : 1, marginTop: "1rem" }}>{isPending ? "Cambiando..." : "Actualizar Contrasena"}</button>
          </form>
        )}
        <button onClick={() => navigate(-1)} className="forgot-password" style={{ fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", color: "#666", marginTop: "10px" }}>Cancelar y volver</button>
      </div>
    </div>
  );
};
