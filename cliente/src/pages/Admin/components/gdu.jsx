import React, { useState, useEffect } from 'react';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(12);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para el formulario de edición
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    planType: '',
    subscriptionStatus: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('Obteniendo usuarios...');

      const response = await fetch('http://18.219.156.200:5000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        setUsers(data.data || data); // Manejar estructura {success: true, data: []} o array directo
      } else {
        setError(data.message || 'Error al cargar usuarios');
       
      }
    } catch (error) {
      console.error('Error detallado:', error);
      setError('Error de conexión con el servidor. Asegúrate de que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.includes(searchTerm) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      planType: user.planType || '',
      subscriptionStatus: user.subscriptionStatus || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
    setEditForm({
      username: '',
      email: '',
      phone: '',
      planType: '',
      subscriptionStatus: ''
    });
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setShowDeleteModal(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Actualizando usuario:', selectedUser.id, editForm);

      const response = await fetch(`http://18.219.156.200:5000/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        // Actualizar el estado local con los datos devueltos o con el formulario
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === selectedUser.id ? { ...user, ...editForm } : user
          )
        );
        
        closeEditModal();
        alert('Usuario actualizado correctamente');
      } else {
        setError(data.message || 'Error al actualizar usuario');
        alert(data.message || 'Error al actualizar el usuario');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      setError('Error de conexión con el servidor');
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Eliminando usuario:', selectedUser.id);

      const response = await fetch(`http://18.219.156.200:5000/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        // Actualizar el estado local
        setUsers(prevUsers =>
          prevUsers.filter(user => user.id !== selectedUser.id)
        );
        
        closeDeleteModal();
        alert('Usuario eliminado correctamente');
      } else {
        setError(data.message || 'Error al eliminar usuario');
        alert(data.message || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      setError('Error de conexión con el servidor');
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="users-management">
      <div className="section-header">
        <h2>Gestión de Usuarios - CloudFit</h2>
        <div className="users-stats">
          <div className="stat-card mini">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Usuarios</span>
          </div>
        </div>
      </div>

      <div className="users-controls">
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por username, ID, nombre o email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchUsers}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      ) : (
        <>
          <div className="users-grid">
            {currentUsers.map(user => (
              <div key={user.id} className="user-card simplified">
                <div className="user-card-header">
                  <div className="user-info">
                    <h4 className="user-id">ID: {user.id}</h4>
                    <h3 className="username">@{user.username}</h3>
                    {user.fullName && <p className="full-name">{user.fullName}</p>}
                    {user.planType && <span className="plan-badge">{user.planType}</span>}
                  </div>
                </div>

                <div className="user-card-footer">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEditModal(user)}
                    title="Editar usuario"
                  >
                    <span>✏️</span>
                    Editar
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => openDeleteModal(user)}
                    title="Eliminar usuario"
                  >
                    <span>🗑️</span>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No se encontraron usuarios</h3>
              <p>Intenta ajustar la búsqueda</p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Anterior
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => paginate(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="page-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}

          <div className="pagination-info">
            Mostrando {indexOfFirstUser + 1} a {Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuarios
          </div>
        </>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="close-btn" onClick={closeEditModal}>✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group with-icon">
                <label>Username:</label>
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleFormChange}
                  required
                  placeholder="Ingresa el username"
                />
              </div>
              
              <div className="form-group with-icon">
                <label>Email:</label>
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleFormChange}
                  required
                  placeholder="ejemplo@email.com"
                />
              </div>
              
              <div className="form-group with-icon">
                <label>Teléfono:</label>
                <span className="input-icon">📱</span>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleFormChange}
                  placeholder="Número de teléfono"
                />
              </div>
              
              <div className="form-group with-icon">
                <label>Tipo de Plan:</label>
                <span className="input-icon">💳</span>
                <select
                  name="planType"
                  value={editForm.planType}
                  onChange={handleFormChange}
                >
                  <option value="">Seleccionar plan</option>
                  <option value="monthly">monthly</option>
                  <option value="annual">annual</option>
                </select>
              </div>
              
              <div className="form-group with-icon">
                <label>Estado de Suscripción:</label>
                <span className="input-icon">🔄</span>
                <select
                  name="subscriptionStatus"
                  value={editForm.subscriptionStatus}
                  onChange={handleFormChange}
                >
                  <option value="">Seleccionar estado</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="close-btn" onClick={closeDeleteModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                  ¿Estás seguro de que deseas eliminar al usuario <strong>@{selectedUser.username}</strong>?
                </p>
                <p className="warning-text">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDeleteModal}>
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteUser}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;