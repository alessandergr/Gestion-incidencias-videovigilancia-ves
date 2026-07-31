require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

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
      `SELECT id, dni, nombre, grupo
       FROM operadores
       WHERE dni = ? AND estado = TRUE
       LIMIT 1`,
      [dni]
    );

    if (resultados.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró un operador con ese DNI.",
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
      unidad_tipo === "ECO" || unidad_tipo === "AGUILA";

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
        requierePlaca ? placa_unidad.trim().toUpperCase() : null,
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
    console.error("Error al registrar reporte:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudo registrar el reporte.",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});