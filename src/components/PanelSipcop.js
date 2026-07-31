import Encabezado from "./Encabezado";

function PanelSipcop({ sesion, onSalir }) {
  return (
    <div className="aplicacion">
      <Encabezado usuario={sesion.usuario} onSalir={onSalir} />

      <main className="contenido">
        <section className="bloque estado-vacio">
          Los reportes pendientes aparecerán aquí en el Sprint 3.
        </section>
      </main>
    </div>
  );
}

export default PanelSipcop;