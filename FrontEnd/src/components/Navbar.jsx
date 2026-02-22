import { Link, useLocation } from 'react-router-dom';
import { LogoutButton } from './LogoutButton';
import logoClinica from '../assets/logo.png';
import './Navbar.css';

export const Navbar = () => {
  const location = useLocation();
  
  // Leemos el usuario activo desde el LocalStorage
  const userRole = localStorage.getItem('userRole') || 'recepcion'; 
  const userName = localStorage.getItem('userName') || 'Usuario';

  // Configuración de rutas basadas en tu diseño y CA
  const menuConfig = {
    medico: [
      { titulo: 'Lista de Espera', ruta: '/doctor' },
      { titulo: 'Listado de Pacientes', ruta: '/doctor/pacientes' }
    ],
recepcion: [
      { titulo: 'Dashboard', ruta: '/recepcion' },
      { titulo: 'Pacientes', ruta: '/recepcion/pacientes' },
      { titulo: 'Pre-clínica', ruta: '/recepcion/preclinica' }
    ],
    admin: [
      { titulo: 'Dashboard', ruta: '/admin' },
      { titulo: 'Administrar Usuarios', ruta: '/admin/usuarios' } // <-- ¡Corregido aquí!
    ]
  };

  const currentLinks = menuConfig[userRole] || [];

  return (
    <nav className="navbar-container">
      <div className="navbar-brand">
        <img src={logoClinica} alt="Clínica Esperanza de Vida" className="navbar-logo" />
      </div>

      <ul className="navbar-links">
        {currentLinks.map((link) => (
          <li key={link.ruta}>
            <Link 
              to={link.ruta} 
              className={`nav-item ${location.pathname === link.ruta ? 'active' : ''}`}
            >
              {link.titulo}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-user">
        <span className="user-greeting">Hola, {userName}</span>
        <LogoutButton className="navbar-logout" />
      </div>
    </nav>
  );
};