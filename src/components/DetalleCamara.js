function DetalleCamara({ camara }) {
  if (!camara) {
    return (
      <section className="bloque estado-vacio">
        Selecciona una cámara para continuar.
      </section>
    );
  }

  return (
    <section className="bloque">
      <div className="titulo-bloque">
        <h2>Cámara seleccionada</h2>
      </div>

      <div className="detalle-camara">
        <div>
          <span>Código</span>
          <strong>{camara.codigo}</strong>
        </div>

        <div>
          <span>Ubicación registrada</span>
          <strong>{camara.ubicacion}</strong>
        </div>

        <div>
          <span>Latitud registrada</span>
          <strong>{camara.latitud}</strong>
        </div>

        <div>
          <span>Longitud registrada</span>
          <strong>{camara.longitud}</strong>
        </div>
      </div>
    </section>
  );
}

export default DetalleCamara;