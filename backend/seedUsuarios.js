require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function crearUsuarios() {
  try {
    const usuarios = [
      {
        nombre: "Operador de prueba",
        usuario: "operador",
        contrasena: "Operador123*",
        rol: "OPERADOR",
      },
      {
        nombre: "Validador SIPCOP",
        usuario: "sipcop",
        contrasena: "Sipcop123*",
        rol: "SIPCOP",
      },
    ];

    for (const usuario of usuarios) {
      const contrasenaCifrada = await bcrypt.hash(usuario.contrasena, 10);

      await pool.query(
        `INSERT INTO usuarios
          (nombre, usuario, contrasena, rol, estado)
         VALUES (?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          contrasena = VALUES(contrasena),
          rol = VALUES(rol),
          estado = true`,
        [
          usuario.nombre,
          usuario.usuario,
          contrasenaCifrada,
          usuario.rol,
        ]
      );
    }

    console.log("Usuarios de prueba creados correctamente");
    console.log("OPERADOR: operador / Operador123*");
    console.log("SIPCOP: sipcop / Sipcop123*");
  } catch (error) {
    console.error("Error al crear usuarios:", error.message);
  } finally {
    await pool.end();
  }
}

crearUsuarios();