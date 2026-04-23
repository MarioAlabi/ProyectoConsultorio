import { NavLink, useLocation } from 'react-router-dom';
import { LogoutButton } from './LogoutButton';
import { authClient } from '../lib/auth-client';
import { ROLES } from '../lib/constants/roles';
import { useSettings } from '../hooks/useSettings';

import './Navbar.css';

/* Labels humanos de rol para el sidebar */
const ROLE_LABEL = {
  [ROLES.ADMIN]: 'Administración',
  [ROLES.DOCTOR]: 'Cuerpo médico',
  [ROLES.ASSISTANT]: 'Recepción',
};

/* Configuración de menú agrupable por sección */
const MENU_CONFIG = {
  [ROLES.DOCTOR]: [
    { label: 'Lista de espera',  path: '/doctor',                       icon: 'ri-pulse-line' },
    { label: 'Agenda',           path: '/doctor/agenda',                icon: 'ri-calendar-2-line' },
    { label: 'Pacientes',        path: '/doctor/pacientes',             icon: 'ri-file-list-3-line' },
    { label: 'Aseguradoras',     path: '/doctor/aseguradoras',          icon: 'ri-building-line' },
    { label: 'Reporte aseguradoras', path: '/doctor/reportes/aseguradoras', icon: 'ri-line-chart-line' },
    { label: 'Analítica diagnósticos', path: '/doctor/reportes/diagnosticos', icon: 'ri-bar-chart-2-line' },
    { label: 'Plantillas',       path: '/doctor/plantillas',            icon: 'ri-file-text-line' },
    { label: 'Contraseña',       path: '/doctor/changePassword',        icon: 'ri-lock-line' },
  ],
  [ROLES.ASSISTANT]: [
    { label: 'Dashboard',        path: '/reception',                    icon: 'ri-dashboard-3-line' },
    { label: 'Agenda',           path: '/reception/agenda',             icon: 'ri-calendar-2-line' },
    { label: 'Pacientes',        path: '/reception/pacientes',          icon: 'ri-file-list-3-line' },
    { label: 'Pre-clínica',      path: '/reception/preclinica',         icon: 'ri-heart-pulse-line' },
    { label: 'Contraseña',       path: '/reception/changePassword',     icon: 'ri-lock-line' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard',        path: '/admin',                        icon: 'ri-dashboard-3-line' },
    { label: 'Usuarios',         path: '/admin/usuarios',               icon: 'ri-group-line' },
    { label: 'Configuración',    path: '/admin/configuracion',          icon: 'ri-settings-3-line' },
    { label: 'Plantillas',       path: '/admin/plantillas',             icon: 'ri-file-text-line' },
    { label: 'Auditoría',        path: '/admin/auditoria',              icon: 'ri-shield-check-line' },
    { label: 'Mantenimiento',    path: '/admin/mantenimiento',          icon: 'ri-server-line' },
    { label: 'Contraseña',       path: '/admin/changePassword',         icon: 'ri-lock-line' },
  ],
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Navbar = () => {
  const location = useLocation();
  const { data: session } = authClient.useSession();
  const { data: settings } = useSettings();

  const role = session?.user?.role ?? '';
  const userName = session?.user?.name ?? 'Usuario';
  const currentLinks = MENU_CONFIG[role] ?? [];

  // Heurística para saber si un link está activo (maneja nested paths)
  const isActive = (path) => {
    if (path === '/admin' || path === '/doctor' || path === '/reception') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark" aria-hidden="true">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" />
          ) : (
            <span>{(settings?.clinicName || 'Esperanza').charAt(0)}</span>
          )}
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">
            {settings?.clinicName || 'Esperanza'}
          </span>
          <span className="sidebar__brand-tag">Consultorio</span>
        </div>
      </div>

      <span className="sidebar__eyebrow">{ROLE_LABEL[role] || 'Menú'}</span>

      <ul className="sidebar__nav">
        {currentLinks.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              className={`sidebar__link ${isActive(link.path) ? 'is-active' : ''}`}
            >
              <i className={link.icon} aria-hidden="true"></i>
              <span>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar" aria-hidden="true">
            {getInitials(userName)}
          </div>
          <div className="sidebar__user-meta">
            <span className="sidebar__user-name">{userName}</span>
            <span className="sidebar__user-role">{ROLE_LABEL[role] || 'Usuario'}</span>
          </div>
        </div>
        <LogoutButton className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} />
      </div>
    </aside>
  );
};
