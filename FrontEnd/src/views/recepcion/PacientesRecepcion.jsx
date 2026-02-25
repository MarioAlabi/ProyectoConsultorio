import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css'; 

const mockPacientes = [
  { id: 1, nombre: 'Carlos Ruiz', dui: '12345678-9', edad: 45, sexo: 'M', telefono: '7777-8888', correo: 'carlos@mail.com', esMenor: false },
  { id: 2, nombre: 'María López', dui: '98765432-1', edad: 32, sexo: 'F', telefono: '7777-9999', correo: '', esMenor: false },
];

export const PacientesRecepcion = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(mockPacientes);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del formulario unificado para Crear/Editar
  const estadoInicial = { 
    id: null, nombre: '', dui: '', edad: '', sexo: 'F', 
    telefono: '', correo: '', esMenor: false 
  };
  const [formData, setFormData] = useState(estadoInicial);

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.dui.includes(busqueda)
  );

  const handleAbrirModal = (paciente = null) => {
    if (paciente) {
      setFormData(paciente);
      setModoEdicion(true);
    } else {
      setFormData(estadoInicial);
      setModoEdicion(false);
    }
    setMostrarModal(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (modoEdicion) {
      setPacientes(pacientes.map(p => p.id === formData.id ? formData : p));
    } else {
      setPacientes([...pacientes, { ...formData, id: Date.now() }]);
    }
    setMostrarModal(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#1f2937', margin: 0 }}>Gestión de Pacientes</h1>
        <button onClick={() => handleAbrirModal()} className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
          + Nuevo Paciente
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" placeholder="Buscar por nombre o DUI..." className="form-input"
          style={{ width: '100%', maxWidth: '400px' }}
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr style={{ color: '#4b5563', fontSize: '0.9rem' }}>
              <th style={{ padding: '1.2rem 1.5rem' }}>Nombre</th>
              <th style={{ padding: '1.2rem 1.5rem' }}>DUI / Responsable</th>
              <th style={{ padding: '1.2rem 1.5rem' }}>Contacto</th>
              <th style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1.2rem 1.5rem' }}>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.edad} años {p.esMenor && '(Menor)'}</div>
                </td>
                <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{p.dui}</td>
                <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                  <div>{p.telefono || 'Sin tel.'}</div>
                  <div style={{ fontSize: '0.8rem' }}>{p.correo}</div>
                </td>
                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => handleAbrirModal(p)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', marginRight: '1rem', fontWeight: '600' }}>
                    Editar
                  </button>
                  <button onClick={() => navigate('/reception/preclinica', { state: { pacienteSeleccionado: p } })} style={{ color: 'white', backgroundColor: '#0ea5e9', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                    Pre-clínica
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE REGISTRO / EDICIÓN */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, color: '#0d9488' }}>{modoEdicion ? 'Modificar Paciente' : 'Registrar Nuevo Paciente'}</h2>
            <form onSubmit={handleGuardar} className="login-form">
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', backgroundColor: '#f0fdfa', padding: '10px', borderRadius: '8px' }}>
                <input 
                  type="checkbox" id="esMenor" checked={formData.esMenor} 
                  onChange={e => setFormData({...formData, esMenor: e.target.checked})} 
                />
                <label htmlFor="esMenor" style={{ fontWeight: '500', color: '#0f766e', cursor: 'pointer' }}>Es menor de edad</label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input type="text" className="form-input" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{formData.esMenor ? 'DUI del Apoderado' : 'DUI del Paciente'}</label>
                  <input type="text" className="form-input" required value={formData.dui} onChange={e => setFormData({...formData, dui: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <input type="number" className="form-input" required value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono (Opcional)</label>
                  <input type="text" className="form-input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Correo Electrónico (Opcional)</label>
                <input type="email" className="form-input" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setMostrarModal(false)} className="form-input" style={{ flex: 1, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0 }}>
                  {modoEdicion ? 'Actualizar' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};