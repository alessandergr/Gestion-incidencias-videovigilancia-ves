require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function crearUsuarios() {
  try {
    const usuarios = [
      {
        nombre: "Operador de prueba",
        dni: "70000001",
        grupo: "Grupo A",
        usuario: "operador",
        contrasena: "Operador123*",
        rol: "OPERADOR",
      },
      {
        nombre: "Segundo operador",
        dni: "70000002",
        grupo: "Grupo B",
        usuario: "operador2",
        contrasena: "Operador2123*",
        rol: "OPERADOR",
      },
      {
        nombre: "Validador SIPCOP",
        dni: "70000003",
        grupo: "SIPCOP",
        usuario: "sipcop",
        contrasena: "Sipcop123*",
        rol: "SIPCOP",
      },
    ];

    for (const cuenta of usuarios) {
      const contrasenaCifrada = await bcrypt.hash(
        cuenta.contrasena,
        10
      );

      await pool.query(
        `INSERT INTO usuarios
        (nombre, dni, grupo, usuario, contrasena, rol, estado)
        VALUES (?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          dni = VALUES(dni),
          grupo = VALUES(grupo),
          contrasena = VALUES(contrasena),
          rol = VALUES(rol),
          estado = TRUE`,
        [
          cuenta.nombre,
          cuenta.dni,
          cuenta.grupo,
          cuenta.usuario,
          contrasenaCifrada,
          cuenta.rol,
        ]
      );
    }

    console.log("Usuarios actualizados correctamente");
    console.log("operador / Operador123*");
    console.log("operador2 / Operador2123*");
    console.log("sipcop / Sipcop123*");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

crearUsuarios();