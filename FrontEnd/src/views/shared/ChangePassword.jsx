import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { changePasswordSchema } from "../../lib/validations/userSchema";

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
        setError("root", { message: error.message || "Error al actualizar la contraseña." });
        toast.error(error.message || "Error al actualizar la contraseña.");
        return;
      }
      setSuccess(true);
      toast.success("Contraseña actualizada correctamente.");
      setTimeout(() => navigate(-1), 2200);
    });
  };

  return (
    <div className="page" style={{ maxWidth: "560px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Seguridad</span>
          <h1 className="page-header__heading">
            {success ? "Contraseña actualizada" : "Cambiar contraseña"}
          </h1>
          <p className="page-header__sub">
            {success
              ? "Tu contraseña fue actualizada correctamente. Serás redirigido en unos segundos."
              : "Actualiza tu contraseña para mantener tu cuenta segura. Las demás sesiones activas se cerrarán automáticamente."}
          </p>
        </div>
      </header>

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="card-elevated" style={{ padding: "1.75rem" }}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div className="form-group">
              <label className="form-label">Contraseña actual</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("currentPassword")}
              />
              {errors.currentPassword && <span className="field-error">{errors.currentPassword.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar nueva contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
            </div>

            {errors.root && (
              <div className="form-banner form-banner--error">
                <i className="ri-error-warning-line"></i>
                <span>{errors.root.message}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? "Cambiando…" : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
