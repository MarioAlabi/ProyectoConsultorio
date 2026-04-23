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
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Administrar Usuarios</h1>
          <p style={{ color: "#4b5563", margin: "0.5rem 0 0 0" }}>Gestión administrativa de los empleados de la clínica.</p>
        </div>
        <button onClick={handleOpenNew} className="submit-btn" style={{ margin: 0, padding: "0.75rem 1.5rem" }} disabled={isPending}>+ Nuevo Empleado</button>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr style={{ color: "#4b5563", fontSize: "0.9rem" }}>
              <th style={{ padding: "1.2rem 1.5rem" }}>Nombre / DUI</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Contacto</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Rol / JV</th>
              <th style={{ padding: "1.2rem 1.5rem" }}>Estado</th>
              <th style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => {
              const isActive = !user.banned;
              return (
                <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "1.2rem 1.5rem" }}>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>DUI: {user.dui || "N/A"}</div>
                  </td>
                  <td style={{ padding: "1.2rem 1.5rem" }}>
                    <div style={{ fontSize: "0.9rem" }}>{user.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Tel: {user.phone || "---"}</div>
                  </td>
                  <td style={{ padding: "1.2rem 1.5rem", color: "#6b7280" }}>
                    <div>{ROLE_LABELS[user.role] ?? user.role}</div>
                    {user.role === ROLES.DOCTOR && user.jvpm && <div style={{ fontSize: "0.8rem" }}>JVPM: {user.jvpm}</div>}
                    {user.isNurse && user.jvpe && <div style={{ fontSize: "0.8rem" }}>JVPE: {user.jvpe}</div>}
                  </td>
                  <td style={{ padding: "1.2rem 1.5rem" }}>
                    <span style={{ backgroundColor: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#166534" : "#991b1b", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>{isActive ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>
                    <button onClick={() => handleEdit(user)} className="doc-btn" style={{ marginRight: "0.5rem" }}>Editar</button>
                    {user.id !== currentUserId && (
                        <button onClick={() => handleToggleBan(user)} style={{ color: isActive ? "#ef4444" : "#10b981", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                            {isActive ? "Desactivar" : "Activar"}
                        </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingUser(null); setShowPassword(false); }} title={editingUser ? "Editar Empleado" : "Registrar Nuevo Empleado"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="form-group"><label className="form-label">Nombre Completo *</label><input type="text" className="form-input" {...register("name")} />{errors.name && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.name.message}</span>}</div>
            <div className="form-group"><label className="form-label">Correo Electrónico *</label><input type="email" className="form-input" {...register("email")} />{errors.email && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.email.message}</span>}</div>
            
            {/* --- CONTRASEÑA CON BOTÓN DE MOSTRAR/OCULTAR --- */}
            <div className="form-group">
                <label className="form-label">{editingUser ? "Nueva Contraseña" : "Contraseña *"}</label>
                <div style={{ position: "relative" }}>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-input" 
                        style={{ paddingRight: "2.5rem" }} // Deja espacio para el botón
                        placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mín. 6 caracteres"} 
                        {...register("password")} 
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1" // Evita que se enfoque con Tab cuando se está escribiendo
                        style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, display: "flex", alignItems: "center" }}
                    >
                        {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                    </button>
                </div>
                {errors.password && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.password.message}</span>}
            </div>

            <div className="form-group"><label className="form-label">Rol del Sistema *</label><select className="form-input" {...register("role")} style={{ backgroundColor: "white" }}>{Object.entries(ROLE_LABELS).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}</select></div>

            <div className="form-group"><label className="form-label">DUI (00000000-0) *</label><input type="text" className="form-input" placeholder="00000000-0" {...register("dui", { onChange: (e) => e.target.value = formatDui(e.target.value) })} />{errors.dui && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.dui.message}</span>}</div>
            <div className="form-group"><label className="form-label">Teléfono *</label><input type="text" className="form-input" placeholder="0000-0000" {...register("phone", { onChange: (e) => e.target.value = formatPhone(e.target.value) })} />{errors.phone && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.phone.message}</span>}</div>
            <div className="form-group"><label className="form-label">Fecha de Contratación *</label><input type="date" className="form-input" {...register("hiringDate")} />{errors.hiringDate && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.hiringDate.message}</span>}</div>
            <div className="form-group"><label className="form-label">Dirección (Opcional)</label><input type="text" className="form-input" {...register("address")} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
            {selectedRole === ROLES.DOCTOR && (
                <div className="form-group">
                    <label className="form-label">Número de JVPM *</label>
                    <input type="text" className="form-input" placeholder="Ej. 12345" {...register("jvpm")} />
                    {errors.jvpm && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.jvpm.message}</span>}
                </div>
            )}
            {selectedRole === ROLES.ASSISTANT && (
                <>
                    <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
                        <input type="checkbox" {...register("isNurse")} id="nurseCheck" style={{ cursor: "pointer", width: "1.2rem", height: "1.2rem" }} />
                        <label htmlFor="nurseCheck" className="form-label" style={{ marginBottom: 0, cursor: "pointer" }}>¿Es Enfermera/o?</label>
                    </div>
                    {isNurseChecked && (
                        <div className="form-group">
                            <label className="form-label">Número de JVPE *</label>
                            <input type="text" className="form-input" placeholder="Ej. 12345" {...register("jvpe")} />
                            {errors.jvpe && <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{errors.jvpe.message}</span>}
                        </div>
                    )}
                </>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={isPending} style={{ marginTop: "1.5rem" }}>{isPending ? "Procesando..." : editingUser ? "Actualizar Empleado" : "Registrar Empleado"}</button>
        </form>
      </Modal>
    </div>
  );
};