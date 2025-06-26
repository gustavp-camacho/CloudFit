const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  // Referencia al usuario básico
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // ID personalizado generado por el frontend (50XXXX)
  customUserId: {
    type: String,
    required: true,
    unique: true,
    match: [/^50\d{4}$/, 'ID de usuario debe empezar con 50 y tener 6 dígitos']
  },
  
  // Información personal adicional
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos']
  },
  
  // Información del plan seleccionado
  planType: {
    type: String,
    required: true,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  planPrice: {
    type: Number,
    required: true
  },
  
  // Información de pago
  paymentInfo: {
    cardNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(v);
        },
        message: 'Formato de tarjeta inválido'
      }
    },
    cardName: {
      type: String,
      required: true,
      match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/, 'Nombre en tarjeta inválido']
    },
    expiryDate: {
      type: String,
      required: true,
      match: [/^\d{2}\/\d{2}$/, 'Fecha de vencimiento debe ser MM/AA']
    },
    cvv: {
      type: String,
      required: true,
      match: [/^\d{3}$/, 'CVV debe tener 3 dígitos']
    },
    billingAddress: {
      type: String,
      required: true,
      minlength: 5
    },
    city: {
      type: String,
      required: true,
      match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/, 'Ciudad debe contener solo letras']
    },
    postalCode: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{5}$/.test(v) || /^[A-Za-z0-9\s-]{3,10}$/.test(v);
        },
        message: 'Código postal inválido'
      }
    }
  },
  
  // Información de suscripción
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'expired'],
    default: 'active'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'info_users', // NOMBRE ESPECÍFICO DE LA COLECCIÓN
  timestamps: true
});

// Middleware para actualizar updatedAt antes de guardar
userInfoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para ocultar información sensible en las respuestas JSON
userInfoSchema.methods.toJSON = function() {
  const userInfo = this.toObject();
  // En producción, también eliminar información sensible de pago
  if (userInfo.paymentInfo && userInfo.paymentInfo.cardNumber) {
    userInfo.paymentInfo = {
      cardNumber: `****-****-****-${userInfo.paymentInfo.cardNumber.slice(-4)}`,
      cardName: userInfo.paymentInfo.cardName,
      expiryDate: userInfo.paymentInfo.expiryDate,
      // No incluir CVV en respuestas
      billingAddress: userInfo.paymentInfo.billingAddress,
      city: userInfo.paymentInfo.city,
      postalCode: userInfo.paymentInfo.postalCode
    };
  }
  return userInfo;
};

// Método para verificar si la suscripción está activa
userInfoSchema.methods.isSubscriptionActive = function() {
  return this.subscriptionStatus === 'active' && 
         this.subscriptionEndDate > new Date();
};

const UserInfo = mongoose.model('UserInfo', userInfoSchema, 'info_users');

module.exports = UserInfo;