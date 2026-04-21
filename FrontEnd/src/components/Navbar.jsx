import { Link, useLocation } from 'react-router-dom';
import { LogoutButton } from './LogoutButton';
import { authClient } from '../lib/auth-client';
import { ROLES } from '../lib/constants/roles';
import logoClinica from '../assets/logo.png';
import './Navbar.css';

const MENU_CONFIG = {
  [ROLES.DOCTOR]: [
    { label: 'Lista de Espera', path: '/doctor' },
    { label: 'Agenda', path: '/doctor/agenda' },
    { label: 'Listado de Pacientes', path: '/doctor/pacientes' },
    { label: 'Aseguradoras', path: '/doctor/aseguradoras' },
    { label: 'Reporte Aseguradoras', path: '/doctor/reportes/aseguradoras' },
    { label: 'Cambiar contrasena', path: '/doctor/changePassword' },
  ],
  [ROLES.ASSISTANT]: [
    { label: 'Dashboard', path: '/reception' },
    { label: 'Agenda', path: '/reception/agenda' },
    { label: 'Pacientes', path: '/reception/pacientes' },
    { label: 'Pre-clinica', path: '/reception/preclinica' },
    { label: 'Cambiar contrasena', path: '/reception/changePassword' }
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Administrar Usuarios', path: '/admin/usuarios' },
    { label: 'Auditoria', path: '/admin/auditoria' },
    { label: 'Cambiar contrasena', path: '/admin/changePassword'},
  ],
};

export const Navbar = () => {
  const location = useLocation();
  const { data: session } = authClient.useSession();

  const role = session?.user?.role ?? '';
  const userName = session?.user?.name ?? 'Usuario';
  const currentLinks = MENU_CONFIG[role] ?? [];

  return (
    <nav className="navbar-container">
      <div className="navbar-brand">
        <img src={logoClinica} alt="Clinica Esperanza de Vida" className="navbar-logo" />
      </div>

      <ul className="navbar-links">
        {currentLinks.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
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
