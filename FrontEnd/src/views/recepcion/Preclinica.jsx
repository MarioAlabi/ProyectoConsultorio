import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css';

export const Preclinica = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pacienteInicial = location.state?.pacienteSeleccionado ?? null;

  const [paciente, setPaciente] = useState(pacienteInicial);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({ motivo: '', presion: '', temperatura: '', peso: '', altura: '' });

  const mockDB = [
    { id: 1, nombre: 'Carlos Ruiz', dui: '12345678-9', edad: 45, sexo: 'M', esMenor: false },
    { id: 4, nombre: 'Luisito Comunicas', dui: '00000000-0', edad: 8, sexo: 'M', esMenor: true },
  ];

  const resultadosBusqueda = busqueda.length > 2
    ? mockDB.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : [];

  const handleSeleccionarPaciente = (p) => {
    setPaciente(p);
    setBusqueda('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos enviados a cola medica:', { paciente, formulario });
    alert(`Pre-clinica de ${paciente.nombre} enviada al medico.`);
    navigate('/reception');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>Registro de Pre-clinica</h1>

      {!paciente ? (
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <label className="form-label">Buscar Paciente:</label>
          <input type="text" className="form-input" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          {resultadosBusqueda.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {resultadosBusqueda.map(res => (
                <div key={res.id} onClick={() => handleSeleccionarPaciente(res)} style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                  <strong>{res.nombre}</strong> {res.esMenor && '(Menor de Edad)'}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: paciente.esMenor ? '#eff6ff' : '#f0fdf4',
          border: `1px solid ${paciente.esMenor ? '#bfdbfe' : '#bbf7d0'}`,
          padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: paciente.esMenor ? '#1e40af' : '#166534' }}>
                {paciente.nombre}
              </h3>
              {paciente.esMenor && (
                <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #1e40af' }}>
                  MENOR DE EDAD
                </span>
              )}
            </div>
            <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '0.95rem' }}>
              <strong>Edad:</strong> {paciente.edad} anos |
              <strong> {paciente.esMenor ? 'DUI Responsable:' : 'DUI:'}</strong> {paciente.dui}
            </p>
          </div>
          <button onClick={() => setPaciente(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Cambiar
          </button>
        </div>
      )}

      {paciente && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Motivo de la Consulta</label>
              <textarea className="form-input" rows="2" required value={formulario.motivo} onChange={e => setFormulario({...formulario, motivo: e.target.value})}></textarea>
            </div>

            <h4 style={{ color: '#0d9488', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0' }}>Signos Vitales</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Presion Arterial</label>
                <input type="text" className="form-input" required placeholder="120/80" value={formulario.presion} onChange={e => setFormulario({...formulario, presion: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Temperatura (C)</label>
                <input type="number" step="0.1" className="form-input" required placeholder="36.5" value={formulario.temperatura} onChange={e => setFormulario({...formulario, temperatura: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (lb)</label>
                <input type="number" step="0.1" className="form-input" required placeholder="150" value={formulario.peso} onChange={e => setFormulario({...formulario, peso: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Estatura (m)</label>
                <input type="number" step="0.01" className="form-input" required placeholder="1.70" value={formulario.altura} onChange={e => setFormulario({...formulario, altura: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="submit-btn" style={{ marginTop: '2rem' }}>
              Confirmar Pre-clinica
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
