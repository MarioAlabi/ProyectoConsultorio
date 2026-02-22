import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos las vistas y componentes
import { Landing } from './views/shared/Landing';
import { Login } from './views/shared/Login';
import { Layout } from './components/Layout';


// Vistas del Administrador
import { DashboardAdmin } from './views/admin/DashboardAdmin';
import { AdministrarUsuarios } from './views/admin/AdministrarUsuarios';

//vistas de recepcion
import { DashboardRecepcion } from './views/recepcion/DashboardRecepcion';
import { PacientesRecepcion } from './views/recepcion/PacientesRecepcion';
import { Preclinica } from './views/recepcion/Preclinica';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS (No tienen el Navbar) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* RUTAS PRIVADAS (Envueltas en el Layout para que tengan Navbar) */}
        <Route element={<Layout />}>
          
          {/* Dashboard principal del Administrador */}
          <Route path="/admin" element={<DashboardAdmin />} />
          
          {/* CRUD de Usuarios */}
          <Route path="/admin/usuarios" element={<AdministrarUsuarios />} />
          
          {/* Vistas de Recepción */}
          <Route path="/recepcion" element={<DashboardRecepcion />} />
          <Route path="/recepcion/pacientes" element={<PacientesRecepcion />} />
          <Route path="/recepcion/preclinica" element={<Preclinica />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;