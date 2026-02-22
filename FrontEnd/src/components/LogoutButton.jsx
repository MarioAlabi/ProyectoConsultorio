import { useNavigate } from 'react-router-dom';

export const LogoutButton = ({ className = '' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí irá la lógica para limpiar la sesión. 
    // Por ahora, simulamos limpiando el localStorage:
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    
    // Redirigimos a la página de inicio/recepción
    navigate('/');
  };

  return (
    <button 
      onClick={handleLogout}
      className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors ${className}`}
    >
      Cerrar Sesión
    </button>
  );
};