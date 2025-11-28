import { useEffect, useState } from "react";

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:3000"); // asumir token ya enviado
    const data = await res.json();
    setUsers(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mt-5 " style={{ maxWidth: "400px" }}>
      <h3 className="mb-4 text-center">Iniciar Sesión</h3>
      <form className="" onSubmit={handleSubmit}>
        {/* Usuario */}
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Usuario
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            name="username"
            placeholder="Usuario"
            onChange={handleChange}
          />
        </div>

        {/* Contraseña */}
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Contraseña
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            placeholder="Contraseña"
            onChange={handleChange}
          />
        </div>

        {/* Rol */}
        <div className="mb-3 ">
          <label htmlFor="role" className="form-label">
            Rol
          </label>
          <select
            className="form-select"
            id="role"
            name="role"
            onChange={handleChange}
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Botón */}
        <button type="submit" className="btn btn-primary w-100">
          Iniciar sesion
        </button>
      </form>
    </div>
  );
};

export default UsersManager;
