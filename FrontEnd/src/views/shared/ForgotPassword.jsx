import { useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import logoClinica from '../../assets/logo.png';
import './Shared.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electronico.');
      return;
    }

    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message || 'Error al enviar el correo.');
        return;
      }

      setSent(true);
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
            Recuperar Contraseña
          </h2>
          <p className="landing-description" style={{ fontSize: '1rem' }}>
            {sent
              ? 'Revisa tu bandeja de entrada. Si el correo existe, recibiras un enlace para restablecer tu Contraseña.'
              : 'Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu Contraseña.'}
          </p>
        </div>

        {!sent && (
          <form className="login-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
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
              {isPending ? 'Enviando...' : 'Enviar enlace'}
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
