import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { ROLES } from "../../lib/constants/roles";
import { createUserSchema, editUserSchema } from "../../lib/validations/userSchema";
import { Modal } from "../../components/Modal";
import "../../views/shared/Shared.css";

const ROLE_LABELS = {
  [ROLES.DOCTOR]: "Medico",
  [ROLES.ASSISTANT]: "Asistente / Recepcion",
  [ROLES.ADMIN]: "Administrador",
};

export const AdministrarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isPending, startTransition] = useTransition();

  const schema = editingUser ? editUserSchema : createUserSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: ROLES.DOCTOR },
  });

  const fetchUsers = useCallback(() => {
    startTransition(async () => {
      const { data, error } = await authClient.admin.listUsers({ query: { limit: 100 } });
      if (error) { toast.error(error.message || "Error al cargar usuarios."); return; }
      setUsuarios(data?.users ?? []);
    });
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenNew = () => {
    setEditingUser(null);
    reset({ name: "", email: "", password: "", role: ROLES.DOCTOR });
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    reset({ name: user.name, email: user.email, password: "", role: user.role ?? ROLES.ASSISTANT });
    setShowForm(true);
  };

  const handleToggleBan = (user) => {
    startTransition(async () => {
      const isBanned = user.banned;
      const { error } = isBanned
        ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({ userId: user.id, banReason: "Desactivado por administrador" });
      if (error) { toast.error(error.message || "Error al cambiar estado."); return; }
      toast.success(isBanned ? "Usuario activado." : "Usuario desactivado.");
      fetchUsers();
    });
  };

  const onSubmit = (formData) => {
    startTransition(async () => {
      if (editingUser) {
        // Update name/email
        const { error: updateErr } = await authClient.admin.updateUser({ userId: editingUser.id, data: { name: formData.name, email: formData.email } });
        if (updateErr) { toast.error(updateErr.message); return; }
        // Update role
        if (formData.role !== editingUser.role) {
          const { error: roleErr } = await authClient.admin.setRole({ userId: editingUser.id, role: formData.role });
          if (roleErr) { toast.error(roleErr.message); return; }
        }
        // Update password (optional)
        if (formData.password && formData.password.length >= 6) {
          const { error: pwErr } = await authClient.admin.setUserPassword({ userId: editingUser.id, newPassword: formData.password });
          if (pwErr) { toast.error(pwErr.message); return; }
        }
        toast.success("Usuario actualizado.");
      } else {
        const { error } = await authClient.admin.createUser({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
        if (error) { toast.error(error.message || "Error al crear usuario."); return; }
        toast.success("Usuario creado.");
      }
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    });
  };

  const currentSession = authClient.useSession();
  const currentUserId = currentSession.data?.user?.id;

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Administrar Usuarios</h1>
          <p style={{ color: "#4b5563", margin: "0.5rem 0 0 0" }}>Gestion del personal de la clinica.</p>
        </div>
        <button onClick={handleOpenNew} className="submit-btn" style={{ margin: 0, padding: "0.75rem 1.5rem" }} disabled={isPending}>+ Nuevo Usuario</button>
      </div>

      {/* Tabla de usuarios */}
      <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr style={{ color: "#4b5563", fontSize: "0.9rem" }}>
              <th style={{ padding: "1.2rem 1.5rem" }}>Nombre</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Correo</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Rol</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Estado</th>
              <th style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => {
              const isActive = !user.banned;
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "1.2rem 1.5rem", fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: "1.2rem 1.5rem", color: "#6b7280" }}>{user.email}</td>
                  <td style={{ padding: "1.2rem 1.5rem", color: "#6b7280" }}>{ROLE_LABELS[user.role] ?? user.role}</td>
                  <td style={{ padding: "1.2rem 1.5rem" }}>
                    <span style={{ backgroundColor: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#166534" : "#991b1b", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>{isActive ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>
                    <button onClick={() => handleEdit(user)} style={{ marginRight: "1rem", color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                    {!isSelf && (<button onClick={() => handleToggleBan(user)} style={{ color: isActive ? "#ef4444" : "#10b981", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>{isActive ? "Desactivar" : "Activar"}</button>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingUser(null); }} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Nombre Completo *</label><input type="text" className="form-input" {...register("name")} />{errors.name && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.name.message}</span>}</div>
            <div className="form-group"><label className="form-label">Correo Electronico *</label><input type="email" className="form-input" {...register("email")} />{errors.email && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.email.message}</span>}</div>
            <div className="form-group"><label className="form-label">{editingUser ? "Nueva Contrasena (Opcional)" : "Contrasena *"}</label><input type="password" className="form-input" placeholder={editingUser ? "Dejar vacio para no cambiar" : ""} autoComplete="new-password" {...register("password")} />{errors.password && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.password.message}</span>}</div>
            <div className="form-group"><label className="form-label">Rol del Sistema *</label><select className="form-input" {...register("role")} style={{ backgroundColor: "white" }}>{Object.entries(ROLE_LABELS).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}</select></div>
          </div>
          <button type="submit" className="submit-btn" disabled={isPending}>{isPending ? "Guardando..." : editingUser ? "Guardar Cambios" : "Registrar Usuario"}</button>
        </form>
      </Modal>
    </div>
  );
};
