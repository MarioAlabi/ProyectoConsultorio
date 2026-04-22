import { useNavigate, Navigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { ROLE_HOME_PATHS } from "../../lib/constants/roles";
import { loginSchema } from "../../lib/validations/userSchema";
import { PasswordInput } from "../../components/PasswordInput";
import { useSettings } from "../../hooks/useSettings"; // <-- Importamos nuestro hook
import "./Shared.css";
import { useState } from "react";

export const Login = () => {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [showPassword, setShowPassword] = useState(false);
  const { data: settings } = useSettings(); 

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (sessionPending) {
    return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#6b7280" }}>Cargando...</div>);
  }

  if (session?.user) {
    const targetPath = ROLE_HOME_PATHS[session.user.role] || "/login";
    return <Navigate to={targetPath} replace />;
  }

  const onSubmit = async (data) => {
    await authClient.signIn.email({
      email: data.email,
      password: data.password,
      fetchOptions: {
        onSuccess: (ctx) => {
          const role = ctx.data?.user?.role;
          const targetPath = ROLE_HOME_PATHS[role];
          if (targetPath) {
            navigate(targetPath, { replace: true });
          } else {
            setError("root", { message: "Error de configuracion de rol." });
          }
        },
        onError: (ctx) => {
          setError("root", { message: ctx.error?.message || "Error de credenciales o conexion." });
        },
      },
    });
  };

  return (
    <div className="landing-container">
      <div className="landing-card" style={{ maxWidth: "450px", width: "90%", padding: "3rem", gap: "1.5rem", boxSizing: "border-box" }}>
        {settings?.logoUrl ? (
          <img 
            src={settings.logoUrl} 
            alt={`Logo ${settings?.clinicName || 'Clínica'}`} 
            className="landing-logo" 
            style={{ width: "160px", height: "auto", objectFit: "contain", margin: "0 auto" }} 
          />
        ) : (
          <div style={{ 
            width: "120px", height: "120px", backgroundColor: "#f3f4f6", 
            borderRadius: "1rem", display: "flex", justifyContent: "center", 
            alignItems: "center", fontSize: "3rem", color: "#0d9488", fontWeight: "bold",
            margin: "0 auto"
          }}>
            {settings?.clinicName?.charAt(0) || 'C'}
          </div>
        )}
        
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2 className="landing-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Bienvenido</h2>
          <p className="landing-description" style={{ fontSize: "1rem" }}>
            Ingresa tus credenciales para acceder a {settings?.clinicName ? <strong>{settings.clinicName}</strong> : 'la clínica'}.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          {/* Grupo de Correo */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              className="form-input" 
              placeholder="ej. doctor@ejemplo.com" 
              {...register("email")} 
            />
            {errors.email && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                className="form-input" 
                placeholder="........" 
                style={{ paddingRight: "4.5rem" }} 
                {...register("password")} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textDecoration: "underline"
                }}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {errors.password && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{errors.password.message}</span>}
          </div>
          {errors.root && (
            <div style={{ color: "#ef4444", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", marginBottom: "1rem" }}>
              {errors.root.message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting} 
            style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? "Validando..." : "Ingresar"}
          </button>
        </form>

        <Link to="/forgot-password" className="forgot-password" style={{ fontSize: "0.9rem", textAlign: "center" }}>
          Olvidé mi Contraseña
        </Link>
      </div>
    </div>
  );
};