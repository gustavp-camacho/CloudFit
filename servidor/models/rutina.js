//models/rutina.js
const mongoose = require('mongoose');

// Schema para ejercicios individuales dentro de una rutina
const exerciseSchema = new mongoose.Schema({
  // ID temporal del frontend (para compatibilidad)
  id: {
    type: Number,
    required: true
  },
  
  // Nombre personalizado del ejercicio
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  
  // Tipo de equipo: 'machine', 'bodyweight', 'weights'
  equipmentType: {
    type: String,
    required: true,
    enum: ['machine', 'bodyweight', 'weights']
  },
  
  // Referencia a la máquina (si equipmentType es 'machine')
  machine: {
    machineId: String,
    nombre: String,
    categoria: String,
    cantidad: Number,
    pesos: String
  },
  
  // Configuración del ejercicio
  sets: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  
  reps: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  },
  
  rest: {
    type: Number,
    required: true,
    min: 30,
    max: 1200
  },
  
  // Fecha de creación del ejercicio
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // No generar _id para subdocumentos

// Schema principal de rutina
const routineSchema = new mongoose.Schema({
  // Referencia al usuario que creó la rutina
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ID temporal del frontend (para compatibilidad)
  id: {
    type: Number,
    required: true
  },
  
  // Nombre de la rutina
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
    validate: {
      validator: function(v) {
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-._]{1,100}$/.test(v);
      },
      message: 'Nombre debe contener solo letras, números, espacios y caracteres básicos'
    }
  },
  
  // Descripción opcional de la rutina
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Días de la semana asignados a esta rutina
  selectedDays: [{
    type: String,
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  }],
  
  // Array de ejercicios en esta rutina
  exercises: [exerciseSchema],
  
  // Estado de la rutina
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // Metadatos adicionales
  totalExercises: {
    type: Number,
    default: 0
  },
  
  estimatedDuration: {
    type: Number, // en minutos
    default: 0
  }
}, {
  collection: 'user_routines',
  timestamps: true
});

// Middleware para calcular metadatos antes de guardar
routineSchema.pre('save', function(next) {
  // Actualizar total de ejercicios
  this.totalExercises = this.exercises.length;
  
  // Calcular duración estimada (simplificado)
  this.estimatedDuration = this.exercises.reduce((total, exercise) => {
    // Tiempo estimado por ejercicio = (series * (tiempo_rep_estimado + descanso))
    const timePerSet = 30; // 30 segundos estimados por serie (reps + cambio de peso)
    const exerciseTime = exercise.sets * (timePerSet + exercise.rest);
    return total + Math.round(exerciseTime / 60); // convertir a minutos
  }, 0);
  
  next();
});

// Métodos estáticos

// Verificar si un usuario ya tiene una rutina para un día específico
routineSchema.statics.hasRoutineForDay = async function(userId, day, excludeRoutineId = null) {
  const query = {
    userId,
    selectedDays: day,
    status: { $ne: 'archived' }
  };
  
  if (excludeRoutineId) {
    query._id = { $ne: excludeRoutineId };
  }
  
  const routine = await this.findOne(query);
  return !!routine;
};

// Obtener todas las rutinas de un usuario
routineSchema.statics.getUserRoutines = async function(userId) {
  try {
    const routines = await this.find({ 
      userId,
      status: { $ne: 'archived' }
    }).sort({ createdAt: -1 });
    
    return routines;
  } catch (error) {
    console.error('Error al obtener rutinas del usuario:', error);
    return [];
  }
};

// Obtener rutina para un día específico
routineSchema.statics.getRoutineForDay = async function(userId, day) {
  try {
    const routine = await this.findOne({
      userId,
      selectedDays: day,
      status: 'active'
    });
    
    return routine;
  } catch (error) {
    console.error('Error al obtener rutina del día:', error);
    return null;
  }
};

// Métodos de instancia

// Verificar si la rutina tiene conflictos con otras rutinas del usuario
routineSchema.methods.hasConflicts = async function() {
  const conflicts = [];
  
  for (const day of this.selectedDays) {
    const hasConflict = await this.constructor.hasRoutineForDay(this.userId, day, this._id);
    if (hasConflict) {
      conflicts.push(day);
    }
  }
  
  return conflicts;
};

// Archivar rutina en lugar de eliminarla
routineSchema.methods.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

// Duplicar rutina
routineSchema.methods.duplicate = function(newName, newDays) {
  const duplicated = new this.constructor({
    userId: this.userId,
    id: Date.now(), // Nuevo ID temporal
    name: newName || `${this.name} (copia)`,
    description: this.description,
    selectedDays: newDays || [],
    exercises: this.exercises.map(exercise => ({
      ...exercise.toObject(),
      id: Date.now() + Math.random() * 1000 // Nuevo ID para cada ejercicio
    })),
    status: 'active'
  });
  
  return duplicated;
};

// Índices para optimizar búsquedas
routineSchema.index({ userId: 1 });
routineSchema.index({ userId: 1, selectedDays: 1 });
routineSchema.index({ userId: 1, status: 1 });
routineSchema.index({ createdAt: -1 });

// Virtual para obtener estadísticas de la rutina
routineSchema.virtual('stats').get(function() {
  const equipmentStats = this.exercises.reduce((stats, exercise) => {
    stats[exercise.equipmentType] = (stats[exercise.equipmentType] || 0) + 1;
    return stats;
  }, {});
  
  return {
    totalExercises: this.totalExercises,
    estimatedDuration: this.estimatedDuration,
    daysPerWeek: this.selectedDays.length,
    equipmentBreakdown: equipmentStats
  };
});

// Asegurar que los virtuals se incluyan en JSON
routineSchema.set('toJSON', { virtuals: true });

const Routine = mongoose.model('Routine', routineSchema, 'user_routines');

module.exports = Routine;