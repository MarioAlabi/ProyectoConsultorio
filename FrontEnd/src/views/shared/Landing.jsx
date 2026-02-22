import logoClinica from '../../assets/logo.png'; 
import { LoginButton } from '../../components/LoginButton';
import './Landing.css';

export const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-card">
        
        <div className="landing-content">
          <img 
            src={logoClinica} 
            alt="Logo Clínica Esperanza de Vida" 
            className="landing-logo" 
          />
          <div className="landing-text">
            <h1 className="landing-title">
              Sistema de Gestión Clínica
            </h1>
            <p className="landing-description">
              Plataforma integral para la administración de expedientes médicos y 
              generación de documentación clínica con asistencia inteligente para la 
              <strong> Clínica Esperanza de Vida</strong>. Acceso exclusivo para personal autorizado.
            </p>
          </div>
        </div>

        <LoginButton />

      </div>
    </div>
  );
};