import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoClinica from '../../assets/logo.png';
import { api } from '../../Enviroments/enviroment.js';
import './Shared.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // Bloquea la recarga del navegador inmediatamente
    e.stopPropagation();
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/con/auth/login', {
        correo: email,
        contrasena: password
      });

      const data = response.data;

      if (data.success) {
        localStorage.setItem('userRole', data.user.rol);
        localStorage.setItem('userName', data.user.nombre || data.user.name || "Usuario");
        const rolePaths = {
            admin: '/admin',
            medico: '/doctor',
            asistente: '/recepcion' 
        };

        const targetPath = rolePaths[data.user.rol];

        if (targetPath) {
            console.log(`Rol "${data.user.rol}" reconocido. Redirigiendo a ${targetPath}`);
            navigate(targetPath);
        } else {
            console.error("Error: El rol recibido no coincide con ninguna ruta conocida.", data.user.rol);
            setErrorMsg("Error de configuración de rol.");
        }
    }
    } catch (error) {
    
      const msg = error.response?.data?.message || 'Error de credenciales o conexión';
      setErrorMsg(msg);
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
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
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
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
            <input 
              type="password" 
              id="password"
              className="form-input" 
              placeholder="••••••••"
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
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>

        <p className="forgot-password" style={{ fontSize: '0.8rem', textAlign: 'center', color: '#666' }}>
          Si olvidó su contraseña, contacte al administrador.
        </p>
      </div>
    </div>
  );
};
