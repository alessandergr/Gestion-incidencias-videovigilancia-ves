import Encabezado from "./Encabezado";
import ListaReportes from "./ListaReportes";

function PanelSipcop({ sesion, onSalir }) {
  return (
    <div className="aplicacion">
      <Encabezado
        usuario={sesion.usuario}
        onSalir={onSalir}
      />

      <main className="contenido">
        <ListaReportes
          rol="SIPCOP"
          token={sesion.token}
          titulo="Reportes pendientes"
          filtroEstado="PENDIENTE"
          mensajeVacio="No hay reportes pendientes por revisar."
        />
      </main>
    </div>
  );
}

export default PanelSipcop;