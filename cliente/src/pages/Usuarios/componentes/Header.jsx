import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Obtener datos directamente de localStorage (simple y limpio)
  const [userData, setUserData] = useState(() => {
    const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      username: localUserData.username || 'Usuario',
      email: localUserData.email || '',
      planType: localUserData.planType || 'monthly'
    };
  });

  // Actualizar userData si localStorage cambia
  useEffect(() => {
    const handleStorageChange = () => {
      const localUserData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData({
        username: localUserData.username || 'Usuario',
        email: localUserData.email || '',
        planType: localUserData.planType || 'monthly'
      });
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    try {
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('Sesión cerrada correctamente');
      
      if (onLogout) {
        onLogout();
      }
      
      // Redireccionar al login
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/');
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'annual':
        return '⭐';
      case 'monthly':
        return '📅';
      default:
        return '💳';
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'annual':
        return '#ff9800';
      case 'monthly':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="gym-logo">
          <img src="/cloudfit_l.png" alt="Gym Logo" className="logo-image" />
          <h1 className="gym-name"> CloudFit </h1>
        </div>
      </div>
      
      <div className="header-center">
        <div className="user-welcome">
          <span className="welcome-text">¡Hola!</span>
          <span className="user-name">{userData.username}</span>
          <div 
            className="user-plan"
            style={{ color: getPlanColor(userData.planType) }}
          >
            <span className="plan-icon">{getPlanIcon(userData.planType)}</span>
            <span className="plan-text">
              {userData.planType === 'annual' ? 'Plan Anual' : 'Plan Mensual'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <div className="user-info" onClick={toggleMenu} ref={menuRef}>
          <span className="username">{userData.username}</span>
          <img 
            src="/usuario_logo.png" 
            alt="Usuario" 
            className="user-avatar"
          />
          
          {/* Menú desplegable */}
          {isMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <span className="menu-username">{userData.username}</span>
                <span className="menu-email">{userData.email}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
