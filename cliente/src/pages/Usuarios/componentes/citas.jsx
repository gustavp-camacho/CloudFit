import React, { useState, useEffect } from 'react';
import './citas.css';

const AppointmentBooking = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busySlots, setBusySlots] = useState([]);

  const services = [
    { id: 'barbero', name: 'Servicio de Barbería', icon: '✂️', duration: 30 },
    { id: 'estilista', name: 'Servicio de Estilista', icon: '💇', duration: 45 },
    { id: 'coach', name: 'Entrenamiento Personal', icon: '🏋️', duration: 60 }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  // Cargar datos al iniciar
  useEffect(() => {
    fetchEmployees();
    fetchAppointments();
  }, []);

  // Cargar horarios ocupados cuando cambie empleado o fecha
  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      fetchBusySlots();
    }
  }, [selectedEmployee, selectedDate]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.cloudfitnessgym.com/api/empleados/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Organizar empleados por posición
        const employeesByPosition = {
          barbero: [],
          estilista: [],
          coach: []
        };

        data.employees.forEach(employee => {
          if (employee.status === 'active') {
            const position = employee.position.toLowerCase();
            if (employeesByPosition[position]) {
              employeesByPosition[position].push({
                id: employee.employeeId,
                name: employee.username,
                specialty: getSpecialtyByPosition(employee.position),
                rating: generateRating(),
                position: employee.position,
                phone: employee.phone
              });
            }
          }
        });

        setEmployees(employeesByPosition);
      } else {
        setError('Error al cargar empleados');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error de conexión al cargar empleados');
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.cloudfitnessgym.com/api/citas/my-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAppointments(data.appointments || []);
      } else {
        console.error('Error al cargar citas:', data.message);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchBusySlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://api.cloudfitnessgym.com/api/citas/employee/${selectedEmployee}/busy-slots?date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBusySlots(data.busySlots || []);
      } else {
        setBusySlots([]);
      }
    } catch (error) {
      console.error('Error fetching busy slots:', error);
      setBusySlots([]);
    }
  };

  const getSpecialtyByPosition = (position) => {
    const specialties = {
      'Barbero': ['Cortes clásicos', 'Barba y bigote', 'Cortes modernos'][Math.floor(Math.random() * 3)],
      'Estilista': ['Cortes modernos', 'Coloración', 'Peinados especiales'][Math.floor(Math.random() * 3)],
      'Coach': ['Fuerza y resistencia', 'Cardio y pérdida de peso', 'Rehabilitación'][Math.floor(Math.random() * 3)]
    };
    return specialties[position] || 'Servicio general';
  };

  const generateRating = () => {
    return (4.5 + Math.random() * 0.5).toFixed(1);
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Formatear para mostrar
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' });
    
    // Casos especiales
    if (date.toDateString() === today.toDateString()) {
      return {
        day: 'Hoy',
        date: day,
        month: month,
        full: 'Hoy'
      };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return {
        day: 'Mañana',
        date: day,
        month: month,
        full: 'Mañana'
      };
    } else {
      return {
        day: weekday,
        date: day,
        month: month,
        full: `${weekday} ${day} de ${month}`
      };
    }
  };

  const isTimeSlotAvailable = (time) => {
    return !busySlots.includes(time);
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedEmployee) {
      setError('Por favor, completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Obtener información del servicio seleccionado
      const service = services.find(s => s.id === selectedService);
      
      const appointmentData = {
        serviceType: selectedService,
        serviceName: service.name,
        serviceDuration: service.duration,
        employeeId: selectedEmployee,
        date: selectedDate,
        time: selectedTime
      };

      console.log('Enviando datos de la cita:', appointmentData); // Para debug

      const token = localStorage.getItem('token');
      const response = await fetch('https://api.cloudfitnessgym.com/api/citas/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data); // Para debug

      if (response.ok && data.success) {
        setSuccess('¡Cita agendada exitosamente!');
        
        // Recargar citas y horarios ocupados
        await fetchAppointments();
        await fetchBusySlots();
        
        // Limpiar formulario
        setSelectedService('');
        setSelectedDate('');
        setSelectedTime('');
        setSelectedEmployee('');
        setBusySlots([]);
      } else {
        setError(data.message || 'Error al agendar la cita');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Error de conexión al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.cloudfitnessgym.com/api/citas/appointment/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Cita cancelada exitosamente');
        await fetchAppointments();
        if (selectedEmployee && selectedDate) {
          await fetchBusySlots();
        }
      } else {
        setError(data.message || 'Error al cancelar la cita');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      setError('Error de conexión al cancelar la cita');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'cancelled': 'Cancelada',
      'completed': 'Completada'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="appointment-booking">
      <div className="booking-header">
        <h2>📅 Agendar Citas</h2>
      </div>

      {/* Mostrar mensajes */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="booking-content">
        <div className="booking-form">
          <h3>Nueva Cita</h3>
          
          {/* Selección de servicio */}
          <div className="form-section">
            <label>Selecciona el servicio:</label>
            <div className="service-options">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedService(service.id);
                    setSelectedEmployee('');
                    setSelectedDate('');
                    setSelectedTime('');
                    setBusySlots([]);
                  }}
                >
                  <span className="service-icon">{service.icon}</span>
                  <h4>{service.name}</h4>
                  <span className="service-duration">{service.duration} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selección de empleado */}
          {selectedService && (
            <div className="form-section">
              <label>Selecciona el profesional:</label>
              {employees[selectedService]?.length === 0 ? (
                <div className="no-employees">
                  <p>No hay profesionales disponibles para este servicio</p>
                </div>
              ) : (
                <div className="employee-options">
                  {employees[selectedService]?.map(employee => (
                    <div
                      key={employee.id}
                      className={`employee-card ${selectedEmployee === employee.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedEmployee(employee.id);
                        setSelectedDate('');
                        setSelectedTime('');
                        setBusySlots([]);
                      }}
                    >
                      <div className="employee-info">
                        <h4>{employee.name}</h4>
                        <span className="specialty">{employee.specialty}</span>
                        <div className="rating">
                          ⭐ {employee.rating}
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
              )}
            </div>
          )}

          {/* Selección de fecha */}
          {selectedEmployee && (
            <div className="form-section">
              <label>Selecciona la fecha:</label>
              <div className="date-options">
                {getAvailableDates().map(date => {
                  const formattedDate = formatDate(date);
                  return (
                    <button
                      key={date}
                      className={`date-btn ${selectedDate === date ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime('');
                      }}
                      title={formattedDate.full}
                    >
                      <div className="date-content">
                        <span className="date-day">{formattedDate.day}</span>
                        <span className="date-number">{formattedDate.date}</span>
                        <span className="date-month">{formattedDate.month}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selección de hora */}
          {selectedDate && (
            <div className="form-section">
              <label>Selecciona la hora:</label>
              <div className="time-options">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    className={`time-btn ${selectedTime === time ? 'selected' : ''} ${!isTimeSlotAvailable(time) ? 'unavailable' : ''}`}
                    onClick={() => setSelectedTime(time)}
                    disabled={!isTimeSlotAvailable(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botón de confirmar */}
          {selectedService && selectedEmployee && selectedDate && selectedTime && (
            <div className="form-section">
              <button 
                className="confirm-btn" 
                onClick={handleBookAppointment}
                disabled={loading}
              >
                {loading ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          )}
        </div>

        {/* Lista de citas */}
        <div className="appointments-list">
          <h3>Mis Citas ({appointments.length})</h3>
          {appointments.length === 0 ? (
            <div className="no-appointments">
              <p>No tienes citas agendadas</p>
            </div>
          ) : (
            <div className="appointments">
              {appointments.map(appointment => (
                <div key={appointment._id || appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <span className="service-icon">
                      {services.find(s => s.id === appointment.serviceType)?.icon || '📅'}
                    </span>
                    <div className="appointment-info">
                      <h4>{appointment.serviceName}</h4>
                      <span className="employee-name">con {appointment.employee?.name}</span>
                    </div>
                    {appointment.status !== 'cancelled' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => cancelAppointment(appointment._id || appointment.id)}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">📅 Fecha:</span>
                      <span className="detail-value">{formatDate(appointment.date).full}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">🕐 Hora:</span>
                      <span className="detail-value">{appointment.time}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">⏱️ Duración:</span>
                      <span className="detail-value">{appointment.serviceDuration} min</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📊 Estado:</span>
                      <span className={`status ${appointment.status}`}>
                        {getStatusDisplay(appointment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;