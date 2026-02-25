import { useState, useTransition } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import logoClinica from '../../assets/logo.png';
import './Shared.css';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="landing-container">
        <div className="landing-card" style={{
          maxWidth: '450px',
          width: '90%',
          padding: '3rem',
          gap: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: '160px', height: 'auto' }} />
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 className="landing-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              Enlace invalido
            </h2>
            <p className="landing-description" style={{ fontSize: '1rem' }}>
              El enlace para restablecer la Contraseña es invalido o ha expirado.
            </p>
          </div>
          <Link to="/forgot-password" className="forgot-password" style={{ fontSize: '0.9rem' }}>
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('La Contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las Contraseñas no coinciden.');
      return;
    }

    startTransition(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setErrorMsg(error.message || 'Error al restablecer la Contraseña.');
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
        <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: '160px', height: 'auto' }} />

        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2 className="landing-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {success ? 'Contraseña actualizada' : 'Nueva Contraseña'}
          </h2>
          <p className="landing-description" style={{ fontSize: '1rem' }}>
            {success
              ? 'Tu Contraseña ha sido restablecida. Seras redirigido al inicio de sesion...'
              : 'Ingresa tu nueva Contraseña.'}
          </p>
        </div>

        {!success && (
          <form className="login-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Nueva Contraseña</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
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
              disabled={isPending}
              style={{ opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Guardando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        <Link to="/login" className="forgot-password" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
          Volver al inicio de sesion
        </Link>
      </div>
    </div>
  );
};
