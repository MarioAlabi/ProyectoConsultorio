import { useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import logoClinica from '../../assets/logo.png';
import './Shared.css';

    export const ChangePassword = () => {
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (newPassword.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
        }

        if (newPassword !== confirmPassword) {
        setErrorMsg('Las nuevas contraseñas no coinciden.');
        return;
        }

        startTransition(async () => {
        const { error } = await authClient.changePassword({
            currentPassword: currentPassword,
            newPassword: newPassword,
            revokeOtherSessions: true, 
        });

        if (error) {
            setErrorMsg(error.message || 'Error al actualizar la contraseña.');
            return;
        }

        setSuccess(true);
        setTimeout(() => navigate(-1), 3000); 
        });
    };

    return (
        <div className="landing-container" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="landing-card" style={{
            maxWidth: '450px',
            width: '90%',
            padding: '2.5rem',
            gap: '1.2rem',
            boxSizing: 'border-box',
            marginTop: '2rem'
        }}>
            <img src={logoClinica} alt="Logo" className="landing-logo" style={{ width: '130px', height: 'auto' }} />

            <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 className="landing-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                {success ? '¡Éxito!' : 'Seguridad'}
            </h2>
            <p className="landing-description" style={{ fontSize: '0.95rem' }}>
                {success
                ? 'Tu contraseña ha sido actualizada correctamente.'
                : 'Ingresa tus datos para actualizar tu clave de acceso.'}
            </p>
            </div>

            {!success && (
            <form className="login-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
                
                <div className="form-group">
                <label className="form-label" htmlFor="currentPassword">Contraseña Actual</label>
                <input
                    type="password"
                    id="currentPassword"
                    className="form-input"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                </div>

                <div className="form-group">
                <label className="form-label" htmlFor="newPassword">Nueva Contraseña</label>
                <input
                    type="password"
                    id="newPassword"
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                </div>

                <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                </div>

                {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                    {errorMsg}
                </div>
                )}

                <button
                type="submit"
                className="submit-btn"
                disabled={isPending}
                style={{ 
                    opacity: isPending ? 0.7 : 1, 
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    marginTop: '1rem'
                }}
                >
                {isPending ? 'Cambiando...' : 'Actualizar Contraseña'}
                </button>
            </form>
            )}

            <button 
            onClick={() => navigate(-1)} 
            className="forgot-password" 
            style={{ fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginTop: '10px' }}
            >
            Cancelar y volver
            </button>
        </div>
        </div>
    );
};