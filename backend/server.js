require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS base_datos, NOW() AS fecha"
    );

    res.json({
      ok: true,
      mensaje: "Conexión con MySQL correcta",
      datos: rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo conectar con MySQL",
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
      `SELECT id, nombre, usuario, contrasena, rol, estado
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
        mensaje: "La cuenta se encuentra desactivada.",
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
        usuario: cuenta.usuario,
        rol: cuenta.rol,
      },
    });
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Ocurrió un error en el servidor.",
    });
  }
});

app.get("/api/camaras", async (req, res) => {
  try {
    const [camaras] = await pool.query(
      `SELECT id, codigo, ubicacion, latitud, longitud, estado
       FROM camaras
       ORDER BY codigo`
    );

    res.json({
      ok: true,
      camaras,
    });
  } catch (error) {
    console.error("Error al consultar cámaras:", error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudieron consultar las cámaras.",
    });
  }
});

app.post("/api/reportes", async (req, res) => {
  try {
    const { camara_id, usuario_id, tipo, descripcion } = req.body;

    if (!camara_id || !usuario_id || !tipo || !descripcion?.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "Completa todos los campos.",
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO reportes
       (camara_id, usuario_id, tipo, descripcion, estado)
       VALUES (?, ?, ?, ?, 'PENDIENTE')`,
      [camara_id, usuario_id, tipo, descripcion.trim()]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Reporte registrado correctamente.",
      reporte: {
        id: resultado.insertId,
        camara_id,
        usuario_id,
        tipo,
        descripcion: descripcion.trim(),
        estado: "PENDIENTE",
      },
    });
  } catch (error) {
    console.error("Error al registrar reporte:", error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo registrar el reporte.",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});