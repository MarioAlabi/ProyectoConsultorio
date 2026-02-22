
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* El Navbar siempre estará arriba */}
      <Navbar />
      
      {/* Outlet es el hueco donde React va a meter tu CRUD o la vista del Médico */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};