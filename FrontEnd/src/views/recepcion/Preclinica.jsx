import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css';

// Usamos el mismo mock para simular la base de datos
const mockDB = [
  { id: 1, nombre: 'Carlos Ruiz', dui: '12345678-9', edad: 45, sexo: 'M' },
  { id: 2, nombre: 'María López', dui: '98765432-1', edad: 32, sexo: 'F' },
  { id: 3, nombre: 'Josefa Martínez', dui: '45612378-0', edad: 68, sexo: 'F' },
];

export const Preclinica = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Si venimos del botón "Pasar a Pre-clínica", recuperamos el paciente
  const pacienteInicial = location.state?.pacienteSeleccionado || null;
  
  const [paciente, setPaciente] = useState(pacienteInicial);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({ motivo: '', presion: '', temperatura: '', peso: '', altura: '' });

  // ESTADO DERIVADO: Reemplaza al useEffect. React lo calcula al vuelo si la búsqueda cambia.
  const resultadosBusqueda = busqueda.length > 2 
    ? mockDB.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase())) 
    : [];

  const handleSeleccionarPaciente = (p) => {
    setPaciente(p);
    setBusqueda(''); // Esto limpia la barra y oculta los resultados automáticamente
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Guardando Pre-clínica de', paciente.nombre, formulario);
    alert('Pre-clínica guardada correctamente. El paciente ya está en lista de espera médica.');
    navigate('/recepcion'); // Regresa al dashboard de recepción
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>Registro de Pre-clínica</h1>

      {/* Buscador: Solo se muestra si NO hay un paciente seleccionado */}
      {!paciente ? (
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <label className="form-label">Buscar Paciente para iniciar pre-clínica:</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Escribe el nombre del paciente..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {resultadosBusqueda.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {resultadosBusqueda.map(res => (
                <div 
                  key={res.id} 
                  onClick={() => handleSeleccionarPaciente(res)}
                  style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                >
                  <strong>{res.nombre}</strong> - DUI: {res.dui}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tarjeta de Información del Paciente */
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Paciente Seleccionado: {paciente.nombre}</h3>
            <p style={{ margin: 0, color: '#15803d', fontSize: '0.95rem' }}>
              <strong>Edad:</strong> {paciente.edad} años | <strong>Sexo:</strong> {paciente.sexo} | <strong>DUI:</strong> {paciente.dui}
            </p>
          </div>
          <button onClick={() => setPaciente(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
            Cambiar Paciente
          </button>
        </div>
      )}

      {/* Formulario de Signos Vitales y Motivo */}
      {paciente && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Motivo de la Consulta</label>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Ej. Dolor de cabeza intenso desde hace 2 días..."
                required
                value={formulario.motivo}
                onChange={e => setFormulario({...formulario, motivo: e.target.value})}
              ></textarea>
            </div>

            <h4 style={{ color: '#0d9488', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Signos Vitales</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Presión Arterial</label>
                <input type="text" className="form-input" placeholder="Ej. 120/80" required value={formulario.presion} onChange={e => setFormulario({...formulario, presion: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Temperatura (°C)</label>
                <input type="number" step="0.1" className="form-input" placeholder="Ej. 37.5" required value={formulario.temperatura} onChange={e => setFormulario({...formulario, temperatura: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (lb)</label>
                <input type="number" step="0.1" className="form-input" placeholder="Ej. 150" required value={formulario.peso} onChange={e => setFormulario({...formulario, peso: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Estatura (m)</label>
                <input type="number" step="0.01" className="form-input" placeholder="Ej. 1.70" required value={formulario.altura} onChange={e => setFormulario({...formulario, altura: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="submit-btn" style={{ marginTop: '2rem', width: '100%' }}>
              Guardar Pre-clínica y Enviar a Médico
            </button>
          </form>
        </div>
      )}
    </div>
  );
};