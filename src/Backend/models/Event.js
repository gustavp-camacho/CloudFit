const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['fitness', 'yoga', 'crossfit', 'spinning', 'pilates', 'zumba', 'other'],
    default: 'fitness'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  instructorName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  duration: {
    type: Number, // en minutos
    required: true,
    min: 15,
    max: 480 // máximo 8 horas
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  availableSpots: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  equipment: [{
    type: String,
    trim: true
  }],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled', 'attended'],
      default: 'registered'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt antes de guardar
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calcular spots disponibles
  const registeredCount = this.registeredUsers.filter(
    reg => reg.status === 'registered'
  ).length;
  this.availableSpots = this.capacity - registeredCount;
  
  next();
});

// Índices para mejorar las consultas
eventSchema.index({ date: 1, startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ instructor: 1 });
eventSchema.index({ isActive: 1 });

// Método para verificar si un usuario está registrado
eventSchema.methods.isUserRegistered = function(userId) {
  return this.registeredUsers.some(
    reg => reg.user.toString() === userId.toString() && reg.status === 'registered'
  );
};

// Método para registrar un usuario
eventSchema.methods.registerUser = function(userId) {
  if (this.availableSpots <= 0) {
    throw new Error('No hay cupos disponibles');
  }
  
  if (this.isUserRegistered(userId)) {
    throw new Error('Usuario ya registrado en este evento');
  }
  
  this.registeredUsers.push({
    user: userId,
    status: 'registered'
  });
  
  return this.save();
};

// Método para cancelar registro de usuario
eventSchema.methods.cancelUserRegistration = function(userId) {
  const registration = this.registeredUsers.find(
    reg => reg.user.toString() === userId.toString() && reg.status === 'registered'
  );
  
  if (!registration) {
    throw new Error('Usuario no está registrado en este evento');
  }
  
  registration.status = 'cancelled';
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;