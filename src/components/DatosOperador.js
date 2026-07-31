import { useState } from "react";

function DatosOperador({ operador, onEncontrado }) {
  const [dni, setDni] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [buscando, setBuscando] = useState(false);

  const buscarOperador = async () => {
    setMensaje("");

    if (dni.length !== 8) {
      onEncontrado(null);
      setMensaje("El DNI debe tener 8 números.");
      return;
    }

    setBuscando(true);

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/operadores/${dni}`
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      onEncontrado(datos.operador);
    } catch (error) {
      onEncontrado(null);
      setMensaje(error.message || "No se pudo buscar al operador.");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <section className="datos-operador-seccion">
      <h3>Operador de turno</h3>

      <div className="busqueda-operador">
        <label className="campo">
          <span>DNI del operador</span>

          <input
            value={dni}
            onChange={(evento) => {
              setDni(
                evento.target.value.replace(/\D/g, "").slice(0, 8)
              );

              onEncontrado(null);
              setMensaje("");
            }}
            placeholder="8 números"
          />
        </label>

        <button
          type="button"
          className="boton-buscar"
          onClick={buscarOperador}
          disabled={buscando}
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {mensaje && <p className="mensaje-error">{mensaje}</p>}

      {operador && (
        <div className="datos-operador">
          <div>
            <span>Nombre</span>
            <strong>{operador.nombre}</strong>
          </div>

          <div>
            <span>Grupo</span>
            <strong>Grupo {operador.grupo}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default DatosOperador;