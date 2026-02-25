import { useState } from 'react';

export const DashboardAdmin = () => {
  const [mockUsers] = useState([
    { id: 1, nombre: 'Dr. Perez', rol: 'Medico', estado: 'Activo' },
    { id: 2, nombre: 'Ana (Recepcion)', rol: 'Asistente', estado: 'Activo' },
  ]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>Dashboard Administrativo</h1>
      <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
        Bienvenido al panel de control de la Clinica Esperanza de Vida.
      </p>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0d9488', marginBottom: '1rem' }}>Usuarios Activos</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Rol</th>
              <th style={{ padding: '1rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{user.nombre}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{user.rol}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>
                    {user.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
