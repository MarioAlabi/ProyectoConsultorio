import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos las vistas compartidas
import { Landing } from './views/shared/Landing';
import { Login } from './views/shared/Login';
import { Layout } from './components/Layout';

// Vistas del Administrador
import { DashboardAdmin } from './views/admin/DashboardAdmin';
import { AdministrarUsuarios } from './views/admin/AdministrarUsuarios';

// Vistas de Recepción
import { DashboardRecepcion } from './views/recepcion/DashboardRecepcion';
import { PacientesRecepcion } from './views/recepcion/PacientesRecepcion';
import { Preclinica } from './views/recepcion/Preclinica';

// Vistas del Médico
import { SalaEspera } from './views/doctor/SalaEspera.jsx';
import { PacientesDoctor } from './views/doctor/PacientesDoctor';
import { ConsultaMedica } from './views/doctor/ConsultaMedica';

/**
 * Componente Principal App
 * Maneja el enrutamiento global de la aplicación del consultorio.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        {/* Landing page informativa */}
        <Route path="/" element={<Landing />} />
        
        {/* Login de acceso para personal */}
        <Route path="/login" element={<Login />} />

        {/* --- RUTAS PRIVADAS (Requieren Layout con Navbar y Outlet) --- */}
        <Route element={<Layout />}>
          
          {/* SECCIÓN: ADMINISTRADOR */}
          {/* Ruta base: /admin */}
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/admin/usuarios" element={<AdministrarUsuarios />} />
          
          {/* SECCIÓN: RECEPCIÓN / ASISTENTE */}
          {/* Ruta base: /recepcion */}
          <Route path="/recepcion" element={<DashboardRecepcion />} />
          <Route path="/recepcion/pacientes" element={<PacientesRecepcion />} />
          <Route path="/recepcion/preclinica" element={<Preclinica />} />

          {/* SECCIÓN: MÉDICO */}
          {/* Ruta base: /doctor */}
          <Route path="/doctor" element={<SalaEspera />} />
          <Route path="/doctor/pacientes" element={<PacientesDoctor />} />
          <Route path="/doctor/consulta/:id" element={<ConsultaMedica />} />

        </Route>

        {/* --- RUTA 404 / REDIRECCIÓN --- */}
        {/* Si el usuario escribe cualquier otra cosa, lo mandamos al login o landing */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;