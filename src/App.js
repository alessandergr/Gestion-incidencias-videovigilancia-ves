import { useState } from "react";
import Login from "./components/Login";
import PanelOperador from "./components/PanelOperador";
import PanelSipcop from "./components/PanelSipcop";
import "./App.css";

function App() {
  const [sesion, setSesion] = useState(() => {
    const datos = localStorage.getItem("sesionSrives");
    return datos ? JSON.parse(datos) : null;
  });

  const guardarSesion = (datos) => {
    localStorage.setItem("sesionSrives", JSON.stringify(datos));
    setSesion(datos);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("sesionSrives");
    setSesion(null);
  };

  if (!sesion) {
    return <Login onLogin={guardarSesion} />;
  }

  if (sesion.usuario.rol === "OPERADOR") {
    return <PanelOperador sesion={sesion} onSalir={cerrarSesion} />;
  }

  return <PanelSipcop sesion={sesion} onSalir={cerrarSesion} />;
}

export default App;