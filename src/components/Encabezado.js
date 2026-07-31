function Encabezado({ usuario, onSalir }) {
  return (
    <header className="encabezado">
      <span className="marca">SRIVES</span>

      <div className="datos-sesion">
        <div>
          <strong>Cuenta de estación</strong>
          <span>
            {usuario.usuario} · {usuario.rol}
          </span>
        </div>

        <button className="boton-salir" onClick={onSalir}>
          Salir
        </button>
      </div>
    </header>
  );
}

export default Encabezado;