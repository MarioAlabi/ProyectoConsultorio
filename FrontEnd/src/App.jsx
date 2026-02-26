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
import { PacientesRecepcion } from './views/recepcion/PacientesRecepcion';
import { ChangePassword } from './views/shared/ChangePassword';
import { Preclinica } from './views/recepcion/Preclinica';
import { SalaEspera } from './views/doctor/SalaEspera.jsx';
//import { PacientesDoctor } from './views/doctor/PacientesDoctor';
import { ConsultaMedica } from './views/doctor/ConsultaMedica';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/admin/usuarios" element={<AdministrarUsuarios />} />
            <Route path="/admin/changePassword" element={<ChangePassword />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ASSISTANT]} />}>
          <Route element={<Layout />}>
            <Route path="/reception" element={<DashboardRecepcion />} />
            <Route path="/reception/pacientes" element={<PacientesRecepcion />} />
            <Route path="/reception/preclinica" element={<Preclinica />} />
            <Route path="/reception/changePassword" element={<ChangePassword />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
          <Route element={<Layout />}>
            <Route path="/doctor" element={<SalaEspera />} />
            {/* <Route path="/doctor/pacientes" element={<PacientesDoctor />} />
            <Route path="/doctor/consulta/:id" element={<ConsultaMedica />} />*/}
            <Route path="/doctor/changePassword" element={<ChangePassword />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
