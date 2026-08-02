require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
const servidor = http.createServer(app);

const io = new Server(servidor, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const camarasSeleccionadas = new Map();

app.use(cors());
app.use(express.json());

function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion?.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      mensaje: "Debes iniciar sesión.",
    });
  }

  const token = autorizacion.split(" ")[1];

  try {
    req.usuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "La sesión no es válida o ha vencido.",
    });
  }
}

function soloSipcop(req, res, next) {
  const rol = String(req.usuario.rol).toUpperCase();

  if (rol !== "SIPCOP") {
    return res.status(403).json({
      ok: false,
      mensaje:
        "Solo el personal de SIPCOP puede revisar el detalle completo.",
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Backend de SRIVES funcionando",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [resultado] = await pool.query(
      "SELECT DATABASE() AS base_datos"
    );

    res.json({
      ok: true,
      base_datos: resultado[0].base_datos,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo conectar con MySQL.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        mensaje: "Completa el usuario y la contraseña.",
      });
    }

    const [resultados] = await pool.query(
      `SELECT
        id,
        nombre,
        dni,
        grupo,
        usuario,
        contrasena,
        rol,
        estado
      FROM usuarios
      WHERE usuario = ?
      LIMIT 1`,
      [usuario.trim()]
    );

    if (resultados.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario o contraseña incorrectos.",
      });
    }

    const cuenta = resultados[0];

    if (!cuenta.estado) {
      return res.status(403).json({
        ok: false,
        mensaje: "La cuenta está desactivada.",
      });
    }

    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      cuenta.contrasena
    );

    if (!contrasenaCorrecta) {
      return res.status(401).json({
        ok: false,
        mensaje: "Usuario o contraseña incorrectos.",
      });
    }

    const token = jwt.sign(
      {
        id: cuenta.id,
        usuario: cuenta.usuario,
        rol: cuenta.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      ok: true,
      mensaje: "Inicio de sesión correcto.",
      token,
      usuario: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        dni: cuenta.dni,
        grupo: cuenta.grupo,
        usuario: cuenta.usuario,
        rol: cuenta.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Ocurrió un error en el servidor.",
    });
  }
});

app.get("/api/camaras", async (req, res) => {
  try {
    const [camaras] = await pool.query(
      `SELECT
        id,
        codigo,
        ubicacion,
        latitud,
        longitud,
        estado
      FROM camaras
      ORDER BY codigo`
    );

    return res.json({
      ok: true,
      camaras,
    });
  } catch (error) {
    console.error("Error al consultar cámaras:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudieron consultar las cámaras.",
    });
  }
});

app.get("/api/operadores/:dni", async (req, res) => {
  try {
    const { dni } = req.params;

    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El DNI debe tener 8 números.",
      });
    }

    const [resultados] = await pool.query(
      `SELECT
        id,
        dni,
        nombre,
        grupo
      FROM operadores
      WHERE dni = ?
        AND estado = TRUE
      LIMIT 1`,
      [dni]
    );

    if (resultados.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "No se encontró un operador con ese DNI.",
      });
    }

    return res.json({
      ok: true,
      operador: resultados[0],
    });
  } catch (error) {
    console.error("Error al buscar operador:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudo buscar al operador.",
    });
  }
});

app.get(
  "/api/reportes",
  verificarToken,
  async (req, res) => {
    try {
      const esSipcop =
        String(req.usuario.rol).toUpperCase() ===
        "SIPCOP";

      let consulta = `
        SELECT
          r.id,
          r.codigo,
          r.fecha,
          r.hora_vista,
          r.tipo,
          r.estado,
          c.codigo AS camara_codigo
      `;

      if (esSipcop) {
        consulta += `,
          o.nombre AS operador_nombre,
          o.grupo AS operador_grupo
        `;
      }

      consulta += `
        FROM reportes r
        INNER JOIN camaras c
          ON c.id = r.camara_id
      `;

      if (esSipcop) {
        consulta += `
          INNER JOIN operadores o
            ON o.id = r.operador_id
        `;
      }

      consulta += `
        ORDER BY r.id DESC
      `;

      const [reportes] = await pool.query(consulta);

      return res.json({
        ok: true,
        reportes,
      });
    } catch (error) {
      console.error(
        "Error al consultar reportes:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudieron consultar los reportes.",
      });
    }
  }
);

app.get(
  "/api/reportes/:id",
  verificarToken,
  soloSipcop,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El identificador del reporte no es válido.",
        });
      }

      const [resultados] = await pool.query(
        `SELECT
          r.id,
          r.codigo,
          r.fecha,
          r.hora_vista,
          r.hora_intervenida,
          r.hora_finalizada,
          r.tipo,
          r.descripcion,
          r.ubicacion_hecho,
          r.latitud,
          r.longitud,
          r.unidad_tipo,
          r.placa_unidad,
          r.intervencion_megafono,
          r.detalle_intervencion,
          r.estado,
          c.codigo AS camara_codigo,
          c.ubicacion AS camara_ubicacion,
          o.dni AS operador_dni,
          o.nombre AS operador_nombre,
          o.grupo AS operador_grupo,
          u.usuario AS cuenta_registro
        FROM reportes r
        INNER JOIN camaras c
          ON c.id = r.camara_id
        INNER JOIN operadores o
          ON o.id = r.operador_id
        INNER JOIN usuarios u
          ON u.id = r.usuario_id
        WHERE r.id = ?
        LIMIT 1`,
        [id]
      );

      if (resultados.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: "No se encontró el reporte.",
        });
      }

      return res.json({
        ok: true,
        reporte: resultados[0],
      });
    } catch (error) {
      console.error(
        "Error al consultar el detalle:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo consultar el detalle del reporte.",
      });
    }
  }
);

app.post("/api/reportes", async (req, res) => {
  try {
    const {
      camara_id,
      usuario_id,
      operador_id,
      fecha,
      hora_vista,
      hora_intervenida,
      hora_finalizada,
      tipo,
      descripcion,
      ubicacion_hecho,
      latitud,
      longitud,
      unidad_tipo,
      placa_unidad,
      intervencion_megafono,
      detalle_intervencion,
    } = req.body;

    if (
      !camara_id ||
      !usuario_id ||
      !operador_id ||
      !fecha ||
      !hora_vista ||
      !tipo ||
      !descripcion?.trim() ||
      !ubicacion_hecho?.trim() ||
      latitud === "" ||
      longitud === "" ||
      !detalle_intervencion?.trim()
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Completa los campos obligatorios.",
      });
    }

    const unidadesPermitidas = [
      "SIN_UNIDAD",
      "ECO",
      "AGUILA",
      "AMBULANCIA",
    ];

    if (!unidadesPermitidas.includes(unidad_tipo)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El tipo de unidad no es válido.",
      });
    }

    const requierePlaca =
      unidad_tipo === "ECO" ||
      unidad_tipo === "AGUILA";

    if (requierePlaca && !placa_unidad?.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ingresa la placa de la unidad.",
      });
    }

    const codigo = `INC-${Date.now()}`;

    const [resultado] = await pool.query(
      `INSERT INTO reportes (
        codigo,
        camara_id,
        usuario_id,
        operador_id,
        fecha,
        hora_vista,
        hora_intervenida,
        hora_finalizada,
        tipo,
        descripcion,
        ubicacion_hecho,
        latitud,
        longitud,
        unidad_tipo,
        placa_unidad,
        intervencion_megafono,
        detalle_intervencion,
        estado
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE'
      )`,
      [
        codigo,
        camara_id,
        usuario_id,
        operador_id,
        fecha,
        hora_vista,
        hora_intervenida || null,
        hora_finalizada || null,
        tipo,
        descripcion.trim(),
        ubicacion_hecho.trim(),
        latitud,
        longitud,
        unidad_tipo,
        requierePlaca
          ? placa_unidad.trim().toUpperCase()
          : null,
        intervencion_megafono ? 1 : 0,
        detalle_intervencion.trim(),
      ]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Reporte registrado correctamente.",
      reporte: {
        id: resultado.insertId,
        codigo,
        estado: "PENDIENTE",
      },
    });
  } catch (error) {
    console.error(
      "Error al registrar reporte:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudo registrar el reporte.",
    });
  }
});

io.on("connection", (socket) => {
  console.log("Estación conectada:", socket.id);

  socket.on(
    "seleccionar-camara",
    ({ camara, usuario }, responder) => {
      const otraEstacion = Array.from(
        camarasSeleccionadas.entries()
      ).find(
        ([socketId, seleccion]) =>
          socketId !== socket.id &&
          seleccion.camara.id === camara.id
      );

      if (otraEstacion) {
        const seleccion = otraEstacion[1];

        responder({
          coincidencia: true,
          mensaje: `Otra estación está trabajando con ${camara.codigo}.`,
          estacion: seleccion.usuario,
        });

        return;
      }

      camarasSeleccionadas.set(socket.id, {
        camara,
        usuario,
      });

      responder({
        coincidencia: false,
      });
    }
  );

  socket.on(
    "continuar-camara",
    ({ camara, usuario }) => {
      camarasSeleccionadas.set(socket.id, {
        camara,
        usuario,
      });
    }
  );

  socket.on("liberar-camara", () => {
    camarasSeleccionadas.delete(socket.id);
  });

  socket.on("disconnect", () => {
    camarasSeleccionadas.delete(socket.id);

    console.log(
      "Estación desconectada:",
      socket.id
    );
  });
});

const PORT = process.env.PORT || 3001;

servidor.listen(PORT, () => {
  console.log(
    `Servidor funcionando en http://localhost:${PORT}`
  );
});