import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoClinica from '../../assets/logo.png';
import './Shared.css';

// 1. Nuestra "Base de Datos" simulada para el prototipo
const mockUsers = [
  { username: 'admin', password: '123', role: 'admin', path: '/admin', name: 'Administrador' },
  { username: 'doctor', password: '123', role: 'medico', path: '/doctor', name: 'Dr. Pérez' },
  { username: 'asistente', password: '123', role: 'recepcion', path: '/recepcion', name: 'Ana (Recepción)' }
];

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); // Estado para mostrar mensajes de error
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); 
    setErrorMsg(''); // Limpiamos errores previos al intentar de nuevo

    // 2. Validación de campos vacíos
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    // 3. Simulación de autenticación (Buscamos coincidencias)
    const userFound = mockUsers.find(
      (u) => u.username === email.toLowerCase() && u.password === password
    );

    if (userFound) {
      // 4. Si el usuario existe, guardamos su sesión simulada en el navegador
      localStorage.setItem('userRole', userFound.role);
      localStorage.setItem('userName', userFound.name);
      
      console.log(`Bienvenido ${userFound.name}, redirigiendo a ${userFound.path}...`);
      
      // 5. Redirigimos a la vista que le corresponde a su rol
      navigate(userFound.path);
    } else {
      // Si no coincide, mostramos error
      setErrorMsg('Credenciales incorrectas. Verifica tu usuario o contraseña.');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-card" style={{ maxWidth: '450px', padding: '3rem', gap: '1.5rem' }}>
        
        <img 
          src={logoClinica} 
          alt="Logo Clínica Esperanza de Vida" 
          className="landing-logo" 
          style={{ width: '160px' }} 
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
            <label className="form-label" htmlFor="email">Usuario</label>
            <input 
              type="text" 
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

          {/* Bloque condicional: Solo se renderiza si hay un mensaje de error */}
          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" className="submit-btn">
            Ingresar
          </button>
        </form>

        {/* Solo para que recuerdes las credenciales de prueba mientras desarrollas */}
        <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', marginTop: '-10px' }}>
          Prueba con: <strong>admin</strong>, <strong>doctor</strong> o <strong>asistente</strong> (Clave: 123)
        </div>

        <a href="#" className="forgot-password">
          ¿Olvidaste tu contraseña?
        </a>

      </div>
    </div>
  );
};