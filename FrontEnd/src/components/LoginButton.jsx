import { useNavigate } from 'react-router-dom';

export const LoginButton = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login'); 
  };

  const buttonStyle = {
    backgroundColor: '#0d9488', /* Un tono aqua oscuro elegante */
    color: 'white',
    padding: '1rem 4rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(13, 148, 136, 0.3)',
    transition: 'background-color 0.2s',
  };

  return (
    <button 
      onClick={handleLoginClick}
      style={buttonStyle}
      onMouseOver={(e) => e.target.style.backgroundColor = '#0f766e'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#0d9488'}
    >
      Iniciar Sesión
    </button>
  );
};