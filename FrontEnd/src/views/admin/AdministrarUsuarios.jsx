import { useState, useEffect, useTransition, useCallback } from 'react';
import { authClient } from '../../lib/auth-client';
import { ROLES } from '../../lib/constants/roles';
import '../../views/shared/Shared.css';

const ROLE_LABELS = {
  [ROLES.DOCTOR]: 'Medico',
  [ROLES.ASSISTANT]: 'Asistente / Recepcion',
  [ROLES.ADMIN]: 'Administrador',
};

const INITIAL_FORM = { id: null, name: '', email: '', password: '', role: ROLES.DOCTOR };

export const AdministrarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [errores, setErrores] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = useCallback(() => {
    startTransition(async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 100 },
      });

      if (error) {
        setErrores([error.message || 'Error al cargar usuarios.']);
        return;
      }

      setUsuarios(data?.users ?? []);
    });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAbrirNuevo = () => {
    setFormData(INITIAL_FORM);
    setOriginalData(null);
    setModoEdicion(false);
    setErrores([]);
    setMostrarFormulario(true);
  };

  const handleEditar = (user) => {
    const editData = { id: user.id, name: user.name, email: user.email, password: '', role: user.role ?? ROLES.ASSISTANT };
    setFormData(editData);
    setOriginalData(editData);
    setModoEdicion(true);
    setErrores([]);
    setMostrarFormulario(true);
  };

  const handleToggleBan = (user) => {
    startTransition(async () => {
      const isBanned = user.banned;

      const { error } = isBanned
        ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({ userId: user.id, banReason: 'Desactivado por administrador' });

      if (error) {
        setErrores([error.message || 'Error al cambiar estado del usuario.']);
        return;
      }

      fetchUsers();
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrores([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = [];

    if (!formData.name.trim()) newErrors.push('El nombre completo es obligatorio.');
    if (!formData.email.trim()) newErrors.push('El correo electronico es obligatorio.');
    if (!modoEdicion && (!formData.password.trim() || formData.password.length < 6)) {
      newErrors.push('La contrasena es obligatoria y debe tener al menos 6 caracteres.');
    }
    if (modoEdicion && formData.password && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.push('La contrasena debe tener al menos 6 caracteres.');
    }

    if (newErrors.length > 0) {
      setErrores(newErrors);
      return;
    }

    startTransition(async () => {
      if (modoEdicion) {
        const updateErrors = await handleUpdate();
        if (updateErrors.length > 0) {
          setErrores(updateErrors);
          return;
        }
      } else {
        const { error } = await authClient.admin.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        if (error) {
          setErrores([error.message || 'Error al crear usuario.']);
          return;
        }
      }

      setMostrarFormulario(false);
      fetchUsers();
    });
  };

  const handleUpdate = async () => {
    const errors = [];

    const nameChanged = formData.name !== originalData.name;
    const emailChanged = formData.email !== originalData.email;
    if (nameChanged || emailChanged) {
      const updateData = {};
      if (nameChanged) updateData.name = formData.name;
      if (emailChanged) updateData.email = formData.email;

      const { error } = await authClient.admin.adminUpdateUser({
        userId: formData.id,
        data: updateData,
      });
      if (error) {
        errors.push(error.message || 'Error al actualizar datos del usuario.');
        return errors;
      }
    }

    if (formData.role !== originalData.role) {
      const { error } = await authClient.admin.setRole({
        userId: formData.id,
        role: formData.role,
      });
      if (error) {
        errors.push(error.message || 'Error al cambiar el rol.');
        return errors;
      }
    }

    if (formData.password.trim()) {
      const { error } = await authClient.admin.setUserPassword({
        userId: formData.id,
        newPassword: formData.password,
      });
      if (error) {
        errors.push(error.message || 'Error al cambiar la contrasena.');
        return errors;
      }
    }

    return errors;
  };

  const currentSession = authClient.useSession();
  const currentUserId = currentSession.data?.user?.id;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#1f2937', margin: 0 }}>Administrar Usuarios</h1>
          <p style={{ color: '#4b5563', margin: '0.5rem 0 0 0' }}>Gestion del personal de la clinica.</p>
        </div>
        {!mostrarFormulario && (
          <button onClick={handleAbrirNuevo} className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem' }} disabled={isPending}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {errores.length > 0 && !mostrarFormulario && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{errores.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      {mostrarFormulario ? (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, color: '#0d9488' }}>{modoEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="Ej. Dr. Juan Perez" />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electronico</label>
                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="Ej. jperez@clinica.com" />
              </div>
              <div className="form-group">
                <label className="form-label">{modoEdicion ? 'Nueva Contrasena (opcional)' : 'Contrasena Temporal'}</label>
                <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Rol del Sistema</label>
                <select name="role" className="form-input" style={{ backgroundColor: 'white' }} value={formData.role} onChange={handleChange}>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {errores.length > 0 && (
              <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{errores.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { setMostrarFormulario(false); setErrores([]); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" className="submit-btn" style={{ margin: 0, padding: '0.75rem 1.5rem', opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }} disabled={isPending}>
                {isPending ? 'Guardando...' : modoEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {isPending && usuarios.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando usuarios...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr style={{ color: '#4b5563', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1.2rem 1.5rem' }}>Nombre</th>
                  <th style={{ padding: '1.2rem 1.5rem' }}>Correo</th>
                  <th style={{ padding: '1.2rem 1.5rem' }}>Rol</th>
                  <th style={{ padding: '1.2rem 1.5rem' }}>Estado</th>
                  <th style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => {
                  const isActive = !user.banned;
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '1.2rem 1.5rem', fontWeight: '500', color: '#1f2937' }}>{user.name}</td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{user.email}</td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#6b7280' }}>{ROLE_LABELS[user.role] ?? user.role}</td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{
                          backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '500'
                        }}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                        <button onClick={() => handleEditar(user)} disabled={isPending} style={{ marginRight: '1rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                          Editar
                        </button>
                        {!isSelf && (
                          <button onClick={() => handleToggleBan(user)} disabled={isPending} style={{ color: isActive ? '#ef4444' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                            {isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
