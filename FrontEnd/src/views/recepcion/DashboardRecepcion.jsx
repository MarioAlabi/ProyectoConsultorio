export const DashboardRecepcion = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>Recepcion y Admision</h1>
      <p style={{ color: '#4b5563' }}>Bienvenida al panel de control. Desde aqui puedes gestionar los expedientes de los pacientes y tomar sus signos vitales para la pre-clinica.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0d9488', margin: '0 0 1rem 0' }}>Pacientes en Espera</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>3</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0d9488', margin: '0 0 1rem 0' }}>Pacientes Atendidos Hoy</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>12</p>
        </div>
      </div>
    </div>
  );
};
