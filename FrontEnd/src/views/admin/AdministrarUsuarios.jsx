import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../views/shared/Shared.css'; // Reutilizamos estilos

export const AdministrarUsuarios = () => {
  const navigate = useNavigate();

  // 1. Protección de ruta (CA-03): Solo admin [cite: 70]
  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  // 2. Estado "Base de Datos" (Read del CRUD)
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre: 'Dr. Pérez', username: 'doctor', rol: 'medico', estado: 'Activo' },
    { id: 2, nombre: 'Ana', username: 'asistente', rol: 'recepción', estado: 'Activo' }
  ]);

  // 3. Estados para el Formulario y UI
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [errores, setErrores] = useState([]);
  
  const estadoInicialFormulario = { id: null, nombre: '', username: '', password: '', rol: 'medico', estado: 'Activo' };
  const [formData, setFormData] = useState(estadoInicialFormulario);

  // --- LÓGICA DEL CRUD ---

  const handleAbrirNuevo = () => {
    setFormData(estadoInicialFormulario);
    setModoEdicion(false);
    setErrores([]);
    setMostrarFormulario(true);
  };

  const handleEditar = (usuario) => {
    setFormData({ ...usuario, password: '' }); // La clave se deja en blanco por seguridad
    setModoEdicion(true);
    setErrores([]);
    setMostrarFormulario(true);
  };

  const handleDesactivar = (id) => {
    // HU-16: En lugar de borrar, cambiamos el estado 
    const usuariosActualizados = usuarios.map(u => 
      u.id === id ? { ...u, estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' } : u
    );
    setUsuarios(usuariosActualizados);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrores([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevosErrores = [];

    // Validaciones (CA-02) [cite: 70]
    if (!formData.nombre.trim()) nuevosErrores.push('El nombre completo es obligatorio.');
    if (!formData.username.trim()) nuevosErrores.push('El nombre de usuario es obligatorio.');
    if (!modoEdicion && (!formData.password.trim() || formData.password.length < 6)) {
      nuevosErrores.push('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
    }

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    if (modoEdicion) {
      // Update
      setUsuarios(usuarios.map(u => (u.id === formData.id ? formData : u)));
    } else {
      // Create (Generamos un ID falso)
      const nuevoUsuario = { ...formData, id: Date.now() };
      setUsuarios([...usuarios, nuevoUsuario]);
    }

    setMostrarFormulario(false);
  };

  // --- RENDERIZADO DE LA VISTA ---
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#1f2937', margin: 0 }}>Administrar Usuarios</h1>
          <p style={{ color: '#4b5563', margin: '0.5rem 0 0 0' }}>Gestión del personal de la clínica.</p>
        </div>
        {!mostrarFormulario && (
          <button onClick={handleAbrirNuevo} className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {/* SECCIÓN DEL FORMULARIO (Crear / Actualizar) */}
      {mostrarFormulario ? (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, color: '#0d9488' }}>{modoEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input type="text" name="nombre" className="form-input" value={formData.nombre} onChange={handleChange} placeholder="Ej. Dr. Juan Pérez" />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario (Login)</label>
                <input type="text" name="username" className="form-input" value={formData.username} onChange={handleChange} placeholder="Ej. jperez" />
              </div>
              <div className="form-group">
                <label className="form-label">{modoEdicion ? 'Nueva Contraseña (opcional)' : 'Contraseña Temporal'}</label>
                <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Rol del Sistema</label>
                <select name="rol" className="form-input" style={{ backgroundColor: 'white' }} value={formData.rol} onChange={handleChange}>
                  <option value="medico">Médico</option>
                  <option value="recepcion">Asistente / Recepción</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {errores.length > 0 && (
              <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{errores.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setMostrarFormulario(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem' }}>
                {modoEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* SECCIÓN DE LA TABLA (Leer / Eliminar-Desactivar) */
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr style={{ color: '#4b5563', fontSize: '0.9rem' }}>
                <th style={{ padding: '1.2rem 1.5rem' }}>Nombre</th>
                <th style={{ padding: '1.2rem 1.5rem' }}>Usuario</th>
                <th style={{ padding: '1.2rem 1.5rem' }}>Rol</th>
                <th style={{ padding: '1.2rem 1.5rem' }}>Estado</th>
                <th style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1.2rem 1.5rem', fontWeight: '500', color: '#1f2937' }}>{user.nombre}</td>
                  <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{user.username}</td>
                  <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280', textTransform: 'capitalize' }}>{user.rol}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <span style={{ 
                      backgroundColor: user.estado === 'Activo' ? '#dcfce7' : '#fee2e2', 
                      color: user.estado === 'Activo' ? '#166534' : '#991b1b', 
                      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '500' 
                    }}>
                      {user.estado}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                    <button onClick={() => handleEditar(user)} style={{ marginRight: '1rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                      Editar
                    </button>
                    <button onClick={() => handleDesactivar(user.id)} style={{ color: user.estado === 'Activo' ? '#ef4444' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                      {user.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};