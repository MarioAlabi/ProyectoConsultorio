import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css';

// Mock de datos iniciales
const mockPacientes = [
  { id: 1, nombre: 'Carlos Ruiz', dui: '12345678-9', edad: 45, sexo: 'M', telefono: '7777-8888' },
  { id: 2, nombre: 'María López', dui: '98765432-1', edad: 32, sexo: 'F', telefono: '7777-9999' },
  { id: 3, nombre: 'Josefa Martínez', dui: '45612378-0', edad: 68, sexo: 'F', telefono: '6666-5555' },
];

export const PacientesRecepcion = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(mockPacientes);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoPaciente, setNuevoPaciente] = useState({ nombre: '', dui: '', edad: '', sexo: 'F', telefono: '' });

  // Filtro en tiempo real (HU-01 y HU-19)
  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.dui.includes(busqueda)
  );

  const handleGuardarPaciente = (e) => {
    e.preventDefault();
    const id = Date.now();
    setPacientes([...pacientes, { ...nuevoPaciente, id }]);
    setMostrarModal(false);
    setNuevoPaciente({ nombre: '', dui: '', edad: '', sexo: 'F', telefono: '' });
  };

  const irAPreclinica = (paciente) => {
    // Navegamos a preclínica pasando los datos del paciente en el "state"
    navigate('/recepcion/preclinica', { state: { pacienteSeleccionado: paciente } });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#1f2937', margin: 0 }}>Gestión de Pacientes</h1>
        <button onClick={() => setMostrarModal(true)} className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
          + Nuevo Paciente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Buscar por nombre o DUI..." 
          className="form-input"
          style={{ width: '100%', maxWidth: '400px' }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de Pacientes */}
      <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr style={{ color: '#4b5563', fontSize: '0.9rem' }}>
              <th style={{ padding: '1.2rem 1.5rem' }}>Nombre</th>
              <th style={{ padding: '1.2rem 1.5rem' }}>DUI</th>
              <th style={{ padding: '1.2rem 1.5rem' }}>Edad</th>
              <th style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1.2rem 1.5rem', fontWeight: '500', color: '#1f2937' }}>{p.nombre}</td>
                <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{p.dui}</td>
                <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{p.edad} años</td>
                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => irAPreclinica(p)} style={{ color: 'white', backgroundColor: '#0ea5e9', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                    Pasar a Pre-clínica
                  </button>
                </td>
              </tr>
            ))}
            {pacientesFiltrados.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron pacientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE REGISTRO */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0, color: '#0d9488' }}>Registrar Paciente</h2>
            <form onSubmit={handleGuardarPaciente} className="login-form">
              <input type="text" placeholder="Nombre Completo" className="form-input" required value={nuevoPaciente.nombre} onChange={e => setNuevoPaciente({...nuevoPaciente, nombre: e.target.value})} />
              <input type="text" placeholder="DUI (Ej. 12345678-9)" className="form-input" required value={nuevoPaciente.dui} onChange={e => setNuevoPaciente({...nuevoPaciente, dui: e.target.value})} />
              <input type="number" placeholder="Edad" className="form-input" required value={nuevoPaciente.edad} onChange={e => setNuevoPaciente({...nuevoPaciente, edad: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setMostrarModal(false)} className="form-input" style={{ flex: 1, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};