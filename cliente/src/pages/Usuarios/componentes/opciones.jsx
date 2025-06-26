import React from 'react';
import './opciones.css';

const Navigation = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'mapa', label: 'Mapa', icon: '🗺️' },
    { id: 'rutina', label: 'Rutinas', icon: '💪' },
    { id: 'citas', label: 'Agendar Citas', icon: '📅' },
    { id: 'gestion', label: 'Gestión', icon: '⚙️' }
  ];

  return (
    <nav className="navigation">
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
          onClick={() => setActiveSection(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default Navigation;