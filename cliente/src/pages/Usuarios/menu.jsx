import React, { useState } from 'react';
import Header from './componentes/Header';
import Navigation from './componentes/opciones';
import MapSection from './componentes/mapa';
import RoutineManagement from './componentes/rutina';
import AppointmentBooking from './componentes/citas';
import ProfileManagement from './componentes/gestion';
import './menu.css';

const UserDashboard = ({ user }) => {
  const [activeSection, setActiveSection] = useState('mapa');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'mapa':
        return <MapSection />;
      case 'rutina':
        return <RoutineManagement />;
      case 'citas':
        return <AppointmentBooking />;
      case 'gestion':
        return <ProfileManagement user={user} />;
      default:
        return <MapSection />;
    }
  };

  return (
    <div className="user-dashboard">
      <Header user={user} />
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      <main className="dashboard-content">
        {renderActiveSection()}
      </main>
    </div>
  );
};

export default UserDashboard;