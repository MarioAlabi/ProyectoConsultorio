import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LogoutButton = ({ className = '' }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const confirmLogout = () => {
    // Aquí irá la lógica para limpiar la sesión. 
    // Por ahora, simulamos limpiando el localStorage:
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    // Redirigimos a la página de inicio/recepción
    navigate('/');
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={className}
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
      >
        Cerrar Sesión
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#1f2937', marginBottom: '1rem' }}>¿Cerrar Sesión?</h3>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
              ¿Estás seguro que quieres salir del sistema?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#374151' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmLogout}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};