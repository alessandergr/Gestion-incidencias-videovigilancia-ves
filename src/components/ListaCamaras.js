function ListaCamaras({ camaras, seleccionada, onSeleccionar }) {
  return (
    <section className="bloque">
      <div className="titulo-bloque">
        <h2>Cámaras</h2>
        <span>{camaras.length}</span>
      </div>

      <div className="lista-camaras">
        {camaras.map((camara) => (
          <button
            key={camara.id}
            type="button"
            className={`camara ${
              seleccionada?.id === camara.id ? "activa" : ""
            }`}
            onClick={() => onSeleccionar(camara)}
          >
            <div>
              <strong>{camara.codigo}</strong>
              <span>{camara.ubicacion}</span>
            </div>

            <small>{camara.estado}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ListaCamaras;