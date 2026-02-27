import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { ROLE_HOME_PATHS } from '../../lib/constants/roles';
import { PasswordInput } from '../../components/PasswordInput';
import logoClinica from '../../assets/logo.png';
import './Shared.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6b7280' }}>
        Cargando...
      </div>
    );
  }

  if (session?.user) {
    const targetPath = ROLE_HOME_PATHS[session.user.role] || '/login';
    return <Navigate to={targetPath} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingresa tu correo y Contraseña.');
      return;
    }

    setIsLoading(true);
    await authClient.signIn.email({
      email,
      password,
      fetchOptions: {
        onSuccess: (ctx) => {
          const role = ctx.data?.user?.role;
          const targetPath = ROLE_HOME_PATHS[role];

          if (targetPath) {
            navigate(targetPath, { replace: true });
          } else {
            setErrorMsg('Error de configuracion de rol.');
            setIsLoading(false);
          }
        },
        onError: (ctx) => {
          setErrorMsg(ctx.error?.message || 'Error de credenciales o conexion');
          setIsLoading(false);
        },
      },
    });
  };

  return (
    <div className="landing-container">
      <div className="landing-card" style={{
        maxWidth: '450px',
        width: '90%',
        padding: '3rem',
        gap: '1.5rem',
        boxSizing: 'border-box'
      }}>

        <img
          src={logoClinica}
          alt="Logo"
          className="landing-logo"
          style={{ width: '160px', height: 'auto' }}
        />

        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2 className="landing-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Bienvenido
          </h2>
          <p className="landing-description" style={{ fontSize: '1rem' }}>
            Ingresa tus credenciales para acceder.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin} style={{ width: '100%' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electronico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="ej. doctor@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>

        <Link to="/forgot-password" className="forgot-password" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
          Olvide mi Contraseña
        </Link>
      </div>
    </div>
  );
};
