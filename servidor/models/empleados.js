//models/empleados.js
const mongoose = require('mongoose');

const employeeInfoSchema = new mongoose.Schema({
  // Referencia al usuario básico en la colección 'users'
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // ID personalizado del empleado (70XXXX)
  employeeId: {
    type: String,
    required: true,
    unique: true,
    match: [/^70\d{4}$/, 'ID de empleado debe empezar con 70 y tener 6 dígitos']
  },
  
  // Username del usuario (debe coincidir con User) - consistente con el modelo User
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    validate: {
      validator: function(v) {
        // Mismo regex que en User.js para consistencia
        return /^[a-zA-Z0-9._\s-]{3,50}$/.test(v);
      },
      message: 'Username debe contener solo letras, números, guiones bajos, guiones o puntos'
    }
  },
  
  // Email del usuario (debe coincidir con User) - mismo formato que User.js
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email inválido']
  },
  
  // Teléfono (viene del frontend)
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos']
  },
  
  // Puesto de trabajo (viene del frontend)
  position: {
    type: String,
    required: true,
    enum: ['Barbero', 'Estilista', 'Coach'],
    default: 'Barbero'
  },
  
  // Rol siempre será 'empleado' - consistente con el enum de User
  role: {
    type: String,
    default: 'empleado',
    enum: ['empleado']
  },
  
  // Estado activo por defecto - consistente con User
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Fecha de inicio del empleado
  startDate: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'info_employees', // NOMBRE ESPECÍFICO DE LA COLECCIÓN
  timestamps: true // Usar timestamps automáticos como en User
});

// Middleware para actualizar updatedAt antes de guardar (redundante con timestamps: true, pero por si acaso)
employeeInfoSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Método estático para generar el próximo ID de empleado (REMOVIDO porque ahora lo genera el backend)
// El frontend ya genera el ID y lo envía al backend, igual que en el signup

// Método para validar si el username ya existe en empleados
employeeInfoSchema.statics.isUsernameExists = async function(username, excludeId = null) {
  const query = { username };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const employee = await this.findOne(query);
  return !!employee;
};

// Método para validar si el email ya existe en empleados
employeeInfoSchema.statics.isEmailExists = async function(email, excludeId = null) {
  const query = { email };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const employee = await this.findOne(query);
  return !!employee;
};

// Método para validar si el employeeId ya existe
employeeInfoSchema.statics.isEmployeeIdExists = async function(employeeId, excludeId = null) {
  const query = { employeeId };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const employee = await this.findOne(query);
  return !!employee;
};

// Virtual para compatibilidad con el frontend
employeeInfoSchema.virtual('fullName').get(function() {
  return this.username;
});

// Asegurar que los virtuals se incluyan en JSON
employeeInfoSchema.set('toJSON', { virtuals: true });

// Índices para optimizar búsquedas
employeeInfoSchema.index({ employeeId: 1 });
employeeInfoSchema.index({ username: 1 });
employeeInfoSchema.index({ email: 1 });
employeeInfoSchema.index({ status: 1 });

const Employee = mongoose.model('Employee', employeeInfoSchema, 'info_employees');

module.exports = Employee;