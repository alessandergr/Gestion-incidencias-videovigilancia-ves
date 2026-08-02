import { useEffect, useState } from "react";

function ListaReportes({
  rol,
  token,
  titulo = "Reportes registrados",
  filtroEstado = "",
  mensajeVacio = "Todavía no hay reportes registrados.",
}) {
  const esSipcop = String(rol).toUpperCase() === "SIPCOP";

  const [reportes, setReportes] = useState([]);
  const [mensaje, setMensaje] = useState("Cargando reportes...");
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] =
    useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] =
    useState(null);

  const leerRespuesta = async (respuesta) => {
    const texto = await respuesta.text();

    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        "El servidor devolvió una respuesta incorrecta. Reinicia el backend."
      );
    }
  };

  const consultarReportes = async () => {
    setCargando(true);
    setMensaje("Cargando reportes...");

    try {
      const respuesta = await fetch(
        "http://localhost:3001/api/reportes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      const estadosPermitidos = String(filtroEstado)
        .split(",")
        .map((estado) => estado.trim().toUpperCase())
        .filter(Boolean);

      const reportesFiltrados =
        estadosPermitidos.length > 0
          ? datos.reportes.filter((reporte) =>
              estadosPermitidos.includes(
                String(reporte.estado).toUpperCase()
              )
            )
          : datos.reportes;

      setReportes(reportesFiltrados);

      setMensaje(
        reportesFiltrados.length === 0 ? mensajeVacio : ""
      );
    } catch (error) {
      setMensaje(
        error.message || "No se pudieron cargar los reportes."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filtroEstado]);

  const abrirDetalle = async (id) => {
    if (!esSipcop) return;

    setCargandoDetalle(true);
    setMensaje("");

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/reportes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      setReporteSeleccionado(datos.reporte);
    } catch (error) {
      setMensaje(
        error.message || "No se pudo consultar el reporte."
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (!esSipcop || !reporteSeleccionado) return;

    const accion =
      nuevoEstado === "VALIDADO" ? "validar" : "descartar";

    const confirmado = window.confirm(
      `¿Confirmas que deseas ${accion} el reporte ${reporteSeleccionado.codigo}?`
    );

    if (!confirmado) return;

    setActualizandoEstado(true);
    setMensaje("");

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/reportes/${reporteSeleccionado.id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(datos.mensaje);
      }

      setReporteSeleccionado(null);
      await consultarReportes();
      setMensaje(datos.mensaje);
    } catch (error) {
      setMensaje(
        error.message || "No se pudo actualizar el reporte."
      );
    } finally {
      setActualizandoEstado(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const fechaTexto = String(fecha).slice(0, 10);
    const partes = fechaTexto.split("-");

    if (partes.length !== 3) {
      return fechaTexto;
    }

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return "-";

    return String(hora).slice(0, 5);
  };

  const mostrarUnidad = (unidad) => {
    if (!unidad || unidad === "SIN_UNIDAD") {
      return "Sin unidad";
    }

    if (unidad === "AGUILA") {
      return "Águila";
    }

    if (unidad === "AMBULANCIA") {
      return "Ambulancia";
    }

    return unidad;
  };

  const reportePendiente =
    String(reporteSeleccionado?.estado).toUpperCase() ===
    "PENDIENTE";

  return (
    <>
      <section className="bloque">
        <div className="titulo-bloque">
          <h2>{titulo}</h2>

          <div className="acciones-lista-reportes">
            <span>{reportes.length}</span>

            <button
              type="button"
              className="boton-actualizar"
              onClick={consultarReportes}
              disabled={cargando}
            >
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        {mensaje && <p className="estado-vacio">{mensaje}</p>}

        {reportes.length > 0 && (
          <div className="tabla-contenedor">
            <table className="tabla-reportes">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Cámara</th>
                  <th>Incidencia</th>

                  {esSipcop && <th>Operador</th>}

                  <th>Estado</th>

                  {esSipcop && <th>Acción</th>}
                </tr>
              </thead>

              <tbody>
                {reportes.map((reporte) => (
                  <tr key={reporte.id}>
                    <td>
                      <strong>{reporte.codigo}</strong>
                    </td>

                    <td>{formatearFecha(reporte.fecha)}</td>

                    <td>{reporte.camara_codigo}</td>

                    <td>{reporte.tipo}</td>

                    {esSipcop && (
                      <td>
                        {reporte.operador_nombre}

                        <small>
                          Grupo {reporte.operador_grupo}
                        </small>
                      </td>
                    )}

                    <td>
                      <span
                        className={`estado-reporte ${String(
                          reporte.estado
                        ).toLowerCase()}`}
                      >
                        {reporte.estado}
                      </span>
                    </td>

                    {esSipcop && (
                      <td>
                        <button
                          type="button"
                          className="boton-ver-detalle"
                          onClick={() =>
                            abrirDetalle(reporte.id)
                          }
                          disabled={cargandoDetalle}
                        >
                          Ver detalle
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {esSipcop && reporteSeleccionado && (
        <div className="fondo-alerta">
          <section className="detalle-reporte">
            <div className="encabezado-detalle-reporte">
              <div>
                <span className="alerta-etiqueta">
                  {reporteSeleccionado.estado}
                </span>

                <h2>{reporteSeleccionado.codigo}</h2>
              </div>

              <button
                type="button"
                className="boton-cerrar-detalle"
                onClick={() =>
                  setReporteSeleccionado(null)
                }
                disabled={actualizandoEstado}
              >
                ×
              </button>
            </div>

            <h3>Datos generales</h3>

            <div className="cuadricula-detalle">
              <Dato
                titulo="Fecha"
                valor={formatearFecha(
                  reporteSeleccionado.fecha
                )}
              />

              <Dato
                titulo="Cámara"
                valor={reporteSeleccionado.camara_codigo}
              />

              <Dato
                titulo="Tipo"
                valor={reporteSeleccionado.tipo}
              />

              <Dato
                titulo="Cuenta de registro"
                valor={reporteSeleccionado.cuenta_registro}
              />
            </div>

            <h3>Operador</h3>

            <div className="cuadricula-detalle">
              <Dato
                titulo="Nombre"
                valor={reporteSeleccionado.operador_nombre}
              />

              <Dato
                titulo="DNI"
                valor={reporteSeleccionado.operador_dni}
              />

              <Dato
                titulo="Grupo"
                valor={reporteSeleccionado.operador_grupo}
              />
            </div>

            <h3>Horas</h3>

            <div className="cuadricula-detalle">
              <Dato
                titulo="Hora vista"
                valor={formatearHora(
                  reporteSeleccionado.hora_vista
                )}
              />

              <Dato
                titulo="Hora intervenida"
                valor={formatearHora(
                  reporteSeleccionado.hora_intervenida
                )}
              />

              <Dato
                titulo="Hora finalizada"
                valor={formatearHora(
                  reporteSeleccionado.hora_finalizada
                )}
              />
            </div>

            <h3>Ubicación e incidencia</h3>

            <div className="cuadricula-detalle">
              <Dato
                titulo="Ubicación"
                valor={reporteSeleccionado.ubicacion_hecho}
              />

              <Dato
                titulo="Latitud"
                valor={reporteSeleccionado.latitud}
              />

              <Dato
                titulo="Longitud"
                valor={reporteSeleccionado.longitud}
              />
            </div>

            <Dato
              titulo="Descripción"
              valor={reporteSeleccionado.descripcion}
              completo
            />

            <h3>Intervención</h3>

            <div className="cuadricula-detalle">
              <Dato
                titulo="Unidad"
                valor={mostrarUnidad(
                  reporteSeleccionado.unidad_tipo
                )}
              />

              <Dato
                titulo="Placa"
                valor={
                  reporteSeleccionado.placa_unidad || "-"
                }
              />

              <Dato
                titulo="Uso de megáfono"
                valor={
                  reporteSeleccionado.intervencion_megafono
                    ? "Sí"
                    : "No"
                }
              />
            </div>

            <Dato
              titulo="Detalle de la intervención"
              valor={
                reporteSeleccionado.detalle_intervencion
              }
              completo
            />

            <div className="acciones-alerta">
              <button
                type="button"
                className="boton-cancelar"
                onClick={() =>
                  setReporteSeleccionado(null)
                }
                disabled={actualizandoEstado}
              >
                Regresar
              </button>

              {reportePendiente && (
                <>
                  <button
                    type="button"
                    className="boton-descartar"
                    onClick={() =>
                      cambiarEstado("DESCARTADO")
                    }
                    disabled={actualizandoEstado}
                  >
                    Descartar
                  </button>

                  <button
                    type="button"
                    className="boton-validar"
                    onClick={() =>
                      cambiarEstado("VALIDADO")
                    }
                    disabled={actualizandoEstado}
                  >
                    {actualizandoEstado
                      ? "Procesando..."
                      : "Validar"}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Dato({ titulo, valor, completo = false }) {
  return (
    <div
      className={`dato-detalle ${
        completo ? "dato-completo" : ""
      }`}
    >
      <span>{titulo}</span>
      <p>{valor || "-"}</p>
    </div>
  );
}

export default ListaReportes;