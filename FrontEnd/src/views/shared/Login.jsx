import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoClinica from '../../assets/logo.png'; // Usando el nuevo nombre de tu logo
import './Landing.css'; // Reutilizamos el fondo y la tarjeta

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    
    // Aquí es donde en el futuro harás el fetch() a tu API en Node.js
    console.log('Intentando iniciar sesión con:', email);
    
    // Simulación: Redirigimos al usuario a la vista del médico temporalmente
    navigate('/doctor'); 
  };

  return (
    <div className="landing-container">
      {/* Sobrescribimos un poco la tarjeta para que sea más angosta y el contenido se apile */}
      <div className="landing-card" style={{ maxWidth: '450px', padding: '3rem', gap: '1.5rem' }}>
        
        <img 
          src={logoClinica} 
          alt="Logo Clínica Esperanza de Vida" 
          className="landing-logo" 
          style={{ width: '160px' }} // Ajustamos el tamaño solo para esta vista
        />
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2 className="landing-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Bienvenido
          </h2>
          <p className="landing-description" style={{ fontSize: '1rem' }}>
            Ingresa tus credenciales para acceder.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Usuario o Correo</label>
            <input 
              type="text" 
              id="email"
              className="form-input" 
              placeholder="ejemplo@clinica.com"
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

          <button type="submit" className="submit-btn">
            Ingresar
          </button>
        </form>

        <a href="#" className="forgot-password">
          ¿Olvidaste tu contraseña?
        </a>

      </div>
    </div>
  );
};