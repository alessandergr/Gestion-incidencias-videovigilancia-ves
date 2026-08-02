import { useEffect, useState } from "react";
import Encabezado from "./Encabezado";
import ListaCamaras from "./ListaCamaras";
import DetalleCamara from "./DetalleCamara";
import FormularioReporte from "./FormularioReporte";
import ListaReportes from "./ListaReportes";
import socket from "../socket";

function PanelOperador({ sesion, onSalir }) {
  const [vista, setVista] = useState("registro");
  const [camaras, setCamaras] = useState([]);
  const [camaraSeleccionada, setCamaraSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState("Cargando cámaras...");
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    const consultarCamaras = async () => {
      try {
        const respuesta = await fetch(
          "http://localhost:3001/api/camaras"
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje);
        }

        setCamaras(datos.camaras);
        setMensaje("");
      } catch (error) {
        setMensaje(
          error.message || "No se pudieron cargar las cámaras."
        );
      }
    };

    consultarCamaras();

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.emit("liberar-camara");
      socket.disconnect();
    };
  }, []);

  const seleccionarCamara = (camara) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("liberar-camara");

    socket.emit(
      "seleccionar-camara",
      {
        camara,
        usuario: sesion.usuario.usuario,
      },
      (respuesta) => {
        if (respuesta.coincidencia) {
          setAlerta({
            camara,
            mensaje: respuesta.mensaje,
            estacion: respuesta.estacion,
          });

          return;
        }

        setCamaraSeleccionada(camara);
        setAlerta(null);
      }
    );
  };

  const continuarRegistro = () => {
    if (!alerta) return;

    socket.emit("continuar-camara", {
      camara: alerta.camara,
      usuario: sesion.usuario.usuario,
    });

    setCamaraSeleccionada(alerta.camara);
    setAlerta(null);
  };

  const cancelarRegistro = () => {
    socket.emit("liberar-camara");
    setCamaraSeleccionada(null);
    setAlerta(null);
  };

  const cambiarVista = (nuevaVista) => {
    if (nuevaVista === "reportes") {
      socket.emit("liberar-camara");
      setCamaraSeleccionada(null);
      setAlerta(null);
    }

    setVista(nuevaVista);
  };

  const cerrarSesion = () => {
    socket.emit("liberar-camara");
    socket.disconnect();
    onSalir();
  };

  return (
    <div className="aplicacion">
      <Encabezado
        usuario={sesion.usuario}
        onSalir={cerrarSesion}
      />

      <nav className="menu-operador">
        <button
          type="button"
          className={vista === "registro" ? "seleccionado" : ""}
          onClick={() => cambiarVista("registro")}
        >
          Registrar incidencia
        </button>

        <button
          type="button"
          className={vista === "reportes" ? "seleccionado" : ""}
          onClick={() => cambiarVista("reportes")}
        >
          Consultar reportes
        </button>
      </nav>

      <main className="contenido">
        {vista === "registro" ? (
          <>
            {mensaje && (
              <p className="mensaje-error">{mensaje}</p>
            )}

            <div className="distribucion">
              <ListaCamaras
                camaras={camaras}
                seleccionada={camaraSeleccionada}
                onSeleccionar={seleccionarCamara}
              />

              <div className="columna-principal">
                <DetalleCamara
                  camara={camaraSeleccionada}
                />

                <FormularioReporte
                  camara={camaraSeleccionada}
                  cuenta={sesion.usuario}
                />
              </div>
            </div>
          </>
        ) : (
          <ListaReportes
  rol="OPERADOR"
  token={sesion.token}
/>
        )}
      </main>

      {alerta && (
        <div className="fondo-alerta">
          <section className="alerta-camara">
            <span className="alerta-etiqueta">
              Cámara en uso
            </span>

            <h2>{alerta.camara.codigo}</h2>

            <p>{alerta.mensaje}</p>

            <small>
              Cuenta conectada:{" "}
              {alerta.estacion || "Otra estación"}
            </small>

            <div className="acciones-alerta">
              <button
                type="button"
                className="boton-cancelar"
                onClick={cancelarRegistro}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="boton-continuar"
                onClick={continuarRegistro}
              >
                Continuar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PanelOperador;