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
        />
      </main>
    </div>
  );
}

export default PanelSipcop;