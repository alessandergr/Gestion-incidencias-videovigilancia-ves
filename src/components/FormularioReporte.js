import { useEffect, useState } from "react";
import DatosOperador from "./DatosOperador";

function obtenerFecha() {
  return new Date().toISOString().slice(0, 10);
}

function obtenerHora() {
  const fecha = new Date();

  return `${String(fecha.getHours()).padStart(2, "0")}:${String(
    fecha.getMinutes()
  ).padStart(2, "0")}`;
}

function FormularioReporte({ camara, cuenta }) {
  const [operador, setOperador] = useState(null);

  const [formulario, setFormulario] = useState({
    fecha: obtenerFecha(),
    horaVista: obtenerHora(),
    horaIntervenida: "",
    horaFinalizada: "",
    tipo: "",
    descripcion: "",
    ubicacion: "",
    latitud: "",
    longitud: "",
    unidadTipo: "SIN_UNIDAD",
    placaUnidad: "",
    megafono: "NO",
    detalleIntervencion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!camara) return;

    setFormulario((anterior) => ({
      ...anterior,
      ubicacion: camara.ubicacion || "",
      latitud: camara.latitud || "",
      longitud: camara.longitud || "",
    }));

    setMensaje("");
  }, [camara]);

  if (!camara) return null;

  const cambiar = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const requierePlaca =
    formulario.unidadTipo === "ECO" ||
    formulario.unidadTipo === "AGUILA";

  const registrarReporte = async (evento) => {
    evento.preventDefault();
    setMensaje("");

    if (!operador) {
      setMensaje("Busca el DNI del operador.");
      return;
    }

    if (
      !formulario.fecha ||
      !formulario.horaVista ||
      !formulario.tipo ||
      !formulario.descripcion.trim() ||
      !formulario.ubicacion.trim() ||
      !formulario.latitud ||
      !formulario.longitud ||
      !formulario.detalleIntervencion.trim()
    ) {
      setMensaje("Completa los campos obligatorios.");
      return;
    }

    if (requierePlaca && !formulario.placaUnidad.trim()) {
      setMensaje("Ingresa la placa de la unidad.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3001/api/reportes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camara_id: camara.id,
            usuario_id: cuenta.id,
            operador_id: operador.id,
            fecha: formulario.fecha,
            hora_vista: formulario.horaVista,
            hora_intervenida: formulario.horaIntervenida,
            hora_finalizada: formulario.horaFinalizada,
            tipo: formulario.tipo,
            descripcion: formulario.descripcion,
            ubicacion_hecho: formulario.ubicacion,
            latitud: formulario.latitud,
            longitud: formulario.longitud,
            unidad_tipo: formulario.unidadTipo,
            placa_unidad: requierePlaca
              ? formulario.placaUnidad
              : "",
            intervencion_megafono:
              formulario.megafono === "SI",
            detalle_intervencion:
              formulario.detalleIntervencion,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      setMensaje(
        `Reporte ${datos.reporte.codigo} registrado como pendiente.`
      );

      setFormulario((anterior) => ({
        ...anterior,
        horaIntervenida: "",
        horaFinalizada: "",
        tipo: "",
        descripcion: "",
        unidadTipo: "SIN_UNIDAD",
        placaUnidad: "",
        megafono: "NO",
        detalleIntervencion: "",
      }));
    } catch (error) {
      setMensaje(
        error.message || "No se pudo registrar el reporte."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="bloque formulario" onSubmit={registrarReporte}>
      <div className="titulo-bloque">
        <h2>Nuevo reporte</h2>
        <span>PENDIENTE</span>
      </div>

      <DatosOperador
        operador={operador}
        onEncontrado={setOperador}
      />

      <h3>Fecha y horas</h3>

      <div className="cuadricula cuatro">
        <Campo texto="Fecha">
          <input
            type="date"
            value={formulario.fecha}
            onChange={(e) => cambiar("fecha", e.target.value)}
          />
        </Campo>

        <Campo texto="Hora vista">
          <input
            type="time"
            value={formulario.horaVista}
            onChange={(e) => cambiar("horaVista", e.target.value)}
          />
        </Campo>

        <Campo texto="Hora intervenida">
          <input
            type="time"
            value={formulario.horaIntervenida}
            onChange={(e) =>
              cambiar("horaIntervenida", e.target.value)
            }
          />
        </Campo>

        <Campo texto="Hora finalizada">
          <input
            type="time"
            value={formulario.horaFinalizada}
            onChange={(e) =>
              cambiar("horaFinalizada", e.target.value)
            }
          />
        </Campo>
      </div>

      <h3>Incidencia</h3>

      <div className="cuadricula dos">
        <Campo texto="Tipo de incidencia">
          <select
            value={formulario.tipo}
            onChange={(e) => cambiar("tipo", e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="Accidente de tránsito">
              Accidente de tránsito
            </option>
            <option value="Robo">Robo</option>
            <option value="Pelea">Pelea</option>
            <option value="Vehículo sospechoso">
              Vehículo sospechoso
            </option>
            <option value="Otro">Otro</option>
          </select>
        </Campo>

        <Campo texto="Ubicación exacta">
          <input
            value={formulario.ubicacion}
            onChange={(e) =>
              cambiar("ubicacion", e.target.value)
            }
          />
        </Campo>
      </div>

      <Campo texto="Descripción de la incidencia">
        <textarea
          value={formulario.descripcion}
          onChange={(e) =>
            cambiar("descripcion", e.target.value)
          }
          placeholder="Describe lo ocurrido"
          maxLength={300}
        />
      </Campo>

      <div className="cuadricula dos">
        <Campo texto="Latitud de Google Maps">
          <input
            value={formulario.latitud}
            onChange={(e) => cambiar("latitud", e.target.value)}
          />
        </Campo>

        <Campo texto="Longitud de Google Maps">
          <input
            value={formulario.longitud}
            onChange={(e) => cambiar("longitud", e.target.value)}
          />
        </Campo>
      </div>

      <h3>Intervención</h3>

      <div className="cuadricula tres">
        <Campo texto="Unidad de apoyo">
          <select
            value={formulario.unidadTipo}
            onChange={(e) => {
              cambiar("unidadTipo", e.target.value);

              if (
                e.target.value !== "ECO" &&
                e.target.value !== "AGUILA"
              ) {
                cambiar("placaUnidad", "");
              }
            }}
          >
            <option value="SIN_UNIDAD">Sin unidad</option>
            <option value="ECO">ECO</option>
            <option value="AGUILA">Águila</option>
            <option value="AMBULANCIA">Ambulancia</option>
          </select>
        </Campo>

        {requierePlaca && (
          <Campo texto="Placa de la unidad">
            <input
              value={formulario.placaUnidad}
              onChange={(e) =>
                cambiar(
                  "placaUnidad",
                  e.target.value.toUpperCase()
                )
              }
              placeholder="ABC-123"
            />
          </Campo>
        )}

        <Campo texto="Intervención por megáfono">
          <select
            value={formulario.megafono}
            onChange={(e) =>
              cambiar("megafono", e.target.value)
            }
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>
        </Campo>
      </div>

      <Campo texto="Detalle de la intervención">
        <textarea
          value={formulario.detalleIntervencion}
          onChange={(e) =>
            cambiar("detalleIntervencion", e.target.value)
          }
          placeholder="Indica cómo fue atendida la incidencia"
          maxLength={300}
        />
      </Campo>

      {mensaje && (
        <p className="mensaje-formulario">{mensaje}</p>
      )}

      <button
        className="boton-principal boton-guardar"
        disabled={guardando}
      >
        {guardando ? "Guardando..." : "Registrar reporte"}
      </button>
    </form>
  );
}

function Campo({ texto, children }) {
  return (
    <label className="campo">
      <span>{texto}</span>
      {children}
    </label>
  );
}

export default FormularioReporte;