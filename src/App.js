import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const [camaras, setCamaras] = useState([]);
  const [cargandoCamaras, setCargandoCamaras] = useState(false);
  const [errorCamaras, setErrorCamaras] = useState("");
  const [camaraSeleccionada, setCamaraSeleccionada] = useState(null);

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensajeReporte, setMensajeReporte] = useState("");
  const [guardandoReporte, setGuardandoReporte] = useState(false);

  const [sesion, setSesion] = useState(() => {
    const datos = localStorage.getItem("sesionSrives");
    return datos ? JSON.parse(datos) : null;
  });

  useEffect(() => {
    if (!sesion || sesion.usuario.rol !== "OPERADOR") {
      return;
    }

    const consultarCamaras = async () => {
      setCargandoCamaras(true);
      setErrorCamaras("");

      try {
        const respuesta = await fetch("http://localhost:3001/api/camaras");
        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje);
        }

        setCamaras(datos.camaras);
      } catch (error) {
        setErrorCamaras(
          error.message || "No se pudieron cargar las cámaras."
        );
      } finally {
        setCargandoCamaras(false);
      }
    };

    consultarCamaras();
  }, [sesion]);

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

      localStorage.setItem(
        "sesionSrives",
        JSON.stringify(nuevaSesion)
      );

      setSesion(nuevaSesion);
    } catch (error) {
      setMensaje(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  const registrarReporte = async (evento) => {
    evento.preventDefault();

    setMensajeReporte("");

    if (!camaraSeleccionada || !tipo || !descripcion.trim()) {
      setMensajeReporte("Completa todos los campos.");
      return;
    }

    setGuardandoReporte(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3001/api/reportes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camara_id: camaraSeleccionada.id,
            usuario_id: sesion.usuario.id,
            tipo,
            descripcion: descripcion.trim(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      setMensajeReporte("Reporte registrado como pendiente.");
      setTipo("");
      setDescripcion("");
    } catch (error) {
      setMensajeReporte(
        error.message || "No se pudo registrar el reporte."
      );
    } finally {
      setGuardandoReporte(false);
    }
  };

  const seleccionarCamara = (camara) => {
    setCamaraSeleccionada(camara);
    setMensajeReporte("");
    setTipo("");
    setDescripcion("");
  };

  const cerrarSesion = () => {
    localStorage.removeItem("sesionSrives");

    setSesion(null);
    setUsuario("");
    setContrasena("");
    setCamaras([]);
    setCamaraSeleccionada(null);
    setTipo("");
    setDescripcion("");
    setMensajeReporte("");
  };

  if (sesion) {
    return (
      <main className="pagina">
        <section className="panel">
          <header className="panel-header">
            <span className="logo">SRIVES</span>

            <div className="usuario-header">
              <span>{sesion.usuario.nombre}</span>

              <button
                type="button"
                className="boton-secundario"
                onClick={cerrarSesion}
              >
                Salir
              </button>
            </div>
          </header>

          <div className="panel-contenido">
            <span className="rol">{sesion.usuario.rol}</span>

            {sesion.usuario.rol === "OPERADOR" ? (
              <>
                <h1>Cámaras</h1>

                <p className="texto-suave">
                  Selecciona una cámara.
                </p>

                {cargandoCamaras && <p>Cargando cámaras...</p>}

                {errorCamaras && (
                  <p className="error">{errorCamaras}</p>
                )}

                <div className="lista-camaras">
                  {camaras.map((camara) => (
                    <button
                      type="button"
                      key={camara.id}
                      className={`camara ${
                        camaraSeleccionada?.id === camara.id
                          ? "camara-seleccionada"
                          : ""
                      }`}
                      disabled={camara.estado === "INACTIVA"}
                      onClick={() => seleccionarCamara(camara)}
                    >
                      <div>
                        <strong>{camara.codigo}</strong>
                        <span>{camara.ubicacion}</span>
                      </div>

                      <span className="estado">
                        {camara.estado}
                      </span>
                    </button>
                  ))}
                </div>

                {camaraSeleccionada && (
                  <div className="seleccion">
                    <span>Cámara seleccionada</span>

                    <strong>
                      {camaraSeleccionada.codigo}
                    </strong>

                    <div className="dato-camara">
                      <span>Ubicación</span>
                      <p>{camaraSeleccionada.ubicacion}</p>
                    </div>

                    <div className="coordenadas">
                      <div className="dato-camara">
                        <span>Latitud</span>
                        <p>{camaraSeleccionada.latitud}</p>
                      </div>

                      <div className="dato-camara">
                        <span>Longitud</span>
                        <p>{camaraSeleccionada.longitud}</p>
                      </div>
                    </div>

                    <form
                      className="formulario-reporte"
                      onSubmit={registrarReporte}
                    >
                      <h2>Registrar reporte</h2>

                      <label htmlFor="tipo">
                        Tipo de incidencia
                      </label>

                      <select
                        id="tipo"
                        value={tipo}
                        onChange={(evento) =>
                          setTipo(evento.target.value)
                        }
                      >
                        <option value="">
                          Selecciona un tipo
                        </option>

                        <option value="Accidente de tránsito">
                          Accidente de tránsito
                        </option>

                        <option value="Robo">Robo</option>

                        <option value="Pelea">Pelea</option>

                        <option value="Vehículo sospechoso">
                          Vehículo sospechoso
                        </option>

                        <option value="Otro">Otro</option>
                      </select>

                      <label htmlFor="descripcion">
                        Descripción
                      </label>

                      <textarea
                        id="descripcion"
                        value={descripcion}
                        onChange={(evento) =>
                          setDescripcion(evento.target.value)
                        }
                        placeholder="Describe brevemente lo ocurrido"
                        maxLength={300}
                      />

                      {mensajeReporte && (
                        <p className="mensaje-reporte">
                          {mensajeReporte}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="boton-principal"
                        disabled={guardandoReporte}
                      >
                        {guardandoReporte
                          ? "Guardando..."
                          : "Registrar reporte"}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1>Panel SIPCOP</h1>

                <p className="texto-suave">
                  Panel de validación de reportes.
                </p>
              </>
            )}
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
          onChange={(evento) =>
            setContrasena(evento.target.value)
          }
          placeholder="Contraseña"
          autoComplete="current-password"
        />

        {mensaje && <p className="error">{mensaje}</p>}

        <button
          type="submit"
          className="boton-principal"
          disabled={cargando}
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

export default App;