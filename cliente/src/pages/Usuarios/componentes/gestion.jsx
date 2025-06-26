import React, { useState, useEffect } from 'react';
import './gestion.css';

const ProfileManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Obtener datos directamente de localStorage (IGUAL QUE EL HEADER)
  const [userInfo, setUserInfo] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData;
  });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    planType: 'monthly',
    // Campos de tarjeta
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState({});

  // Inicializar formData con datos del localStorage (SIMPLE)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setFormData({
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      planType: userData.planType || 'monthly',
      // Datos de tarjeta vacíos por seguridad
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      billingAddress: '',
      city: '',
      postalCode: ''
    });
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatear valores específicos
    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'username') {
      formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 20);
    } else if (name === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = (matches && matches[0]) || '';
      const parts = [];
      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }
      if (parts.length) {
        formattedValue = parts.join(' ');
      } else {
        formattedValue = v;
      }
    } else if (name === 'expiryDate') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) {
        formattedValue = `${v.substring(0, 2)}/${v.substring(2, 4)}`;
      } else {
        formattedValue = v;
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    } else if (name === 'postalCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 5);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Username debe tener 3-20 caracteres, solo letras y espacios';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // GUARDAR - SIMPLE (solo localStorage, como el Header)
  const handleSave = () => {
    if (!validateForm()) return;

    try {
      // Actualizar localStorage (SIMPLE)
      const updatedUserData = {
        ...userInfo,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        planType: formData.planType
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setUserInfo(updatedUserData);
      setSuccess('Perfil actualizado exitosamente');
      setIsEditing(false);
      setError('');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    // Restaurar desde localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    setFormData({
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      planType: userData.planType || 'monthly',
      // Limpiar datos de tarjeta
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      billingAddress: '',
      city: '',
      postalCode: ''
    });
    
    setErrors({});
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const getPlanDisplayName = (planType) => {
    return planType === 'monthly' ? 'Plan Mensual' : 'Plan Anual';
  };

  const getPlanPrice = (planType) => {
    return planType === 'monthly' ? '$29.99/mes' : '$299.99/año';
  };

  // Si no hay datos de usuario
  if (!userInfo || !userInfo.username) {
    return (
      <div className="profile-management">
        <div className="no-user-data">
          <div className="empty-icon">👤</div>
          <h3>No hay datos de usuario</h3>
          <p>Por favor, inicia sesión nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-management">
      <div className="profile-header">
        <h2>⚙️ Gestión de Perfil</h2>
        {!isEditing ? (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            ✏️ Editar Perfil
          </button>
        ) : (
          <div className="action-buttons">
            <button className="save-btn" onClick={handleSave}>
              ✅ Guardar
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              ❌ Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className="profile-content">
        <div className="profile-sections">
          {/* Información Personal */}
          <div className="profile-section">
            <h3>👤 Información Personal</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de Usuario *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={errors.username ? 'error' : ''}
                  maxLength="20"
                  placeholder="Usuario (3-20 caracteres)"
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={errors.email ? 'error' : ''}
                  placeholder="ejemplo@dominio.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={errors.phone ? 'error' : ''}
                  placeholder="1234567890 (10 dígitos)"
                  maxLength="10"
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Plan de Suscripción */}
          <div className="profile-section">
            <h3>💳 Plan de Suscripción</h3>
            <div className="plan-info">
              <div className="current-plan">
                <div className="plan-details">
                  <span className="plan-label">Plan Actual:</span>
                  <span className={`plan-type ${formData.planType}`}>
                    {getPlanDisplayName(formData.planType)}
                  </span>
                  <span className="plan-price">
                    {getPlanPrice(formData.planType)}
                  </span>
                </div>
                
                {isEditing && (
                  <div className="plan-selector">
                    <label>Cambiar Plan:</label>
                    <select
                      name="planType"
                      value={formData.planType}
                      onChange={handleInputChange}
                    >
                      <option value="monthly">Plan Mensual - $29.99/mes</option>
                      <option value="annual">Plan Anual - $299.99/año</option>
                    </select>
                  </div>
                )}
              </div>

              {!isEditing && (
                <button className="upgrade-btn">
                  Cambiar Plan
                </button>
              )}
            </div>
          </div>

          {/* Información de Pago */}
          <div className="profile-section">
            <h3>💳 Información de Pago</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Número de Tarjeta</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                />
              </div>

              <div className="form-group">
                <label>Nombre en la Tarjeta</label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Nombre como aparece en la tarjeta"
                />
              </div>

              <div className="form-group">
                <label>Fecha de Vencimiento</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="MM/AA"
                  maxLength="5"
                />
              </div>

              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="123"
                  maxLength="3"
                />
              </div>

              <div className="form-group">
                <label>Dirección de Facturación</label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Calle y número"
                />
              </div>

              <div className="form-group">
                <label>Ciudad</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Ciudad"
                />
              </div>

              <div className="form-group">
                <label>Código Postal</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="12345"
                  maxLength="5"
                />
              </div>
            </div>
          </div>

          {/* Información de Cuenta */}
          <div className="profile-section">
            <h3>📊 Información de Cuenta</h3>
            <div className="account-details">
              <div className="detail-item">
                <span className="detail-label">👤 Usuario:</span>
                <span className="detail-value">{userInfo.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{userInfo.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">💳 Plan:</span>
                <span className="detail-value">
                  {getPlanDisplayName(userInfo.planType || 'monthly')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">💾 Estado:</span>
                <span className="detail-value">✅ Datos actualizados</span>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="profile-section">
            <h3>🔒 Seguridad</h3>
            <div className="security-options">
              <button className="security-btn">
                🔑 Cambiar Contraseña
              </button>
              <button className="security-btn danger">
                🗑️ Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;