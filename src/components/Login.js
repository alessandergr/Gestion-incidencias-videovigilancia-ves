import { useState } from "react";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (evento) => {
    evento.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      onLogin({
        token: datos.token,
        usuario: datos.usuario,
      });
    } catch (error) {
      setMensaje(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pagina-login">
      <form className="login" onSubmit={iniciarSesion}>
        <span className="marca">SRIVES</span>
        <h1>Iniciar sesión</h1>

        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          placeholder="Ingresa tu usuario"
          autoComplete="username"
        />

        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          type="password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          placeholder="Ingresa tu contraseña"
          autoComplete="current-password"
        />

        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        <button className="boton-principal" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

export default Login;