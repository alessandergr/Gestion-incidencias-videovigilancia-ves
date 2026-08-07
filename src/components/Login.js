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
      const respuesta = await fetch(
        "http://localhost:3001/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario,
            contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      onLogin({
        token: datos.token,
        usuario: datos.usuario,
      });
    } catch (error) {
      setMensaje(
        error.message || "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pagina-login">
      <form className="login" onSubmit={iniciarSesion}>
        <div className="marca-login">
          <svg
            className="logo-login"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M24 4L39 10V21C39 31.5 32.8 39.3 24 44C15.2 39.3 9 31.5 9 21V10L24 4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx="24"
              cy="22"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />

            <circle
              cx="24"
              cy="22"
              r="2"
              fill="currentColor"
            />
          </svg>

          <span>Villa El Salvador</span>
        </div>

        <h1>Iniciar sesión</h1>

        <label htmlFor="usuario">Usuario</label>

        <input
          id="usuario"
          value={usuario}
          onChange={(evento) =>
            setUsuario(evento.target.value)
          }
          placeholder="Ingresa tu usuario"
          autoComplete="username"
        />

        <label htmlFor="contrasena">
          Contraseña
        </label>

        <input
          id="contrasena"
          type="password"
          value={contrasena}
          onChange={(evento) =>
            setContrasena(evento.target.value)
          }
          placeholder="Ingresa tu contraseña"
          autoComplete="current-password"
        />

        {mensaje && (
          <p className="mensaje-error">
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          className="boton-principal"
          disabled={cargando}
        >
          {cargando
            ? "Ingresando..."
            : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

export default Login;