import {  useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import '../../views/shared/Shared.css';

export const ConsultaMedica = () => {
  const { state } = useLocation();
  const p = state?.paciente || { nombre: 'Paciente Nuevo', edad: 0, peso: 0, altura: 0 };

  // Lógica de IMC (CA-22: CA-01 al CA-05)
  const imcData = useMemo(() => {
    if (!p.peso || !p.altura) return { valor: 'N/A', clase: 'Sin datos' };
    const pesoKg = p.peso / 2.2046; // lb a kg
    const valor = (pesoKg / (p.altura * p.altura)).toFixed(2);
    let clase = '';
    if (valor < 18.5) clase = 'Bajo Peso';
    else if (valor < 25) clase = 'Normal';
    else if (valor < 30) clase = 'Sobrepeso';
    else clase = 'Obesidad';
    return { valor, clase };
  }, [p.peso, p.altura]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 80px)' }}>
      
      {/* COLUMNA IZQUIERDA: DATOS Y PRECLÍNICA */}
      <aside style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0f766e' }}>Expediente</h2>
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <p><strong>Nombre:</strong> {p.nombre}</p>
          <p><strong>Edad:</strong> {p.edad} años</p>
          {p.esMenor && <span className="badge-menor">MENOR DE EDAD</span>}
        </div>

        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #ddd' }}>Signos Vitales (CA-25)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div className="vitals-box">PA: {p.presion || '--'}</div>
          <div className="vitals-box">Temp: {p.temperatura || '--'}°C</div>
          <div className="vitals-box">Peso: {p.peso || '--'} lb</div>
          <div className="vitals-box">Est: {p.altura || '--'} m</div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}><strong>IMC (Calculado):</strong></p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{imcData.valor}</p>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>{imcData.clase}</span>
          {p.esMenor && <p style={{ fontSize: '0.8rem', color: '#1e40af' }}>Percentil: 85% (Normal)</p>}
        </div>

        <button className="secondary-btn" style={{ marginTop: '20px', width: '100%' }}>
          Ver Historial Completo
        </button>
      </aside>

      {/* COLUMNA DERECHA: CONSULTA Y DOCUMENTOS */}
      <main style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Consulta Actual</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="doc-btn">📄 Receta</button>
            <button className="doc-btn">📝 Constancia</button>
            <button className="doc-btn">🏥 Incapacidad</button>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label className="form-label">Motivo de consulta / Anamnesis</label>
          <textarea className="form-input" rows="3" defaultValue={p.motivo}></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Examen Físico</label>
          <textarea className="form-input" rows="4" placeholder="Hallazgos del examen..."></textarea>
        </div>

        <div className="form-group">
          <label className="form-label">Diagnóstico e Indicaciones</label>
          <textarea className="form-input" rows="4" placeholder="Diagnóstico definitivo..."></textarea>
        </div>

        <button className="submit-btn" style={{ marginTop: '10px' }}>Finalizar y Guardar Consulta</button>
      </main>
    </div>
  );
};