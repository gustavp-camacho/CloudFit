//models/cita.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Referencia al usuario que agenda la cita
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ID del empleado (del sistema de empleados)
  employeeId: {
    type: String,
    required: true,
    match: [/^70\d{4}$/, 'ID de empleado debe empezar con 70 y tener 6 dígitos']
  },
  
  // Información del empleado (desnormalizada para performance)
  employee: {
    employeeId: String,
    name: String,
    position: String,
    phone: String,
    email: String
  },
  
  // Tipo de servicio
  serviceType: {
    type: String,
    required: true,
    enum: ['barbero', 'estilista', 'coach'],
    lowercase: true
  },
  
  // Nombre del servicio
  serviceName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Duración del servicio en minutos
  serviceDuration: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  
  // Fecha de la cita (formato YYYY-MM-DD)
  date: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD']
  },
  
  // Hora de la cita (formato HH:MM)
  time: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora debe estar en formato HH:MM']
  },
  
  // Estado de la cita
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  
  // Notas adicionales
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Información de cancelación (si aplica)
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['client', 'employee', 'admin']
    },
    reason: String
  },
  
  // Información de confirmación
  confirmation: {
    confirmedAt: Date,
    confirmedBy: {
      type: String,
      enum: ['employee', 'admin', 'system']
    }
  },
  
  // Precio del servicio (opcional)
  price: {
    type: Number,
    min: 0
  },
  
  // Recordatorios enviados
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }]
}, {
  collection: 'Citas',
  timestamps: true
});

// Índices para optimizar búsquedas
appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ employeeId: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ employeeId: 1, date: 1, time: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ serviceType: 1 });
appointmentSchema.index({ createdAt: -1 });

// Índice compuesto para verificar disponibilidad
appointmentSchema.index({ 
  employeeId: 1, 
  date: 1, 
  time: 1, 
  status: 1 
});

// Middleware para validar que no haya conflictos de horario
appointmentSchema.pre('save', async function(next) {
  // Solo validar en nuevas citas o cuando se cambia fecha/hora/empleado
  if (!this.isNew && !this.isModified('date') && !this.isModified('time') && !this.isModified('employeeId')) {
    return next();
  }

  // Solo validar citas activas (no canceladas)
  if (this.status === 'cancelled') {
    return next();
  }

  try {
    const conflictingAppointment = await this.constructor.findOne({
      employeeId: this.employeeId,
      date: this.date,
      time: this.time,
      status: { $nin: ['cancelled'] },
      _id: { $ne: this._id } // Excluir la cita actual si es una actualización
    });

    if (conflictingAppointment) {
      const error = new Error('Ya existe una cita para este empleado en el mismo horario');
      error.name = 'ConflictError';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar información del empleado antes de guardar
appointmentSchema.pre('save', async function(next) {
  // Si es una nueva cita o se cambió el empleado, actualizar info del empleado
  if (this.isNew || this.isModified('employeeId')) {
    try {
      const Employee = mongoose.model('Employee');
      const employee = await Employee.findOne({ employeeId: this.employeeId });
      
      if (!employee) {
        const error = new Error('Empleado no encontrado');
        error.name = 'EmployeeNotFoundError';
        return next(error);
      }

      // Verificar que el empleado esté activo
      if (employee.status !== 'active') {
        const error = new Error('El empleado no está disponible para citas');
        error.name = 'EmployeeUnavailableError';
        return next(error);
      }

      // Actualizar información del empleado
      this.employee = {
        employeeId: employee.employeeId,
        name: employee.username,
        position: employee.position,
        phone: employee.phone,
        email: employee.email
      };

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Métodos estáticos

// Verificar disponibilidad de un horario específico
appointmentSchema.statics.isTimeSlotAvailable = async function(employeeId, date, time, excludeAppointmentId = null) {
  try {
    const query = {
      employeeId,
      date,
      time,
      status: { $nin: ['cancelled'] }
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const conflictingAppointment = await this.findOne(query);
    return !conflictingAppointment;
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return false;
  }
};

// Obtener citas de un usuario
appointmentSchema.statics.getUserAppointments = async function(userId, filters = {}) {
  try {
    const query = { userId, ...filters };
    const appointments = await this.find(query)
      .sort({ date: 1, time: 1 })
      .lean();
    
    return appointments;
  } catch (error) {
    console.error('Error obteniendo citas del usuario:', error);
    return [];
  }
};

// Obtener citas de un empleado
appointmentSchema.statics.getEmployeeAppointments = async function(employeeId, filters = {}) {
  try {
    const query = { employeeId, ...filters };
    const appointments = await this.find(query)
      .sort({ date: 1, time: 1 })
      .lean();
    
    return appointments;
  } catch (error) {
    console.error('Error obteniendo citas del empleado:', error);
    return [];
  }
};

// Obtener citas de una fecha específica
appointmentSchema.statics.getAppointmentsByDate = async function(date, filters = {}) {
  try {
    const query = { date, ...filters };
    const appointments = await this.find(query)
      .sort({ time: 1 })
      .lean();
    
    return appointments;
  } catch (error) {
    console.error('Error obteniendo citas por fecha:', error);
    return [];
  }
};

// Obtener estadísticas de citas
appointmentSchema.statics.getAppointmentStats = async function(filters = {}) {
  try {
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const stats = await this.aggregate(pipeline);
    
    const result = {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    return result;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {};
  }
};

// Métodos de instancia

// Cancelar cita
appointmentSchema.methods.cancel = function(cancelledBy = 'client', reason = '') {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason
  };
  return this.save();
};

// Confirmar cita
appointmentSchema.methods.confirm = function(confirmedBy = 'system') {
  this.status = 'confirmed';
  this.confirmation = {
    confirmedAt: new Date(),
    confirmedBy
  };
  return this.save();
};

// Completar cita
appointmentSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// Marcar como no show
appointmentSchema.methods.markNoShow = function() {
  this.status = 'no_show';
  return this.save();
};

// Verificar si la cita puede ser cancelada
appointmentSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Verificar si la cita puede ser modificada
appointmentSchema.methods.canBeModified = function() {
  return ['pending'].includes(this.status);
};

// Calcular tiempo restante hasta la cita
appointmentSchema.methods.getTimeUntilAppointment = function() {
  const appointmentDateTime = new Date(`${this.date}T${this.time}:00`);
  const now = new Date();
  return appointmentDateTime - now;
};

// Verificar si la cita es hoy
appointmentSchema.methods.isToday = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.date === today;
};

// Virtual para obtener fecha y hora como Date object
appointmentSchema.virtual('appointmentDateTime').get(function() {
  return new Date(`${this.date}T${this.time}:00`);
});

// Asegurar que los virtuals se incluyan en JSON
appointmentSchema.set('toJSON', { virtuals: true });

const Appointment = mongoose.model('Citas', appointmentSchema, 'Citas');

module.exports = Appointment;