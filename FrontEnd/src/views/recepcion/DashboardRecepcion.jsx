import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../Enviroment/enviroment.js';

export const DashboardRecepcion = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, nuevosHoy: 0 });
  const [ultimosPacientes, setUltimosPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      try {
        const response = await api.get('/patients');
        if (response.data.success) {
          const lista = response.data.data;
          
          // Lógica para estadísticas simples
          const hoy = new Date().toISOString().split('T')[0];
          const creadosHoy = lista.filter(p => p.createdAt?.startsWith(hoy)).length;

          setStats({
            total: lista.length,
            nuevosHoy: creadosHoy
          });
          
          // Tomar los últimos 5 registrados
          setUltimosPacientes(lista.slice(0, 5));
        }
      } catch (error) {
        console.error("Error al cargar dashboard de recepción:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosDashboard();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ color: '#1f2937', fontSize: '2rem', margin: 0 }}>Recepción y Admisión</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Bienvenida al panel de control de la Clínica Esperanza de Vida.
        </p>
      </header>

      {/* Tarjetas de Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Pacientes Totales</h3>
          <p style={cardValueStyle}>{stats.total}</p>
          <span style={{ fontSize: '0.85rem', color: '#10b981' }}>Registrados en el sistema</span>
        </div>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Nuevos Hoy</h3>
          <p style={cardValueStyle}>{stats.nuevosHoy}</p>
          <span style={{ fontSize: '0.85rem', color: '#0ea5e9' }}>Ingresos del día</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
          <h3 style={cardTitleStyle}>Pendientes Pre-clínica</h3>
          <p style={cardValueStyle}>--</p>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Pendiente de triaje</span>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Acciones Rápidas</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/reception/patients')} style={actionButtonStyle}>
            📂 Gestionar Expedientes
          </button>
          <button onClick={() => navigate('/reception/patients')} style={{ ...actionButtonStyle, backgroundColor: '#0ea5e9' }}>
            🩺 Ir a Pre-clínica
          </button>
        </div>
      </div>

      {/* Últimos Pacientes */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#0d9488', marginBottom: '1.2rem' }}>Últimos Pacientes Registrados</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem' }}>Paciente</th>
                <th style={{ padding: '1rem' }}>Expediente</th>
                <th style={{ padding: '1rem' }}>Tipo</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPacientes.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{p.fullName}</td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>{p.fileNumber}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '1rem',
                      backgroundColor: p.isMinor ? '#fef3c7' : '#dcfce7',
                      color: p.isMinor ? '#92400e' : '#166534'
                    }}>
                      {p.isMinor ? 'Menor' : 'Adulto'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => navigate('/reception/preclinica', { state: { paciente: p } })}
                      style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Tomar Signos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ultimosPacientes.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No hay pacientes registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Estilos en objetos
const cardStyle = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '1rem',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  borderLeft: '4px solid #0d9488'
};

const cardTitleStyle = {
  color: '#6b7280',
  fontSize: '0.9rem',
  margin: '0 0 0.5rem 0',
  fontWeight: '500'
};

const cardValueStyle = {
  fontSize: '2.2rem',
  fontWeight: '800',
  margin: 0,
  color: '#111827'
};

const actionButtonStyle = {
  backgroundColor: '#0d9488',
  color: 'white',
  border: 'none',
  padding: '1rem 1.5rem',
  borderRadius: '0.8rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};