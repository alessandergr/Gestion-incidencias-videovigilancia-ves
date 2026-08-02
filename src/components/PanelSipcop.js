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
        <ListaReportes />
      </main>
    </div>
  );
}

export default PanelSipcop;