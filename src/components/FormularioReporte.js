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
  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  useEffect(() => {
    if (!camara) return;

    setFormulario((anterior) => ({
      ...anterior,
      ubicacion: camara.ubicacion || "",
      latitud: camara.latitud || "",
      longitud: camara.longitud || "",
    }));

    setMensaje("");
    setMostrarConfirmacion(false);
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

  const validarFormulario = () => {
    if (!operador) {
      setMensaje("Busca el DNI del operador.");
      return false;
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
      return false;
    }

    if (requierePlaca && !formulario.placaUnidad.trim()) {
      setMensaje("Ingresa la placa de la unidad.");
      return false;
    }

    return true;
  };

  const solicitarConfirmacion = (evento) => {
    evento.preventDefault();
    setMensaje("");

    if (!validarFormulario()) {
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarRegistro = async () => {
    setGuardando(true);
    setMensaje("");

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

      setMostrarConfirmacion(false);

      setMensaje(
        `Reporte ${datos.reporte.codigo} registrado como pendiente.`
      );

      setFormulario((anterior) => ({
        ...anterior,
        fecha: obtenerFecha(),
        horaVista: obtenerHora(),
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
    <>
      <form
        className="bloque formulario"
        onSubmit={solicitarConfirmacion}
      >
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
              onChange={(e) =>
                cambiar("fecha", e.target.value)
              }
            />
          </Campo>

          <Campo texto="Hora vista">
            <input
              type="time"
              value={formulario.horaVista}
              onChange={(e) =>
                cambiar("horaVista", e.target.value)
              }
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
              onChange={(e) =>
                cambiar("tipo", e.target.value)
              }
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
              onChange={(e) =>
                cambiar("latitud", e.target.value)
              }
            />
          </Campo>

          <Campo texto="Longitud de Google Maps">
            <input
              value={formulario.longitud}
              onChange={(e) =>
                cambiar("longitud", e.target.value)
              }
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
              cambiar(
                "detalleIntervencion",
                e.target.value
              )
            }
            placeholder="Indica cómo fue atendida la incidencia"
            maxLength={300}
          />
        </Campo>

        {mensaje && (
          <p className="mensaje-formulario">{mensaje}</p>
        )}

        <button
          type="submit"
          className="boton-principal boton-guardar"
          disabled={guardando}
        >
          Registrar reporte
        </button>
      </form>

      {mostrarConfirmacion && (
        <div className="fondo-alerta">
          <section className="confirmacion-reporte">
            <span className="alerta-etiqueta">
              Confirmar registro
            </span>

            <h2>Revisa la información</h2>

            <p>
              El reporte todavía no ha sido guardado. Verifica
              los datos antes de confirmarlo.
            </p>

            <div className="resumen-confirmacion">
              <Resumen
                titulo="Cámara"
                valor={camara.codigo}
              />

              <Resumen
                titulo="Operador"
                valor={`${operador.nombre} - Grupo ${operador.grupo}`}
              />

              <Resumen
                titulo="Fecha"
                valor={formulario.fecha}
              />

              <Resumen
                titulo="Hora vista"
                valor={formulario.horaVista}
              />

              <Resumen
                titulo="Tipo"
                valor={formulario.tipo}
              />

              <Resumen
                titulo="Ubicación"
                valor={formulario.ubicacion}
              />

              <Resumen
                titulo="Descripción"
                valor={formulario.descripcion}
              />

              <Resumen
                titulo="Unidad"
                valor={
                  formulario.unidadTipo === "SIN_UNIDAD"
                    ? "Sin unidad"
                    : formulario.unidadTipo
                }
              />

              {requierePlaca && (
                <Resumen
                  titulo="Placa"
                  valor={formulario.placaUnidad}
                />
              )}

              <Resumen
                titulo="Uso de megáfono"
                valor={
                  formulario.megafono === "SI" ? "Sí" : "No"
                }
              />

              <Resumen
                titulo="Intervención"
                valor={formulario.detalleIntervencion}
              />
            </div>

            <div className="acciones-alerta">
              <button
                type="button"
                className="boton-cancelar"
                onClick={() =>
                  setMostrarConfirmacion(false)
                }
                disabled={guardando}
              >
                Regresar
              </button>

              <button
                type="button"
                className="boton-continuar"
                onClick={confirmarRegistro}
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "Confirmar registro"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
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

function Resumen({ titulo, valor }) {
  return (
    <div className="fila-resumen">
      <span>{titulo}</span>
      <p>{valor || "-"}</p>
    </div>
  );
}

export default FormularioReporte;