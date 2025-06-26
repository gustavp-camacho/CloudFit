//frontend/empleados.jsx
import React, { useState, useEffect, useCallback } from 'react';

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    position: 'Barbero',
    phone: ''
  });

  // Función para generar ID de empleado (similar al generateUserId del signup)
  const generateEmployeeId = () => {
    // Genera ID de 6 números que empiece con 70
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `70${randomDigits}`;
  };

  // Validaciones (siguiendo el patrón de signup.jsx)
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Solo acepta exactamente 10 dígitos numéricos
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    // Al menos 6 caracteres, al menos una letra y un número
    return password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password);
  };

  const validateUsername = (username) => {
    // 3-20 caracteres, solo letras, números y espacios
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,20}$/.test(username);
  };

  // Memoizar la función filterEmployees para evitar recreaciones innecesarias
  const filterEmployees = useCallback(() => {
    let filtered = employees;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm)
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Filtro de puesto
    if (positionFilter !== 'all') {
      filtered = filtered.filter(employee => employee.position === positionFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter, positionFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://b949-18-219-156-200.ngrok-free.app/api/empleados/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (response.ok && data.success) {
        setEmployees(data.employees || []);
      } else {
        setError(data.message || 'Error al cargar empleados');
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Aplicar formato específico según el campo (siguiendo patrón de signup)
    switch(name) {
      case 'phone':
        // Solo permitir números y limitar a 10 dígitos
        formattedValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      case 'username':
        // Solo letras, números y espacios
        formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        break;
      default:
        formattedValue = value;
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    setError('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Validación del formulario (siguiendo patrón de signup)
  const validateForm = () => {
    const { username, email, password, phone } = formData;
    
    if (!username || !email || !phone) {
      setError('Todos los campos marcados con * son obligatorios');
      return false;
    }
    
    if (!editingEmployee && !password) {
      setError('La contraseña es obligatoria para nuevos empleados');
      return false;
    }
    
    if (!validateUsername(username)) {
      setError('El nombre de usuario debe tener 3-20 caracteres y solo puede contener letras, números y espacios');
      return false;
    }
    
    if (!validateEmail(email)) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    
    if (!validatePhone(phone)) {
      setError('El teléfono debe tener exactamente 10 dígitos numéricos');
      return false;
    }
    
    if (password && !validatePassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres, incluyendo al menos una letra y un número');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let url, method, bodyData;
      
      if (editingEmployee) {
        // Actualizar empleado existente
        url = `https://b949-18-219-156-200.ngrok-free.app/api/empleados/empleado/${editingEmployee.employeeId}`;
        method = 'PUT';
        bodyData = { ...formData };
        // Si no hay nueva contraseña, no la enviamos
        if (!formData.password) {
          delete bodyData.password;
        }
      } else {
        // Crear nuevo empleado
        url = 'hhttps://b949-18-219-156-200.ngrok-free.app/api/empleados/create';
        method = 'POST';
        const newEmployeeId = generateEmployeeId();
        bodyData = {
          ...formData,
          employeeId: newEmployeeId,
          role: 'empleado'
        };
      }
      
      console.log('Enviando datos:', bodyData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (response.ok && data.success) {
        await fetchEmployees(); // Recargar lista
        if (editingEmployee) {
          setSuccess('Empleado actualizado exitosamente');
        } else {
          setSuccess(`Empleado creado exitosamente! ID: ${bodyData.employeeId}`);
        }
        resetForm();
        setShowAddModal(false);
        setEditingEmployee(null);
      } else {
        setError(data.message || 'Error al guardar empleado');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      position: 'Barbero',
      phone: ''
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username || '',
      email: employee.email || '',
      password: '', // No mostrar contraseña actual
      position: employee.position || 'Barbero',
      phone: employee.phone || ''
    });
    setError('');
    setSuccess('');
    setShowAddModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer.')) {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://b949-18-219-156-200.ngrok-free.app0/api/empleados/empleado/${employeeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          await fetchEmployees(); // Recargar lista
          setSuccess('Empleado eliminado exitosamente');
        } else {
          setError(data.message || 'Error al eliminar empleado');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    resetForm();
  };

  const getPositionIcon = (position) => {
    const icons = {
      'Barbero': '✂️',
      'Estilista': '💇‍♀️',
      'Coach': '🏋️‍♂️'
    };
    return icons[position] || '👨‍💼';
  };

  return (
    <div className="employees-management">
      <div className="section-header">
        <h2>Gestión de Empleados</h2>
        <div className="users-stats">
          <div className="stat-card mini">
            <span className="stat-number">{employees.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="users-controls">
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar empleado por username, email, ID o teléfono..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`filter-btn ${positionFilter === 'Barbero' ? 'active' : ''}`}
            onClick={() => setPositionFilter(positionFilter === 'Barbero' ? 'all' : 'Barbero')}
          >
            Barberos
          </button>
          <button 
            className={`filter-btn ${positionFilter === 'Estilista' ? 'active' : ''}`}
            onClick={() => setPositionFilter(positionFilter === 'Estilista' ? 'all' : 'Estilista')}
          >
            Estilistas
          </button>
          <button 
            className={`filter-btn ${positionFilter === 'Coach' ? 'active' : ''}`}
            onClick={() => setPositionFilter(positionFilter === 'Coach' ? 'all' : 'Coach')}
          >
            Coaches
          </button>
        </div>
      </div>

      <div className="users-controls">
        <button className="btn-primary" onClick={openAddModal} disabled={loading}>
          + Nuevo Empleado
        </button>
      </div>

      {/* Mostrar mensajes de error y éxito */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando empleados...</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredEmployees.length === 0 ? (
            <div className="no-results">
              <p>No se encontraron empleados</p>
            </div>
          ) : (
            filteredEmployees.map(employee => (
              <div key={employee.employeeId} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar-section">
                    <div className="user-avatar-large">
                      {getPositionIcon(employee.position)}
                    </div>
                    <div className="user-info-primary">
                      <h4 className="user-full-name">@{employee.username}</h4>
                      <p className="user-id">ID: {employee.employeeId}</p>
                    </div>
                  </div>
                  <div className="user-status-section">
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: employee.status === 'active' ? '#10b981' : '#ef4444' }}
                    ></span>
                    <span className="status-text">{employee.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>

                <div className="user-card-body">
                  <div className="user-detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{employee.email}</span>
                  </div>
                  <div className="user-detail-row">
                    <span className="detail-icon">📱</span>
                    <span className="detail-text">{employee.phone}</span>
                  </div>
                  <div className="user-detail-row">
                    <span className="detail-icon">💼</span>
                    <span className="detail-text">{employee.position}</span>
                  </div>
                </div>

                <div className="user-card-footer">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleEdit(employee)}
                    title="Editar"
                    disabled={loading}
                  >
                    <span>✏️</span>
                    Editar
                  </button>
                  

                  
                  <button
                    className="action-btn suspend-btn"
                    onClick={() => handleDelete(employee.employeeId)}
                    title="Eliminar"
                    disabled={loading}
                  >
                    <span>🗑️</span>
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para agregar/editar empleado */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <form className="employee-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="usuario123"
                      maxLength="20"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="usuario@cloudfit.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Contraseña {editingEmployee ? '(opcional)' : '*'}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingEmployee}
                      placeholder={editingEmployee ? "Nueva contraseña (opcional)" : "Contraseña"}
                      minLength="6"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="5551234567"
                      maxLength="10"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Puesto *</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Barbero">✂️ Barbero</option>
                      <option value="Estilista">💇‍♀️ Estilista</option>
                      <option value="Coach">🏋️‍♂️ Coach</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    {/* Campo vacío para mantener el layout */}
                  </div>
                </div>

                {!editingEmployee && (
                  <div className="info-note">
                    <p><strong>Información automática:</strong></p>
                    <ul>
                      <li>📋 Se generará automáticamente un ID único de empleado (70XXXX)</li>
                      <li>🏷️ El rol será: empleado</li>
                    </ul>
                  </div>
                )}

                {/* Mostrar mensajes de error en el modal */}
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeModal} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Guardando...' : (editingEmployee ? 'Actualizar' : 'Crear')} Empleado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;