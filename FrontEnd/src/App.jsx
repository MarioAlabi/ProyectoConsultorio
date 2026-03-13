import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from './lib/constants/roles';
import { Landing } from './views/shared/Landing';
import { Login } from './views/shared/Login';
import { ForgotPassword } from './views/shared/ForgotPassword';
import { ResetPassword } from './views/shared/ResetPassword';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardAdmin } from './views/admin/DashboardAdmin';
import { AdministrarUsuarios } from './views/admin/AdministrarUsuarios';
import { DashboardRecepcion } from './views/recepcion/DashboardRecepcion';
import { PatientsShared } from './views/shared/PatientsShared.jsx';
import { ChangePassword } from './views/shared/ChangePassword';
import { PreclinicaShared } from './views/shared/PreClinicaShared.jsx';
import { SalaEspera } from './views/doctor/SalaEspera.jsx';
import { ConsultaMedica } from './views/doctor/ConsultaMedica';

// 1. IMPORTA LAS VISTAS NUEVAS AQUÍ
import { AgendaCitas } from './views/shared/AgendaCitas'; 
// import { AseguradorasShared } from './views/shared/AseguradorasShared'; (Cuando la crees)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* --- RUTAS ADMINISTRADOR --- */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/admin/usuarios" element={<AdministrarUsuarios />} />
            <Route path="/admin/changePassword" element={<ChangePassword />} />
            {/* Aquí puedes agregar Auditoría o Configuración luego */}
          </Route>
        </Route>

        {/* --- RUTAS RECEPCIÓN --- */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ASSISTANT]} />}>
          <Route element={<Layout />}>
            <Route path="/reception" element={<DashboardRecepcion />} />
            <Route path="/reception/pacientes" element={<PatientsShared />} />
            <Route path="/reception/preclinica" element={<PreclinicaShared />} />
            <Route path="/reception/changePassword" element={<ChangePassword />} />
            
            {/* 2. NUEVA RUTA DE AGENDA PARA RECEPCIÓN */}
            <Route path="/reception/agenda" element={<AgendaCitas />} />
          </Route>
        </Route>

        {/* --- RUTAS DOCTOR --- */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
          <Route element={<Layout />}>
            <Route path="/doctor" element={<SalaEspera />} />
            <Route path="/doctor/pacientes" element={<PatientsShared />} />
            <Route path="/doctor/preclinica" element={<PreclinicaShared />} />
            <Route path="/doctor/consulta/:id" element={<ConsultaMedica />} />
            <Route path="/doctor/changePassword" element={<ChangePassword />} />

            {/* 3. NUEVA RUTA DE AGENDA PARA DOCTOR */}
            <Route path="/doctor/agenda" element={<AgendaCitas />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;