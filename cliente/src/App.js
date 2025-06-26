import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom'; // Importar Routes en lugar de Switch

import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import Menu from './pages/Usuarios/menu.jsx';
import Admin from './pages/Admin/AdminMenu.jsx';
import EmpleadoMenu from './pages/Empleados/empleados_menu.jsx';

function App() {

  
  return (

    <div className="App">
   
    
    <div className="main-content">
        <Routes> {/* Usa Routes en lugar de Switch */}
          <Route path="/" element={<Login />} /> {/* Ruta para la página de inicio */}
          <Route path="/signup" element={<Signup />} /> {/* Ruta para registrar usuarios */}
          <Route path="/menu" element={<Menu />} /> {/* Ruta para la el menu del usario */}
          <Route path="/Admin" element={<Admin />} /> {/* Ruta para el menu del administrador */}
          <Route path="/Empleado" element={<EmpleadoMenu />} /> {/* Ruta para el menu del administrador */}
          {/* Agrega más rutas aquí */}
          <Route path="*" element={<h2>Página no encontrada</h2>} /> {/* Ruta por defecto para manejar páginas no encontradas */}
        </Routes>
      </div>
     
      
    </div>
    
  
  );
}

// Encierra App en Router
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
