import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'; // Ajusta la ruta
import '../../views/shared/Shared.css';

export const ConfiguracionClinica = () => {
    const { data: settingsData, isLoading } = useSettings();
    
    const { mutateAsync: updateSettings, isPending } = useUpdateSettings();

    const [formData, setFormData] = useState({ clinicName: '', address: '' });
    const [vistaPrevia, setVistaPrevia] = useState(null);
    const [logoBase64, setLogoBase64] = useState('');

    useEffect(() => {
        if (settingsData) {
        setFormData({ 
            clinicName: settingsData.clinicName || '', 
            address: settingsData.address || '' 
        });
        if (settingsData.logoUrl) {
            setVistaPrevia(settingsData.logoUrl);
        }
        }
    }, [settingsData]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'image/png' && file.type !== 'image/jpeg') {

            alert('Solo se permiten imágenes PNG o JPG'); 
            return;
    }

    const reader = new FileReader();
        reader.onloadend = () => {
        setLogoBase64(reader.result);
        setVistaPrevia(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGuardar = async (e) => {
    e.preventDefault();
    
    await updateSettings({
        clinicName: formData.clinicName,
        address: formData.address,
        logoBase64: logoBase64 || null
    });
    
    setLogoBase64('');
    };

    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando configuración...</div>;
    }

    return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>Configuración Institucional</h1>

        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleGuardar} className="login-form">
            
            {/* Fila del Logo */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '10px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed #d1d5db', overflow: 'hidden' }}>
                {vistaPrevia ? (
                    <img src={vistaPrevia} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Sin logo</span>
                )}
            </div>
            
            <div style={{ flex: 1 }}>
                <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Logo de la Clínica</h3>
                <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                </div>
            </div>

            {/* Campos de Texto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="form-group">
                <label className="form-label">Nombre Comercial</label>
                <input type="text" className="form-input" required value={formData.clinicName} onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })} />
                </div>

                <div className="form-group">
                <label className="form-label">Dirección Principal</label>
                <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
            {/* isPending viene directo de useUpdateSettings */}
            <button type="submit" className="submit-btn" disabled={isPending} style={{ width: 'auto', padding: '0.8rem 2rem' }}>
                {isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            </div>
        </form>
        </div>
    </div>
    );
};