import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authClient } from "../../lib/auth-client";
import { ROLES } from "../../lib/constants/roles";
import { createUserSchema, editUserSchema } from "../../lib/validations/userSchema";
import { Modal } from "../../components/Modal";

const ROLE_LABELS = {
  [ROLES.DOCTOR]: "Médico",
  [ROLES.ASSISTANT]: "Asistente / Recepción",
  [ROLES.ADMIN]: "Administrador",
};

// --- Funciones de Formateo Automático ---
const formatDui = (value) => {
  const raw = value.replace(/\D/g, '').substring(0, 9);
  if (raw.length > 8) return `${raw.substring(0, 8)}-${raw.substring(8)}`;
  return raw;
};

const formatPhone = (value) => {
  const raw = value.replace(/\D/g, '').substring(0, 8);
  if (raw.length > 4) return `${raw.substring(0, 4)}-${raw.substring(4)}`;
  return raw;
};
// ---------------------------------------

export const AdministrarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // ESTADO NUEVO: Controla la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false); 
  
  const [isPending, startTransition] = useTransition();

  const schema = editingUser ? editUserSchema : createUserSchema;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
        name: "", email: "", password: "", role: ROLES.DOCTOR,
        dui: "", phone: "", address: "", hiringDate: "",
        isNurse: false, jvpm: "", jvpe: ""
    },
  });

  const selectedRole = watch("role");
  const isNurseChecked = watch("isNurse");

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
    setShowPassword(false); // Ocultar contraseña al abrir modal
    reset({ name: "", email: "", password: "", role: ROLES.DOCTOR, dui: "", phone: "", address: "", hiringDate: "", isNurse: false, jvpm: "", jvpe: "" });
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowPassword(false); // Ocultar contraseña al editar a alguien
    reset({ 
        name: user.name, 
        email: user.email, 
        password: "", 
        role: user.role ?? ROLES.ASSISTANT,
        dui: user.dui || "",
        phone: user.phone || "",
        address: user.address || "",
        hiringDate: user.hiringDate ? new Date(user.hiringDate).toISOString().split('T')[0] : "",
        isNurse: user.isNurse || false,
        jvpm: user.jvpm || "",
        jvpe: user.jvpe || ""
    });
    setShowForm(true);
  };

  const handleToggleBan = (user) => {
    const adminsActivos = usuarios.filter(u => u.role === ROLES.ADMIN && !u.banned);
    if (!user.banned && user.role === ROLES.ADMIN && adminsActivos.length <= 1) {
        toast.error("No se puede desactivar al único administrador activo.");
        return;
    }
    if (!window.confirm(`¿Está seguro de ${user.banned ? 'activar' : 'desactivar'} a este usuario?`)) return;

    startTransition(async () => {
      const isBanned = user.banned;
      const { error } = isBanned
        ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({ userId: user.id, banReason: "Desactivado por administración" });
      if (error) { toast.error(error.message || "Error al cambiar estado."); return; }
      toast.success(isBanned ? "Usuario activado." : "Usuario desactivado.");
      fetchUsers();
    });
  };

  const onSubmit = (formData) => {
    startTransition(async () => {
      // --- 1. PRE-VALIDACIÓN DE DUPLICADOS (Corta el error de raíz) ---
      // Revisamos si el DUI ya existe (y nos aseguramos de no bloquearnos a nosotros mismos si estamos editando)
      const isDuiDuplicate = usuarios.some(u => u.dui === formData.dui && u.id !== editingUser?.id);
      if (isDuiDuplicate) {
          toast.error("Error: El DUI ingresado ya pertenece a otro empleado.");
          return; // Detiene la función ANTES de crear el usuario a medias
      }

      if (formData.role === ROLES.DOCTOR && formData.jvpm) {
          const isJvpmDuplicate = usuarios.some(u => u.jvpm === formData.jvpm && u.id !== editingUser?.id);
          if (isJvpmDuplicate) {
              toast.error("Error: El número de JVPM ya está registrado en el sistema.");
              return;
          }
      }

      if (formData.role === ROLES.ASSISTANT && formData.isNurse && formData.jvpe) {
          const isJvpeDuplicate = usuarios.some(u => u.jvpe === formData.jvpe && u.id !== editingUser?.id);
          if (isJvpeDuplicate) {
              toast.error("Error: El número de JVPE ya está registrado en el sistema.");
              return;
          }
      }
      // ----------------------------------------------------------------

      // 2. Limpieza CRÍTICA: Preparamos solo los datos obligatorios
      const userData = {
        name: formData.name,
        email: formData.email,
        dui: formData.dui,
        phone: formData.phone,
        hiringDate: new Date(formData.hiringDate),
        isNurse: formData.role === ROLES.ASSISTANT ? formData.isNurse : false,
      };

      if (formData.address && formData.address.trim() !== "") userData.address = formData.address;
      if (formData.role === ROLES.DOCTOR && formData.jvpm && formData.jvpm.trim() !== "") userData.jvpm = formData.jvpm;
      if (formData.role === ROLES.ASSISTANT && formData.isNurse && formData.jvpe && formData.jvpe.trim() !== "") userData.jvpe = formData.jvpe;

      if (editingUser) {
        // --- EDITAR USUARIO ---
        const { error: updateErr } = await authClient.admin.updateUser({ 
            userId: editingUser.id, 
            data: userData 
        });
        
        if (updateErr) { 
            toast.error(updateErr.message); 
            return; 
        }

        if (formData.role !== editingUser.role) {
          await authClient.admin.setRole({ userId: editingUser.id, role: formData.role });
        }
        if (formData.password) {
          await authClient.admin.setUserPassword({ userId: editingUser.id, newPassword: formData.password });
        }
        toast.success("Empleado actualizado.");
      } else {
        // --- CREAR USUARIO ---
        const { error: createErr } = await authClient.admin.createUser({ 
            name: userData.name, 
            email: userData.email, 
            password: formData.password, 
            role: formData.role,
            data: {
                dui: userData.dui, 
                phone: userData.phone, 
                address: userData.address, 
                hiringDate: userData.hiringDate, 
                isNurse: userData.isNurse, 
                jvpm: userData.jvpm, 
                jvpe: userData.jvpe
            }
        });
        
        if (createErr) { 
            toast.error(createErr.message); 
            return; 
        }

        toast.success("Empleado registrado con éxito.");
      }
      
      setShowForm(false);
      fetchUsers();
    });
  };

  const currentSession = authClient.useSession();
  const currentUserId = currentSession.data?.user?.id;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Gestión del personal</span>
          <h1 className="page-header__heading">Administrar usuarios</h1>
          <p className="page-header__sub">
            Empleados de la clínica, roles, credenciales y estado.
          </p>
        </div>
        <div className="page-header__actions">
          <button onClick={handleOpenNew} className="btn btn-primary" disabled={isPending}>
            <i className="ri-user-add-line"></i> Nuevo empleado
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Contacto</th>
                <th>Rol / JV</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => {
                const isActive = !user.banned;
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{user.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                        DUI: {user.dui || "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.88rem", fontFamily: "var(--font-mono)", color: "var(--fg-secondary)" }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>Tel: {user.phone || "—"}</div>
                    </td>
                    <td>
                      <div>{ROLE_LABELS[user.role] ?? user.role}</div>
                      {user.role === ROLES.DOCTOR && user.jvpm && (
                        <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>JVPM: {user.jvpm}</div>
                      )}
                      {user.isNurse && user.jvpe && (
                        <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>JVPE: {user.jvpe}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isActive ? "badge-success" : "badge-danger"} badge-dot`}>
                        {isActive ? "Activo" : "Inhabilitado"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                        <button onClick={() => handleEdit(user)} className="btn btn-ghost btn-sm">
                          <i className="ri-edit-2-line"></i> Editar
                        </button>
                        {user.id !== currentUserId && (
                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`btn btn-sm ${isActive ? "btn-danger" : "btn-secondary"}`}
                          >
                            {isActive ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); setShowPassword(false); }}
        title={editingUser ? "Editar empleado" : "Registrar nuevo empleado"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-input" {...register("name")} />
                {errors.name && <span className="field-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input type="email" className="form-input" {...register("email")} />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{editingUser ? "Nueva contraseña" : "Contraseña *"}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: "2.5rem", width: "100%" }}
                    placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mín. 6 caracteres"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "1.05rem" }}></i>
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Rol del sistema *</label>
                <select className="form-input" {...register("role")}>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">DUI *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00000000-0"
                  {...register("dui", { onChange: (e) => (e.target.value = formatDui(e.target.value)) })}
                />
                {errors.dui && <span className="field-error">{errors.dui.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0000-0000"
                  {...register("phone", { onChange: (e) => (e.target.value = formatPhone(e.target.value)) })}
                />
                {errors.phone && <span className="field-error">{errors.phone.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de contratación *</label>
                <input type="date" className="form-input" {...register("hiringDate")} />
                {errors.hiringDate && <span className="field-error">{errors.hiringDate.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Dirección (opcional)</label>
                <input type="text" className="form-input" {...register("address")} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
              {selectedRole === ROLES.DOCTOR && (
                <div className="form-group">
                  <label className="form-label">Número de JVPM *</label>
                  <input type="text" className="form-input" placeholder="Ej. 12345" {...register("jvpm")} />
                  {errors.jvpm && <span className="field-error">{errors.jvpm.message}</span>}
                </div>
              )}
              {selectedRole === ROLES.ASSISTANT && (
                <>
                  <div
                    className="form-group"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", alignSelf: "end" }}
                  >
                    <input
                      type="checkbox"
                      {...register("isNurse")}
                      id="nurseCheck"
                      style={{ cursor: "pointer", width: "1.1rem", height: "1.1rem", accentColor: "var(--brand)" }}
                    />
                    <label htmlFor="nurseCheck" className="form-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                      ¿Es enfermera/o?
                    </label>
                  </div>
                  {isNurseChecked && (
                    <div className="form-group">
                      <label className="form-label">Número de JVPE *</label>
                      <input type="text" className="form-input" placeholder="Ej. 12345" {...register("jvpe")} />
                      {errors.jvpe && <span className="field-error">{errors.jvpe.message}</span>}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setEditingUser(null); setShowPassword(false); }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? "Procesando…" : editingUser ? "Actualizar empleado" : "Registrar empleado"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};