import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './componentes/Header';
import Schedule from './componentes/Calendario';
import './empleados_menu.css';

const EmpleadoMenu = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación al cargar el componente
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        console.log('No hay token o usuario, redirigiendo al login');
        navigate('/');
        return;
      }
      
      // Verificar que el usuario sea empleado
      if (user.role !== 'empleado') {
        console.log('Usuario no es empleado, redirigiendo según su rol');
        if (user.role === 'admin') {
          navigate('/Admin');
        } else {
          navigate('/menu');
        }
        return;
      }
      
      console.log('Usuario empleado autenticado correctamente:', user);
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="empleado-menu">
      {/* Header con información del empleado */}
      <Header />
      
      {/* Contenido principal con el horario */}
      <main className="empleado-main">
        <Schedule />
      </main>
      
      {/* Footer opcional */}
      <footer className="empleado-footer">
        <div className="footer-content">
          <span className="footer-text">CloudFit © 2024</span>
          <span className="footer-version">Versión Empleado</span>
        </div>
      </footer>
    </div>
  );
};

export default EmpleadoMenu;