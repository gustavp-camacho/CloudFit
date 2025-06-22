import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom'; // Importar Routes en lugar de Switch

import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import Menu from './pages/menu.jsx';


function App() {

  
  return (

    <div className="App">
   
    
    <div className="main-content">
        <Routes> {/* Usa Routes en lugar de Switch */}
          <Route path="/" element={<Login />} /> {/* Ruta para la página de inicio */}
          <Route path="/signup" element={<Signup />} /> {/* Ruta para la página de inicio */}
          <Route path="/menu" element={<Menu />} /> {/* Ruta para la página de inicio */}
          
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
