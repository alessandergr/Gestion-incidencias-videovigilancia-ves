import { useState } from "react";
import Encabezado from "./Encabezado";
import ListaReportes from "./ListaReportes";

function PanelSipcop({ sesion, onSalir }) {
  const [vista, setVista] = useState("pendientes");

  return (
    <div className="aplicacion">
      <Encabezado
        usuario={sesion.usuario}
        onSalir={onSalir}
      />

      <nav className="menu-operador">
        <button
          type="button"
          className={
            vista === "pendientes" ? "seleccionado" : ""
          }
          onClick={() => setVista("pendientes")}
        >
          Reportes pendientes
        </button>

        <button
          type="button"
          className={
            vista === "historial" ? "seleccionado" : ""
          }
          onClick={() => setVista("historial")}
        >
          Historial
        </button>
      </nav>

      <main className="contenido">
        {vista === "pendientes" ? (
          <ListaReportes
            rol="SIPCOP"
            token={sesion.token}
            titulo="Reportes pendientes"
            filtroEstado="PENDIENTE"
            mensajeVacio="No hay reportes pendientes por revisar."
          />
        ) : (
          <ListaReportes
            rol="SIPCOP"
            token={sesion.token}
            titulo="Historial de reportes"
            filtroEstado="VALIDADO,DESCARTADO"
            mensajeVacio="Todavía no hay reportes procesados."
          />
        )}
      </main>
    </div>
  );
}

export default PanelSipcop;