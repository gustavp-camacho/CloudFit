import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState({
    username: '',
    position: '',
    loading: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://18.219.156.200:5000/api/empleados/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmployeeData({
          username: data.employee.username,
          position: data.employee.position,
          loading: false
        });
      } else {
        // Fallback: usar datos del localStorage y mostrar error
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setEmployeeData({
          username: userData.username || 'Empleado',
          position: 'Cargando...', // Se mostrará hasta que se implemente el backend
          loading: false
        });
        setError('No se pudo cargar la información completa');
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      // Usar datos del localStorage como fallback
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setEmployeeData({
        username: userData.username || 'Empleado',
        position: 'Sin conexión',
        loading: false
      });
      setError('Error de conexión');
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try {
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        console.log('Sesión cerrada correctamente');
        
        // Redireccionar al login
        navigate('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        navigate('/');
      }
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 'Barbero':
        return '✂️';
      case 'Estilista':
        return '💇‍♀️';
      case 'Coach':
        return '🏋️‍♂️';
      default:
        return '👨‍💼';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'Barbero':
        return '#3498db';
      case 'Estilista':
        return '#e91e63';
      case 'Coach':
        return '#ff9800';
      default:
        return '#7dd3c0';
    }
  };

  if (employeeData.loading) {
    return (
      <header className="employee-header">
        <div className="header-content">
          <div className="header-loading">
            <div className="loading-spinner-small"></div>
            <span>Cargando...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="employee-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-section">
            <img src="cloudfit_l.png" alt="CloudFit" className="header-logo" />
            <span className="app-name">CloudFit</span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="employee-info">
            <div className="employee-greeting">
              <span className="greeting-text">¡Hola!</span>
              <span className="employee-name">{employeeData.username}</span>
            </div>
            <div 
              className="employee-position"
              style={{ color: getPositionColor(employeeData.position) }}
            >
              <span className="position-icon">{getPositionIcon(employeeData.position)}</span>
              <span className="position-text">{employeeData.position}</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🔓</span>
            <span className="logout-text">Salir</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="header-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </header>
  );
};

export default Header;