import { useState } from "react";
import "./App.css";

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const [sesion, setSesion] = useState(() => {
    const datos = localStorage.getItem("sesionSrives");
    return datos ? JSON.parse(datos) : null;
  });

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
        body: JSON.stringify({
          usuario,
          contrasena,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      const nuevaSesion = {
        token: datos.token,
        usuario: datos.usuario,
      };

      localStorage.setItem("sesionSrives", JSON.stringify(nuevaSesion));
      setSesion(nuevaSesion);
    } catch (error) {
      setMensaje(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("sesionSrives");
    setSesion(null);
    setUsuario("");
    setContrasena("");
  };

  if (sesion) {
    return (
      <main className="pagina">
        <section className="panel">
          <header className="panel-header">
            <span className="logo">SRIVES</span>

            <button className="boton-secundario" onClick={cerrarSesion}>
              Salir
            </button>
          </header>

          <div className="panel-contenido">
            <span className="rol">{sesion.usuario.rol}</span>

            <h1>Hola, {sesion.usuario.nombre}</h1>

            <p>
              {sesion.usuario.rol === "OPERADOR"
                ? "Panel del operador."
                : "Panel de validación."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pagina">
      <form className="login" onSubmit={iniciarSesion}>
        <div className="login-header">
          <span className="logo">SRIVES</span>
          <h1>Iniciar sesión</h1>
        </div>

        <label htmlFor="usuario">Usuario</label>

        <input
          id="usuario"
          type="text"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          placeholder="Usuario"
          autoComplete="username"
        />

        <label htmlFor="contrasena">Contraseña</label>

        <input
          id="contrasena"
          type="password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
        />

        {mensaje && <p className="error">{mensaje}</p>}

        <button className="boton-principal" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

export default App;