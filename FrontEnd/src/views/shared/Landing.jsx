import { useSettings } from '../../hooks/useSettings';
import { LoginButton } from '../../components/LoginButton';
import './Shared.css';

export const Landing = () => {
  // 1. Consumimos los datos institucionales desde el hook de React Query
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="landing-container">
      <div className="landing-card">
        
        <div className="landing-content">
          {/* 2. Logo Dinámico: Mostramos el logo de la BD o un contenedor elegante si está cargando */}
          {settings?.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={`Logo ${settings?.clinicName}`} 
              className="landing-logo" 
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="landing-logo-placeholder" style={{ 
              height: '120px', width: '120px', backgroundColor: '#f3f4f6', 
              borderRadius: '1rem', display: 'flex', justifyContent: 'center', 
              alignItems: 'center', fontSize: '3rem', color: '#0d9488', fontWeight: 'bold'
            }}>
              {settings?.clinicName?.charAt(0) || 'C'}
            </div>
          )}

          <div className="landing-text">
            <h1 className="landing-title">
              Sistema de Gestión Clínica
            </h1>
            <p className="landing-description">
              Plataforma integral para la administración de expedientes médicos y 
              generación de documentación clínica con asistencia inteligente para la 
              {/* 3. Nombre Dinámico: Usamos el nombre de la configuración */}
              <strong> {isLoading ? 'Cargando clínica...' : (settings?.clinicName || 'Nuestra Clínica')}</strong>. 
              Acceso exclusivo para personal autorizado.
            </p>
          </div>
        </div>

        <LoginButton />

      </div>
    </div>
  );
};