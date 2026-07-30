require("dotenv").config();

const express = require("express");
const cors = require("cors");
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
      error: error.code,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});