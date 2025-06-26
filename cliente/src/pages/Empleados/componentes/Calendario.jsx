import React, { useState, useEffect, useCallback } from 'react';
import './Calendario.css';

const Schedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // URL CORREGIDA: Cambiada de /api/empleados/appointments a /api/citas/employee-schedule
      const response = await fetch(`https://api.cloudfitnessgym.com/api/citas/employee-schedule?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Citas recibidas del backend:', data.appointments);
        setAppointments(data.appointments || []);
      } else {
        console.error('Error en la respuesta:', data);
        setError(data.message || 'Error al cargar las citas');
        // En caso de error, usar array vacío en lugar de datos de ejemplo
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Error de conexión con el servidor');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#7dd3c0';
      case 'pending':
        return '#f39c12';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Sin estado';
    }
  };

  const getServiceIcon = (service) => {
    if (service.toLowerCase().includes('corte')) return '✂️';
    if (service.toLowerCase().includes('peinado')) return '💇‍♀️';
    if (service.toLowerCase().includes('entrenamiento') || service.toLowerCase().includes('coach')) return '🏋️‍♂️';
    if (service.toLowerCase().includes('barba')) return '🪒';
    return '📅';
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // No permitir fechas anteriores a hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Verificar si se puede ir hacia atrás (solo si no es hoy)
  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    return selected > today;
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <div className="loading-schedule">
          <div className="loading-spinner"></div>
          <p>Cargando horario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2 className="schedule-title">Mi Horario</h2>
        
        <div className="date-navigator">
          <button 
            className={`date-btn ${!canGoPrevious() ? 'disabled' : ''}`}
            onClick={() => changeDate(-1)}
            disabled={!canGoPrevious()}
          >
            <span>←</span>
          </button>
          
          <div className="current-date">
            <div className="date-text">{formatDate(selectedDate)}</div>
            {isToday(selectedDate) && <div className="today-badge">Hoy</div>}
          </div>
          
          <button className="date-btn" onClick={() => changeDate(1)}>
            <span>→</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            onClick={fetchAppointments}
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              border: 'none', 
              borderRadius: '4px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="appointments-section">
        <div className="appointments-header">
          <h3>Citas del Día</h3>
          <div className="appointments-count">
            <span className="count-number">{appointments.length}</span>
            <span className="count-text">citas</span>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <div className="no-appointments-icon">📅</div>
            <h4>Sin citas programadas</h4>
            <p>¡Disfruta tu día libre!</p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-time">
                  <div className="start-time">{appointment.time}</div>
                  <div className="time-separator">-</div>
                  <div className="end-time">
                    {calculateEndTime(appointment.time, appointment.duration)}
                  </div>
                </div>
                
                <div className="appointment-details">
                  <div className="client-info">
                    <span className="client-icon">👤</span>
                    <span className="client-name">{appointment.client}</span>
                  </div>
                  
                  <div className="service-info">
                    <span className="service-icon">{getServiceIcon(appointment.service)}</span>
                    <span className="service-name">{appointment.service}</span>
                  </div>
                  
                  <div className="duration-info">
                    <span className="duration-icon">⏱️</span>
                    <span className="duration-text">{appointment.duration} min</span>
                  </div>
                </div>
                
                <div className="appointment-status">
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  ></div>
                  <span className="status-text">
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="schedule-summary">
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-text">
            <span className="summary-title">Confirmadas</span>
            <span className="summary-value">
              {appointments.filter(apt => apt.status === 'confirmed').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;