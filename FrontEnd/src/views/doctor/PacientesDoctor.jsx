import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css';

export const PacientesDoctor = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  
  // Mock de pacientes
  const [pacientes] = useState([
    { id: 1, nombre: 'Carlos Ruiz', dui: '12345678-9', edad: 45, esMenor: false },
    { id: 4, nombre: 'Luisito Comunicas', dui: '00000000-0', edad: 8, esMenor: true },
  ]);

  const filtrar = pacientes.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Buscar o Registrar Paciente</h1>
        <button className="submit-btn" style={{ width: 'auto' }}>+ Nuevo Registro</button>
      </div>

      <input 
        type="text" className="form-input" placeholder="Buscar por nombre..." 
        value={busqueda} onChange={e => setBusqueda(e.target.value)} 
      />

      <div style={{ marginTop: '2rem', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f1f5f9' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>DUI</th>
              <th style={{ padding: '1rem' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtrar.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>{p.nombre} {p.esMenor && '(Menor)'}</td>
                <td style={{ padding: '1rem' }}>{p.dui}</td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => navigate(`/doctor/consulta/${p.id}`, { state: { paciente: p } })}
                    className="submit-btn" style={{ padding: '5px 15px', fontSize: '0.8rem' }}
                  >
                    Atención Directa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};