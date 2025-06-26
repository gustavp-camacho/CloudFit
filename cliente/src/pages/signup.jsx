//signup.jsx
import React, { useState } from 'react';
import './signup.css';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Datos iniciales
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Plan seleccionado
    planType: '',
    
    // Datos de tarjeta
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateUserId = () => {
    // Genera ID de 6 números que empiece con 50
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `50${randomDigits}`;
  };

  // Validaciones específicas
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

  const validateCardNumber = (cardNumber) => {
    // Eliminar espacios y verificar que tenga exactamente 16 dígitos
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleanNumber);
  };

  const validateExpiryDate = (expiryDate) => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt('20' + year, 10); // Convertir YY a YYYY
    
    // Validar mes (01-12)
    if (monthNum < 1 || monthNum > 12) return false;
    
    // Validar que la fecha sea superior a hoy
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11
    
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum <= currentMonth) return false;
    
    return true;
  };

  const validateCVV = (cvv) => {
    return /^\d{3}$/.test(cvv);
  };

  const validatePostalCode = (postalCode) => {
    // Acepta códigos postales de México (5 dígitos) o internacionales
    return /^\d{5}$/.test(postalCode) || /^[A-Za-z0-9\s-]{3,10}$/.test(postalCode);
  };

  const validateName = (name) => {
    // Solo letras, espacios y acentos, mínimo 2 caracteres
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(name);
  };

  const validateUsername = (username) => {
    // 3-20 caracteres, solo letras, números y guiones bajos
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,20}$/.test(username);
  };

  const handleInputChange = (field, value) => {
    // Aplicar formato específico según el campo
    let formattedValue = value;
    
    switch(field) {
      case 'phone':
        // Solo permitir números y limitar a 10 dígitos
        formattedValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').slice(0, 3);
        break;
      case 'firstName':
      case 'lastName':
        // Solo letras, espacios y acentos
        formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        break;
      case 'username':
        // Solo letras, números y guiones bajos
        formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        break;
      case 'postalCode':
        // Para códigos postales de México, solo números
        if (value.length <= 5) {
          formattedValue = value.replace(/\D/g, '');
        }
        break;
      default:
        // Para campos que no necesitan formato especial
        formattedValue = value;
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    setError('');
  };

  const validateStep1 = () => {
    const { username, email, password, confirmPassword, phone } = formData;
    
    if (!username || !email || !password || !confirmPassword || !phone) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    
    if (!validateUsername(username)) {
      setError('El nombre de usuario debe tener 3-20 caracteres y solo puede contener letras, números y guiones bajos');
      return false;
    }
    
    if (!validateEmail(email)) {
      setError('Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)');
      return false;
    }
    
    if (!validatePhone(phone)) {
      setError('El teléfono debe tener exactamente 10 dígitos numéricos');
      return false;
    }
    
    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres, incluyendo al menos una letra y un número');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.planType) {
      setError('Selecciona un plan de suscripción');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const { cardNumber, cardName, expiryDate, cvv, billingAddress, city, postalCode } = formData;
    
    if (!cardNumber || !cardName || !expiryDate || !cvv || !billingAddress || !city || !postalCode) {
      setError('Todos los campos de pago son obligatorios');
      return false;
    }
    
    if (!validateCardNumber(cardNumber)) {
      setError('El número de tarjeta debe tener exactamente 16 dígitos');
      return false;
    }
    
    if (!validateName(cardName)) {
      setError('El nombre en la tarjeta debe contener solo letras');
      return false;
    }
    
    if (!validateExpiryDate(expiryDate)) {
      setError('La fecha de vencimiento debe ser válida (MM/AA) y superior a la fecha actual');
      return false;
    }
    
    if (!validateCVV(cvv)) {
      setError('El CVV debe tener exactamente 3 dígitos');
      return false;
    }
    
    if (billingAddress.trim().length < 5) {
      setError('La dirección de facturación debe tener al menos 5 caracteres');
      return false;
    }
    
    if (!validateName(city)) {
      setError('La ciudad debe contener solo letras');
      return false;
    }
    
    if (!validatePostalCode(postalCode)) {
      setError('El código postal debe tener 5 dígitos (México) o formato internacional válido');
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    let isValid = false;
    
    switch(currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    try {
      const newUserId = generateUserId();
      
      const response = await fetch('https://api.cloudfitnessgym.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: newUserId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`¡Cuenta creada exitosamente! Tu ID de usuario es: ${newUserId}`);
        setError('');
      } else {
        setError(data.message || 'Error al crear la cuenta');
        setSuccess('');
      }
    } catch (error) {
      setError('Error de conexión al servidor.');
      setSuccess('');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="signup-container">
      <div className="signup-image">
        <img src="cloudfit_l.png" alt="Icono Usuario" />
      </div>
      
      {/* Barra de progreso */}
      <div className="progress-bar">
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      {/* Paso 1: Datos Iniciales */}
      {currentStep === 1 && (
        <div className="step-content">
          <h2>Datos Iniciales</h2>
          <label>Nombre de Usuario:</label>
          <input
            type="text"
            placeholder="Usuario (3-20 caracteres, letras, números, _)"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            maxLength="20"
            required
          />
          
          <label>Correo Electrónico:</label>
          <input
            type="email"
            placeholder="ejemplo@dominio.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
          
          <label>Teléfono:</label>
          <input
            type="tel"
            placeholder="1234567890 (10 dígitos)"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            maxLength="10"
            required
          />
          
          <div className="form-row">
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                placeholder="Mín. 6 caracteres, letras y números"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña:</label>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Paso 2: Selección de Plan */}
      {currentStep === 2 && (
        <div className="step-content">
          <h2>Selecciona tu Plan</h2>
          <div className="plan-options">
            <div 
              className={`plan-card ${formData.planType === 'monthly' ? 'selected' : ''}`}
              onClick={() => handleInputChange('planType', 'monthly')}
            >
              <div className="plan-header">
                <h3>Plan Mensual</h3>
                <div className="price">$29.99<span>/mes</span></div>
              </div>
              <ul className="plan-features">
                <li>Acceso completo a la plataforma</li>
                <li>Soporte técnico 24/7</li>
                <li>Actualizaciones incluidas</li>
                <li>Facturación mensual</li>
              </ul>
            </div>
            
            <div 
              className={`plan-card ${formData.planType === 'annual' ? 'selected' : ''}`}
              onClick={() => handleInputChange('planType', 'annual')}
            >
              <div className="plan-header">
                <h3>Plan Anual</h3>
                <div className="price">$299.99<span>/año</span></div>
                <div className="discount">¡Ahorra 2 meses!</div>
              </div>
              <ul className="plan-features">
                <li>Acceso completo a la plataforma</li>
                <li>Soporte técnico prioritario</li>
                <li>Actualizaciones incluidas</li>
                <li>Descuento por pago anual</li>
                <li>Funciones premium exclusivas</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Datos de Pago */}
      {currentStep === 3 && (
        <div className="step-content">
          <h2>Información de Pago</h2>
          <div className="payment-summary">
            <h3>Resumen del Plan:</h3>
            <p>{formData.planType === 'monthly' ? 'Plan Mensual - $29.99/mes' : 'Plan Anual - $299.99/año'}</p>
          </div>
          
          <label>Número de Tarjeta:</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            maxLength="19"
            required
          />
          
          <label>Nombre en la Tarjeta:</label>
          <input
            type="text"
            placeholder="Nombre como aparece en la tarjeta"
            value={formData.cardName}
            onChange={(e) => handleInputChange('cardName', e.target.value)}
            required
          />
          
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Vencimiento:</label>
              <input
                type="text"
                placeholder="MM/AA (superior a hoy)"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength="5"
                required
              />
            </div>
            <div className="form-group">
              <label>CVV:</label>
              <input
                type="text"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength="3"
                required
              />
            </div>
          </div>
          
          <label>Dirección de Facturación:</label>
          <input
            type="text"
            placeholder="Calle y número"
            value={formData.billingAddress}
            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
            required
          />
          
          <div className="form-row">
            <div className="form-group">
              <label>Ciudad:</label>
              <input
                type="text"
                placeholder="Ciudad (solo letras)"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Código Postal:</label>
              <input
                type="text"
                placeholder="12345 (5 dígitos)"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                maxLength="5"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="form-navigation">
        {currentStep > 1 && (
          <button type="button" onClick={prevStep} className="login-btn btn-secondary">
            Anterior
          </button>
        )}
        
        {currentStep < 3 ? (
          <button type="button" onClick={nextStep} className="login-btn">
            Siguiente
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="login-btn">
            Completar Registro
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <p>¿Ya tienes una cuenta? <a href="/">Iniciar Sesión</a></p>
    </div>
  );
};

export default Signup;