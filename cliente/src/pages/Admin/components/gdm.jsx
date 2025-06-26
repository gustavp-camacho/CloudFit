//frontend/maquinas.jsx
import React, { useState, useEffect, useCallback } from 'react';

const MachinesManagement = () => {
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    pesos: '',
    cantidad: '',
    nombreVideo: '',
    nombreImagen: '',
    video: null,
    imagen: null
  });

  const categories = [
    { value: 'cardio', label: 'Cardio' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'libre', label: 'Libre' }
  ];

  // Función para generar ID de máquina (similar al patrón de empleados)
  const generateMachineId = () => {
    // Genera ID de 6 números que empiece con 80
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `80${randomDigits}`;
  };

  // Validaciones siguiendo el patrón de empleados
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre de la máquina es obligatorio');
      return false;
    }

    if (!formData.categoria) {
      setError('La categoría es obligatoria');
      return false;
    }

    if (!formData.pesos.trim()) {
      setError('Los pesos disponibles son obligatorios');
      return false;
    }

    if (!formData.cantidad.trim()) {
      setError('La cantidad de máquinas es obligatoria');
      return false;
    }

    const cantidad = parseInt(formData.cantidad);
    if (isNaN(cantidad) || cantidad < 1) {
      setError('La cantidad debe ser un número mayor a 0');
      return false;
    }

    if (!formData.nombreVideo.trim()) {
      setError('El nombre del video es obligatorio');
      return false;
    }

    if (!formData.nombreImagen.trim()) {
      setError('El nombre de la imagen es obligatorio');
      return false;
    }

    if (!editingMachine) {
      if (!formData.video) {
        setError('El video es obligatorio para nuevas máquinas');
        return false;
      }

      if (!formData.imagen) {
        setError('La imagen es obligatoria para nuevas máquinas');
        return false;
      }

      if (formData.video && !formData.video.type.startsWith('video/')) {
        setError('El archivo debe ser un video válido');
        return false;
      }

      if (formData.imagen && !formData.imagen.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen válida');
        return false;
      }
    }

    return true;
  };

  // Memoizar la función filterMachines para evitar recreaciones innecesarias
  const filterMachines = useCallback(() => {
    let filtered = machines;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(machine =>
        machine.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.machineId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.pesos?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de categoría
    if (filterCategory !== 'todas') {
      filtered = filtered.filter(machine => machine.categoria === filterCategory);
    }

    setFilteredMachines(filtered);
  }, [machines, searchTerm, filterCategory]);

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    filterMachines();
  }, [filterMachines]);

  const fetchMachines = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.cloudfitnessgym.com/api/maquinas/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (response.ok && data.success) {
        setMachines(data.machines || []);
      } else {
        setError(data.message || 'Error al cargar máquinas');
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Aplicar formato específico según el campo
    switch(name) {
      case 'cantidad':
        // Solo permitir números positivos
        formattedValue = value.replace(/\D/g, '');
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

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fileType]: file
      }));
      setError('');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      
      if (editingMachine) {
        // Actualizar máquina existente
        formDataToSend.append('nombre', formData.nombre);
        formDataToSend.append('categoria', formData.categoria);
        formDataToSend.append('pesos', formData.pesos);
        formDataToSend.append('cantidad', formData.cantidad);
        formDataToSend.append('nombreVideo', formData.nombreVideo);
        formDataToSend.append('nombreImagen', formData.nombreImagen);
        
        // Solo agregar archivos si se seleccionaron nuevos
        if (formData.video) {
          formDataToSend.append('video', formData.video);
        }
        if (formData.imagen) {
          formDataToSend.append('imagen', formData.imagen);
        }

        const response = await fetch(`https://api.cloudfitnessgym.com/api/maquinas/maquina/${editingMachine.machineId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (response.ok && data.success) {
          await fetchMachines(); // Recargar lista
          setSuccess('Máquina actualizada exitosamente');
          resetForm();
          setShowAddModal(false);
          setEditingMachine(null);
        } else {
          setError(data.message || 'Error al actualizar máquina');
        }
      } else {
        // Crear nueva máquina
        const newMachineId = generateMachineId();
        
        formDataToSend.append('machineId', newMachineId);
        formDataToSend.append('nombre', formData.nombre);
        formDataToSend.append('categoria', formData.categoria);
        formDataToSend.append('pesos', formData.pesos);
        formDataToSend.append('cantidad', formData.cantidad);
        formDataToSend.append('nombreVideo', formData.nombreVideo);
        formDataToSend.append('nombreImagen', formData.nombreImagen);
        formDataToSend.append('video', formData.video);
        formDataToSend.append('imagen', formData.imagen);
        
        console.log('Enviando datos:', {
          machineId: newMachineId,
          nombre: formData.nombre,
          categoria: formData.categoria,
          pesos: formData.pesos,
          cantidad: formData.cantidad,
          nombreVideo: formData.nombreVideo,
          nombreImagen: formData.nombreImagen
        });
        
        const response = await fetch('https://api.cloudfitnessgym.com/api/maquinas/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (response.ok && data.success) {
          await fetchMachines(); // Recargar lista
          setSuccess(`Máquina creada exitosamente! ID: ${newMachineId}`);
          resetForm();
          setShowAddModal(false);
        } else {
          setError(data.message || 'Error al crear máquina');
        }
      }
    } catch (error) {
      console.error('Error saving machine:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      pesos: '',
      cantidad: '',
      nombreVideo: '',
      nombreImagen: '',
      video: null,
      imagen: null
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setFormData({
      nombre: machine.nombre || '',
      categoria: machine.categoria || '',
      pesos: machine.pesos || '',
      cantidad: machine.cantidad?.toString() || '',
      nombreVideo: machine.nombreVideo || '',
      nombreImagen: machine.nombreImagen || '',
      video: null, // No mostrar archivo actual
      imagen: null // No mostrar archivo actual
    });
    setError('');
    setSuccess('');
    setShowAddModal(true);
  };

  const handleDelete = async (machineId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta máquina? Esta acción no se puede deshacer.')) {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://api.cloudfitnessgym.com/api/maquinas/maquina/${machineId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          await fetchMachines(); // Recargar lista
          setSuccess('Máquina eliminada exitosamente');
        } else {
          setError(data.message || 'Error al eliminar máquina');
        }
      } catch (error) {
        console.error('Error deleting machine:', error);
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setEditingMachine(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowDetailsModal(false);
    setEditingMachine(null);
    setSelectedMachine(null);
    resetForm();
  };

  const openDetailsModal = (machine) => {
    setSelectedMachine(machine);
    setShowDetailsModal(true);
  };

  const getCategoryIcon = (categoria) => {
    const icons = {
      'cardio': '🏃‍♂️',
      'fuerza': '💪',
      'funcional': '🤸‍♂️',
      'libre': '🏋️‍♂️'
    };
    return icons[categoria] || '🏋️‍♂️';
  };

  // Estadísticas
  const stats = {
    total: machines.reduce((sum, machine) => sum + (parseInt(machine.cantidad) || 0), 0),
    tipos: machines.length,
    cardio: machines.filter(m => m.categoria === 'cardio').reduce((sum, machine) => sum + (parseInt(machine.cantidad) || 0), 0),
    fuerza: machines.filter(m => m.categoria === 'fuerza').reduce((sum, machine) => sum + (parseInt(machine.cantidad) || 0), 0),
    funcional: machines.filter(m => m.categoria === 'funcional').reduce((sum, machine) => sum + (parseInt(machine.cantidad) || 0), 0),
    libre: machines.filter(m => m.categoria === 'libre').reduce((sum, machine) => sum + (parseInt(machine.cantidad) || 0), 0)
  };

  return (
    <div className="machines-management">
      <div className="section-header">
        <h2>Gestión de Máquinas</h2>
        <div className="users-stats">
          <div className="stat-card mini">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Máquinas</span>
          </div>
          <div className="stat-card mini">
            <span className="stat-number">{stats.tipos}</span>
            <span className="stat-label">Tipos</span>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="users-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterCategory === 'todas' ? 'active' : ''}`}
            onClick={() => setFilterCategory('todas')}
          >
            Todas ({stats.total} máquinas)
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'cardio' ? 'active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'cardio' ? 'todas' : 'cardio')}
          >
            🏃‍♂️ Cardio ({stats.cardio})
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'fuerza' ? 'active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'fuerza' ? 'todas' : 'fuerza')}
          >
            💪 Fuerza ({stats.fuerza})
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'funcional' ? 'active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'funcional' ? 'todas' : 'funcional')}
          >
            🤸‍♂️ Funcional ({stats.funcional})
          </button>
          <button 
            className={`filter-btn ${filterCategory === 'libre' ? 'active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === 'libre' ? 'todas' : 'libre')}
          >
            🏋️‍♂️ Libre ({stats.libre})
          </button>
        </div>
      </div>

      {/* Controles de búsqueda */}
      <div className="users-controls">
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar máquina por nombre, categoría, ID o pesos..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="users-controls">
        <button className="btn-primary" onClick={openAddModal} disabled={loading}>
          + Nueva Máquina
        </button>
      </div>

      {/* Mostrar mensajes de error y éxito */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando máquinas...</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredMachines.length === 0 ? (
            <div className="no-results">
              <p>No se encontraron máquinas</p>
            </div>
          ) : (
            filteredMachines.map(machine => (
              <div key={machine.machineId} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar-section">
                    <div className="user-avatar-large">
                      {getCategoryIcon(machine.categoria)}
                    </div>
                    <div className="user-info-primary">
                      <h4 className="user-full-name">{machine.nombre}</h4>
                      <p className="user-id">ID: {machine.machineId}</p>
                    </div>
                  </div>
                  <div className="user-status-section">
                    <span className="status-text">{machine.categoria}</span>
                  </div>
                </div>

                <div className="user-card-body">
                  <div className="user-detail-row">
                    <span className="detail-icon">🔢</span>
                    <span className="detail-text">Cantidad: {machine.cantidad}</span>
                  </div>
                  <div className="user-detail-row">
                    <span className="detail-icon">⚖️</span>
                    <span className="detail-text">{machine.pesos}</span>
                  </div>
                  <div className="user-detail-row">
                    <span className="detail-icon">🎬</span>
                    <span className="detail-text">{machine.nombreVideo}</span>
                  </div>
                  <div className="user-detail-row">
                    <span className="detail-icon">🖼️</span>
                    <span className="detail-text">{machine.nombreImagen}</span>
                  </div>
                </div>

                <div className="user-card-footer">
                  <button
                    className="action-btn view-btn"
                    onClick={() => openDetailsModal(machine)}
                    title="Ver Detalles"
                    disabled={loading}
                  >
                    <span>👁️</span>
                    Ver Detalles
                  </button>
                  
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleEdit(machine)}
                    title="Editar"
                    disabled={loading}
                  >
                    <span>✏️</span>
                    Editar
                  </button>
                  
                  <button
                    className="action-btn suspend-btn"
                    onClick={() => handleDelete(machine.machineId)}
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

      {/* Modal para agregar/editar máquina */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMachine ? 'Editar Máquina' : 'Nueva Máquina'}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <form className="employee-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de la Máquina *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Caminadora ProFit 3000"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
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
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pesos Disponibles *</label>
                    <input
                      type="text"
                      name="pesos"
                      value={formData.pesos}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 10kg, 15kg, 20kg, 25kg"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Cantidad de Máquinas *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 5"
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del Video *</label>
                    <input
                      type="text"
                      name="nombreVideo"
                      value={formData.nombreVideo}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: tutorial_caminadora.mp4"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nombre de la Imagen *</label>
                    <input
                      type="text"
                      name="nombreImagen"
                      value={formData.nombreImagen}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: caminadora_principal.jpg"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Video Tutorial {editingMachine ? '(opcional)' : '*'}</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, 'video')}
                      required={!editingMachine}
                    />
                    {formData.video && <p style={{fontSize: '12px', color: '#666'}}>Archivo: {formData.video.name}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label>Imagen de la Máquina {editingMachine ? '(opcional)' : '*'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'imagen')}
                      required={!editingMachine}
                    />
                    {formData.imagen && <p style={{fontSize: '12px', color: '#666'}}>Archivo: {formData.imagen.name}</p>}
                  </div>
                </div>

                {!editingMachine && (
                  <div className="info-note">
                    <p><strong>Información automática:</strong></p>
                    <ul>
                      <li>📋 Se generará automáticamente un ID único de máquina (80XXXX)</li>
                      <li>📁 Los archivos se guardarán en el servidor con los nombres especificados</li>
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
                {loading ? 'Guardando...' : (editingMachine ? 'Actualizar' : 'Crear')} Máquina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedMachine && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMachine.nombre}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="machine-details">
                <div className="detail-section">
                  <img
                    src={`http://localhost:5000/uploads/${selectedMachine.nombreImagen}`}
                    alt={selectedMachine.nombre}
                    className="machine-detail-image"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.src = '/placeholder-machine.jpg';
                    }}
                  />
                </div>
                
                <div className="detail-section">
                  <h4>Información General</h4>
                  <p><strong>ID:</strong> {selectedMachine.machineId}</p>
                  <p><strong>Categoría:</strong> {selectedMachine.categoria}</p>
                  <p><strong>Cantidad:</strong> {selectedMachine.cantidad} máquinas</p>
                  <p><strong>Pesos Disponibles:</strong> {selectedMachine.pesos}</p>
                  
                  <h4>Archivos</h4>
                  <p><strong>Video:</strong> {selectedMachine.nombreVideo}</p>
                  <p><strong>Imagen:</strong> {selectedMachine.nombreImagen}</p>
                  
                  <div className="video-section">
                    <h4>Video Tutorial</h4>
                    <video
                      controls
                      width="100%"
                      style={{ maxWidth: '400px' }}
                    >
                      <source src={`http://localhost:5000/uploads/${selectedMachine.nombreVideo}`} type="video/mp4" />
                      Tu navegador no soporta el elemento video.
                    </video>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinesManagement;