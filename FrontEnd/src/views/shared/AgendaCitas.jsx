import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import "../../views/shared/Shared.css";

export const AgendaCitas = () => {
  const [loading, setLoading] = useState(false);
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pacientesResultados, setPacientesResultados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    hora: "",
    motivo: "",
  });

  // Cargar citas del día seleccionado (HU-09 CA-03)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?date=${fechaSeleccionada}`);
      setCitas(res.data?.data || []);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas, fechaSeleccionada]);

  // Buscar pacientes para la cita (HU-09 CA-01)
  useEffect(() => {
    const buscar = async () => {
      if (busqueda.length < 3) return setPacientesResultados([]);
      try {
        const res = await api.get(`/patients?q=${busqueda}`);
        setPacientesResultados(res.data?.data || []);
      } catch (error) {
        console.error("Error buscando pacientes:", error);
      }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleAgendar = async (e) => {
    e.preventDefault();
    if (!pacienteSeleccionado || !formData.hora) return alert("Paciente y hora son obligatorios.");

    // Validación de fecha pasada (HU-09 CA-07)
    const hoy = new Date().toISOString().split('T')[0];
    if (fechaSeleccionada < hoy) return alert("No se pueden agendar citas en fechas pasadas.");

    try {
      await api.post("/appointments", {
        patientId: pacienteSeleccionado.id,
        date: fechaSeleccionada,
        time: formData.hora,
        reason: formData.motivo,
      });
      alert("Cita agendada con éxito ✅");
      setPacienteSeleccionado(null);
      setFormData({ hora: "", motivo: "" });
      setBusqueda("");
      cargarCitas();
    } catch (error) {
      alert(error.response?.data?.message || "Error al agendar cita.");
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: nuevoEstado });
      cargarCitas();
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el estado.");
    }
  };

  const S = {
    layout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', height: 'fit-content' },
    citaCard: { borderLeft: '5px solid #0d9488', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.8rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    badge: (status) => ({
      padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold',
      backgroundColor: status === 'scheduled' ? '#dbeafe' : status === 'present' ? '#dcfce7' : '#fee2e2',
      color: status === 'scheduled' ? '#1e40af' : status === 'present' ? '#166534' : '#991b1b'
    })
  };

  return (
    <div style={S.layout}>
      {/* Columna Izquierda: Formulario de Agendado (HU-09 CA-01) */}
      <aside style={S.card}>
        <h2 style={{ color: '#0d9488', marginTop: 0 }}>Nueva Cita</h2>
        <form onSubmit={handleAgendar} className="login-form">
          <div className="form-group">
            <label className="form-label">Buscar Paciente</label>
            <input 
              type="text" className="form-input" placeholder="Nombre o DUI..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} 
            />
            {pacientesResultados.length > 0 && !pacienteSeleccionado && (
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto' }}>
                {pacientesResultados.map(p => (
                  <div 
                    key={p.id} onClick={() => setPacienteSeleccionado(p)}
                    style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  >
                    {p.fullName} - {p.identityDocument}
                  </div>
                ))}
              </div>
            )}
            {pacienteSeleccionado && (
              <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0fdfa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Paciente:</strong> {pacienteSeleccionado.fullName}</span>
                <button type="button" onClick={() => setPacienteSeleccionado(null)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>✖</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Cita</label>
            <input type="date" className="form-input" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Hora</label>
            <input type="time" className="form-input" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo (Opcional)</label>
            <input type="text" className="form-input" placeholder="Ej. Control de azúcar" value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} />
          </div>

          <button type="submit" className="submit-btn">Agendar Cita</button>
        </form>
      </aside>

      {/* Columna Derecha: Listado de Citas (HU-09 CA-03/CA-04/CA-05) */}
      <main style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Citas para el {fechaSeleccionada}</h2>
          {loading && <span>Cargando...</span>}
        </div>

        {citas.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '3rem' }}>No hay citas agendadas para este día.</p>
        ) : (
          <div>
            {citas.map(c => (
              <div key={c.id} style={S.citaCard}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{c.time} - {c.patientName}</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Motivo: {c.reason || "No especificado"}</div>
                  <span style={S.badge(c.status)}>{c.status.toUpperCase()}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {c.status === 'scheduled' && (
                    <>
                      <button onClick={() => cambiarEstado(c.id, 'present')} className="doc-btn" style={{ color: '#0d9488' }}>Llegó</button>
                      <button onClick={() => cambiarEstado(c.id, 'cancelled')} className="doc-btn" style={{ color: '#ef4444' }}>Cancelar</button>
                    </>
                  )}
                  {c.status === 'present' && <span style={{ color: '#166534', fontWeight: 'bold' }}>En recepción</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};