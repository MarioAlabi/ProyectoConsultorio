import { useNavigate, Navigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "../../lib/auth-client";
import { ROLE_HOME_PATHS } from "../../lib/constants/roles";
import { loginSchema } from "../../lib/validations/userSchema";
import { useSettings } from "../../hooks/useSettings";
import "./Login.css";
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
    return (
      <div className="auth-screen">
        <div className="auth-loading">Cargando…</div>
      </div>
    );
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
            setError("root", { message: "Error de configuración de rol." });
          }
        },
        onError: (ctx) => {
          setError("root", { message: ctx.error?.message || "Credenciales incorrectas o error de conexión." });
        },
      },
    });
  };

  const clinicName = settings?.clinicName || "Esperanza";

  return (
    <div className="auth-screen">
      <div className="auth-screen__ornament auth-screen__ornament--1" aria-hidden="true" />
      <div className="auth-screen__ornament auth-screen__ornament--2" aria-hidden="true" />

      <div className="auth-layout">
        {/* Panel editorial izquierdo */}
        <aside className="auth-aside">
          <div className="auth-aside__top">
            <div className="auth-aside__brand">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="auth-aside__logo" />
              ) : (
                <span className="auth-aside__logo-fallback">{clinicName.charAt(0)}</span>
              )}
              <span className="auth-aside__clinic">{clinicName}</span>
            </div>
            <span className="auth-aside__eyebrow">Sistema clínico</span>
          </div>

          <div className="auth-aside__body">
            <h1 className="auth-aside__headline">
              Cuidado clínico, <span className="auth-aside__headline-accent">con precisión.</span>
            </h1>
            <p className="auth-aside__copy">
              Expedientes, agenda y documentación clínica en una sola plataforma diseñada para acompañar la consulta del día a día.
            </p>
          </div>

          <ul className="auth-aside__features">
            <li>
              <i className="ri-pulse-line" aria-hidden="true"></i>
              <span>Sala de espera y signos vitales en tiempo real</span>
            </li>
            <li>
              <i className="ri-file-text-line" aria-hidden="true"></i>
              <span>Recetas, constancias e incapacidades con IA</span>
            </li>
            <li>
              <i className="ri-shield-check-line" aria-hidden="true"></i>
              <span>Trazabilidad total de cambios y respaldos</span>
            </li>
          </ul>

          <footer className="auth-aside__footer">
            <span>© {new Date().getFullYear()} {clinicName}</span>
            <span>v1.0</span>
          </footer>
        </aside>

        {/* Formulario derecho */}
        <section className="auth-panel">
          <div className="auth-panel__inner">
            <header className="auth-panel__header">
              <span className="eyebrow">Acceso seguro</span>
              <h2 className="auth-panel__title">Bienvenido de vuelta</h2>
              <p className="auth-panel__sub">
                Ingresa tus credenciales para entrar a <strong>{clinicName}</strong>.
              </p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Correo electrónico</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="doctor@ejemplo.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <Link to="/forgot-password" className="label-link">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="password-toggle"
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>

              {errors.root && (
                <div className="form-banner form-banner--error" role="alert">
                  <i className="ri-error-warning-line" aria-hidden="true"></i>
                  <span>{errors.root.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                {isSubmitting ? "Validando…" : "Iniciar sesión"}
                {!isSubmitting && <i className="ri-arrow-right-line" aria-hidden="true"></i>}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
