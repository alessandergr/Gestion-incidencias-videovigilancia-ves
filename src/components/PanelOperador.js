import { useEffect, useState } from "react";
import Encabezado from "./Encabezado";
import ListaCamaras from "./ListaCamaras";
import DetalleCamara from "./DetalleCamara";
import FormularioReporte from "./FormularioReporte";

function PanelOperador({ sesion, onSalir }) {
  const [camaras, setCamaras] = useState([]);
  const [camaraSeleccionada, setCamaraSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState("Cargando cámaras...");

  useEffect(() => {
    const consultarCamaras = async () => {
      try {
        const respuesta = await fetch("http://localhost:3001/api/camaras");
        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje);
        }

        setCamaras(datos.camaras);
        setMensaje("");
      } catch (error) {
        setMensaje(error.message || "No se pudieron cargar las cámaras.");
      }
    };

    consultarCamaras();
  }, []);

  return (
    <div className="aplicacion">
      <Encabezado usuario={sesion.usuario} onSalir={onSalir} />

      <main className="contenido">
        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        <div className="distribucion">
          <ListaCamaras
            camaras={camaras}
            seleccionada={camaraSeleccionada}
            onSeleccionar={setCamaraSeleccionada}
          />

          <div className="columna-principal">
            <DetalleCamara camara={camaraSeleccionada} />

            <FormularioReporte
            camara={camaraSeleccionada}
            cuenta={sesion.usuario}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default PanelOperador;