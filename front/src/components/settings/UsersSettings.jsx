import { useEffect, useState } from "react";
import { usersService } from "./usersService";
import "./usersSettings.css";
import "./usersSettingsView.css";

const EMPTY_USER = { nombre: "", email: "", password: "", rol: "vendedor", activo: true };
const ROLE_LABELS = { admin: "Administración", almacen: "Almacén", vendedor: "Comercial", owner: "Owner" };

function UserFields({ value, onChange, includePassword = false, saving = false }) {
  return <>
    <label>Nombre<input className="form-control" name="nombre" value={value.nombre} onChange={onChange} minLength="2" maxLength="150" required disabled={saving} /></label>
    <label>Email<input className="form-control" type="email" name="email" value={value.email} onChange={onChange} maxLength="150" required disabled={saving} /></label>
    <label>Rol<select className="form-select" name="rol" value={value.rol} onChange={onChange} disabled={saving}>
      <option value="admin">Administración</option><option value="almacen">Almacén</option><option value="vendedor">Comercial</option>
    </select></label>
    {includePassword && <label>Contraseña inicial<input className="form-control" type="password" name="password" value={value.password} onChange={onChange} minLength="6" maxLength="128" required disabled={saving} /></label>}
  </>;
}

export default function UsersSettings() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await usersService.list()); setError(""); }
    catch (failure) { setError(failure.message || "No se pudieron cargar los usuarios"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadUsers(); }, []);

  const change = (setter) => (event) => {
    const { name, value, type, checked } = event.target;
    setter((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await usersService.create(newUser);
      setNewUser(EMPTY_USER);
      setIsCreateOpen(false);
      setNotice("Usuario creado correctamente.");
      await loadUsers();
    } catch (failure) { setError(failure.message || "No se pudo crear el usuario"); }
    finally { setSaving(false); }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true); setError("");
    try {
      const { id, nombre, email, rol, activo } = editingUser;
      await usersService.update(id, { nombre, email, rol, activo });
      setEditingUser(null);
      setNotice("Usuario actualizado correctamente.");
      await loadUsers();
    } catch (failure) { setError(failure.message || "No se pudo actualizar el usuario"); }
    finally { setSaving(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true); setError("");
    try {
      await usersService.resetPassword(editingUser.id, newPassword);
      setNewPassword("");
      setNotice("Contraseña restablecida correctamente.");
    } catch (failure) { setError(failure.message || "No se pudo restablecer la contraseña"); }
    finally { setSaving(false); }
  };

  const closeUserModal = () => {
    if (saving) return;
    setEditingUser(null);
    setResettingUser(null);
    setNewPassword("");
  };

  return <main className="users-settings-page">
    <header className="users-settings-header"><div><p className="users-settings-eyebrow">Configuración</p><h1>Usuarios y permisos</h1><p>Gestiona las cuentas de tu empresa y el acceso de cada equipo.</p></div><button type="button" className="btn btn-success" onClick={() => { setError(""); setIsCreateOpen(true); }}>Nuevo usuario</button></header>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {notice && <div className="alert alert-success" role="status">{notice}<button type="button" className="btn-close float-end" aria-label="Cerrar" onClick={() => setNotice("")} /></div>}
    <section className="users-settings-card users-list-card"><div className="users-card-title"><div><h2>Usuarios de la empresa</h2><p>{loading ? "Cargando…" : `${users.length} usuario${users.length === 1 ? "" : "s"}`}</p></div><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void loadUsers()} disabled={loading}>Actualizar</button></div>
      <div className="table-responsive"><table className="table align-middle mb-0 users-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="users-empty">Cargando usuarios…</td></tr> : users.map((user) => <tr key={user.id} className={user.rol === "owner" ? "" : "users-table-row"} onClick={() => user.rol !== "owner" && setEditingUser({ ...user, activo: Boolean(user.activo) })}><td><strong>{user.nombre}</strong><small>{user.email}</small></td><td><span className={`users-role users-role-${user.rol}`}>{ROLE_LABELS[user.rol] || user.rol}</span></td><td><span className={`users-status${user.activo ? " is-active" : ""}`}>{user.activo ? "Activo" : "Inactivo"}</span></td><td className="users-actions">{user.rol === "owner" ? <span className="text-muted small">Protegido</span> : <button type="button" className="btn btn-sm btn-outline-primary" onClick={(event) => { event.stopPropagation(); setEditingUser({ ...user, activo: Boolean(user.activo) }); }}>Ver y editar</button>}</td></tr>)}</tbody></table></div>
    </section>

    {isCreateOpen && <div className="users-modal-backdrop" role="presentation" onMouseDown={() => !saving && setIsCreateOpen(false)}><section className="users-modal-card" role="dialog" aria-modal="true" aria-labelledby="user-create-title" onMouseDown={(event) => event.stopPropagation()}><header className="users-modal-header"><div><p>Configuración</p><h2 id="user-create-title">Nuevo usuario</h2></div><button type="button" className="users-modal-close" aria-label="Cerrar" onClick={() => !saving && setIsCreateOpen(false)}>×</button></header><form className="users-modal-form" onSubmit={createUser}><UserFields value={newUser} onChange={change(setNewUser)} includePassword saving={saving} /><footer className="users-modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setIsCreateOpen(false)} disabled={saving}>Cancelar</button><button className="btn btn-success" disabled={saving}>{saving ? "Guardando…" : "Crear usuario"}</button></footer></form></section></div>}

    {editingUser && <div className="users-modal-backdrop" role="presentation" onMouseDown={closeUserModal}><section className="users-modal-card" role="dialog" aria-modal="true" aria-labelledby="user-edit-title" onMouseDown={(event) => event.stopPropagation()}><header className="users-modal-header"><div><p>Usuario</p><h2 id="user-edit-title">{editingUser.nombre}</h2><span className={`users-role users-role-${editingUser.rol}`}>{ROLE_LABELS[editingUser.rol]}</span></div><button type="button" className="users-modal-close" aria-label="Cerrar" onClick={closeUserModal}>×</button></header><form className="users-modal-form" onSubmit={saveUser}><UserFields value={editingUser} onChange={change(setEditingUser)} saving={saving} /><label className="users-active"><input type="checkbox" name="activo" checked={Boolean(editingUser.activo)} onChange={change(setEditingUser)} disabled={saving} /> Cuenta activa</label><footer className="users-modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeUserModal} disabled={saving}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></footer></form><section className="users-password-section"><div><h3>Restablecer contraseña</h3><p>Establece una nueva contraseña de acceso para este usuario.</p></div><form className="users-password-form" onSubmit={resetPassword}><input className="form-control" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nueva contraseña" minLength="6" maxLength="128" required disabled={saving} /><button className="btn btn-outline-primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Restablecer"}</button></form></section></section></div>}
  </main>;
}
