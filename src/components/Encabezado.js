function Encabezado({ usuario, onSalir }) {
  return (
    <header className="encabezado">
      <div className="marca-app">
  <svg
    className="logo-encabezado"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      d="M24 4L39 10V21C39 31.5 32.8 39.3 24 44C15.2 39.3 9 31.5 9 21V10L24 4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle
      cx="24"
      cy="22"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />

    <circle
      cx="24"
      cy="22"
      r="2"
      fill="currentColor"
    />
  </svg>

  <span>VES</span>
</div>

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