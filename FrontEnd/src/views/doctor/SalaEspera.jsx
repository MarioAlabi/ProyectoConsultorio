import { useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css';

export const SalaEspera = () => {
  const navigate = useNavigate();
  // Mock de pacientes que vienen de recepción
  const pacientesEspera = [
    { id: 101, nombre: 'Ana Silvia López', edad: 28, motivo: 'Control prenatal', hora: '10:00 AM', esMenor: false },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Sala de Espera</h1>
         <button onClick={() => navigate('/doctor/pacientes')} className="submit-btn" style={{ backgroundColor: '#0ea5e9' }}>
          + Atención Directa (Sin Pre-clínica)
        </button>
      </div>
      
      <div className="card-container">
        {pacientesEspera.map(p => (
          <div key={p.id} className="paciente-espera-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>{p.nombre}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>{p.motivo} • <b>{p.hora}</b></p>
            </div>
            <button onClick={() => navigate(`/doctor/consulta/${p.id}`, { state: { paciente: p } })} className="submit-btn" style={{ width: 'auto' }}>
              Iniciar Consulta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};