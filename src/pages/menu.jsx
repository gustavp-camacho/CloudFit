import React, { useState } from 'react';
import './menu.css';

const GymMenu = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'entrenamientos', name: 'Entrenamientos', path: '/workouts' },
    { id: 'rutinas', name: 'Rutinas', path: '/routines' },
    { id: 'progreso', name: 'Progreso', path: '/progress' },
    { id: 'nutricion', name: 'Nutrición', path: '/nutrition' },
    { id: 'clases', name: 'Clases', path: '/classes' },
    { id: 'reservas', name: 'Reservas', path: '/bookings' },
    { id: 'perfil', name: 'Perfil', path: '/profile' }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setIsMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="gym-navbar">
      <div className="navbar-container">
        {/* Logo y nombre */}
        <div className="navbar-brand">
          <h2>CloudFit</h2>
        </div>

        {/* Menú desktop */}
        <nav className="navbar-menu desktop-menu">
          {menuItems.map(item => (
            <a
              key={item.id}
              href={item.path}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.id);
              }}
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Usuario y configuraciones */}
        <div className="navbar-user">
          <div className="user-info">
            <span className="username">Juan Pérez</span>
          </div>
          <button className="logout-btn">Salir</button>
        </div>

        {/* Botón menú móvil */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menú móvil */}
      <nav className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {menuItems.map(item => (
          <a
            key={item.id}
            href={item.path}
            className={`mobile-menu-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleMenuClick(item.id);
            }}
          >
            {item.name}
          </a>
        ))}
        <div className="mobile-user-section">
          <div className="mobile-user-info">
            <span>Juan Pérez</span>
          </div>
          <button className="mobile-logout-btn">Salir</button>
        </div>
      </nav>

      {/* Overlay para cerrar menú móvil */}
      {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>}

      {/* Contenido principal */}
      <main className="main-content">
        <div className="content-container">
          {activeMenu === 'dashboard' && (
            <div className="dashboard-section">
              <h1>Bienvenido, Juan!</h1>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Entrenamientos esta semana</h3>
                  <p className="stat-number">4</p>
                </div>
                <div className="stat-card">
                  <h3>Peso actual</h3>
                  <p className="stat-number">75 kg</p>
                </div>
                <div className="stat-card">
                  <h3>Calorías quemadas</h3>
                  <p className="stat-number">1,250</p>
                </div>
              </div>
              <div className="quick-actions">
                <h2>Acciones rápidas</h2>
                <div className="action-buttons">
                  <button onClick={() => setActiveMenu('entrenamientos')}>Nuevo Entrenamiento</button>
                  <button onClick={() => setActiveMenu('rutinas')}>Ver Rutinas</button>
                  <button onClick={() => setActiveMenu('reservas')}>Reservar Clase</button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'entrenamientos' && (
            <div className="section">
              <h1>Entrenamientos</h1>
              <div className="content-card">
                <h2>Historial de entrenamientos</h2>
                <p>Aquí puedes ver y registrar tus entrenamientos diarios.</p>
                <button className="primary-btn">Nuevo Entrenamiento</button>
              </div>
            </div>
          )}

          {activeMenu === 'rutinas' && (
            <div className="section">
              <h1>Rutinas</h1>
              <div className="content-card">
                <h2>Mis rutinas de ejercicio</h2>
                <p>Gestiona y sigue tus rutinas personalizadas.</p>
                <button className="primary-btn">Crear Rutina</button>
              </div>
            </div>
          )}

          {activeMenu === 'progreso' && (
            <div className="section">
              <h1>Progreso</h1>
              <div className="content-card">
                <h2>Seguimiento de progreso</h2>
                <p>Visualiza tus avances y estadísticas de entrenamiento.</p>
                <button className="primary-btn">Ver Estadísticas</button>
              </div>
            </div>
          )}

          {activeMenu === 'nutricion' && (
            <div className="section">
              <h1>Nutrición</h1>
              <div className="content-card">
                <h2>Plan nutricional</h2>
                <p>Administra tu dieta y seguimiento calórico.</p>
                <button className="primary-btn">Ver Plan</button>
              </div>
            </div>
          )}

          {activeMenu === 'clases' && (
            <div className="section">
              <h1>Clases</h1>
              <div className="content-card">
                <h2>Clases grupales</h2>
                <p>Descubre y únete a clases grupales disponibles.</p>
                <button className="primary-btn">Ver Horarios</button>
              </div>
            </div>
          )}

          {activeMenu === 'reservas' && (
            <div className="section">
              <h1>Reservas</h1>
              <div className="content-card">
                <h2>Mis reservas</h2>
                <p>Gestiona tus reservas de equipos y espacios.</p>
                <button className="primary-btn">Nueva Reserva</button>
              </div>
            </div>
          )}

          {activeMenu === 'perfil' && (
            <div className="section">
              <h1>Perfil</h1>
              <div className="content-card">
                <h2>Configuración de perfil</h2>
                <p>Actualiza tu información personal y preferencias.</p>
                <button className="primary-btn">Editar Perfil</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GymMenu;