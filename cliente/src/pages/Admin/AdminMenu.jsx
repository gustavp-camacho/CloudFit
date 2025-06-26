import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersManagement from './components/gdu.jsx';
import EmployeesManagement from './components/gde.jsx';
import MachinesManagement from './components/gdm.jsx';
import './AdminMenu.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('users');
  const [loading, ] = useState(false);

  useEffect(() => {
    // Dashboard eliminado, ya no necesitamos fetchear stats
  }, []);



  // Función para cerrar sesión (siguiendo el patrón de login/registro)
  const handleLogout = () => {
    // Confirmar antes de cerrar sesión
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try {
        // Limpiar localStorage (igual que hacen login/registro)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Verificar que se limpiaron los datos
        console.log('Sesión cerrada correctamente');
        
        // Redireccionar al login
        navigate('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Aún así redirigir al login
        navigate('/');
      }
    }
  };

  const menuItems = [
    { id: 'users', label: 'Gestión de Usuarios', icon: '👥' },
    { id: 'employees', label: 'Gestión de Empleados', icon: '👨‍💼' },
    { id: 'machines', label: 'Gestión de Máquinas', icon: '🏋️‍♂️' }
  ];





  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManagement />;
      case 'employees':
        return <EmployeesManagement />;
      case 'machines':
        return <MachinesManagement />;
      default:
        return <UsersManagement />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <img src="cloudfit_l.png" alt="CloudFit" className="logo" />
          <h1>CloudFit Admin</h1>
        </div>
        <div className="header-right">
          <div className="admin-profile">
            <span>👨‍💼 Admin</span>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Cargando...</p>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;