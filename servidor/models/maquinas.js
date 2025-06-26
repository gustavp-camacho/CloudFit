//models/maquinas.js
const mongoose = require('mongoose');

const machineInfoSchema = new mongoose.Schema({
  // ID personalizado de la máquina (80XXXX)
  machineId: {
    type: String,
    required: true,
    unique: true,
    match: [/^80\d{4}$/, 'ID de máquina debe empezar con 80 y tener 6 dígitos']
  },
  
  // Nombre de la máquina
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
    validate: {
      validator: function(v) {
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-._]{3,100}$/.test(v);
      },
      message: 'Nombre debe contener solo letras, números, espacios y caracteres básicos'
    }
  },
  
  // Categoría de la máquina
  categoria: {
    type: String,
    required: true,
    enum: ['cardio', 'fuerza', 'funcional', 'libre'],
    default: 'cardio'
  },
  
  // Pesos disponibles (descripción)
  pesos: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  
  // Cantidad de máquinas de este tipo
  cantidad: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1'],
    max: [999, 'La cantidad no puede ser mayor a 999'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'La cantidad debe ser un número entero positivo'
    }
  },
  
  // Nombre del archivo de video
  nombreVideo: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 255,
    validate: {
      validator: function(v) {
        // Validar que tenga extensión de video
        return /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(v);
      },
      message: 'Nombre del video debe incluir extensión válida (.mp4, .avi, .mov, .wmv, .flv, .webm)'
    }
  },
  
  // Nombre del archivo de imagen
  nombreImagen: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 255,
    validate: {
      validator: function(v) {
        // Validar que tenga extensión de imagen
        return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(v);
      },
      message: 'Nombre de imagen debe incluir extensión válida (.jpg, .jpeg, .png, .gif, .bmp, .webp)'
    }
  },
  
  // Estado de la máquina
  status: {
    type: String,
    enum: ['available', 'maintenance', 'out_of_service'],
    default: 'available'
  },
  
  // Fecha de registro de la máquina
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  // Notas adicionales (opcional)
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  collection: 'info_machines', // NOMBRE ESPECÍFICO DE LA COLECCIÓN
  timestamps: true // Usar timestamps automáticos como en empleados
});

// Middleware para actualizar updatedAt antes de guardar
machineInfoSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Método para validar si el nombre ya existe
machineInfoSchema.statics.isNombreExists = async function(nombre, excludeId = null) {
  const query = { nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } }; // Case insensitive
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const machine = await this.findOne(query);
  return !!machine;
};

// Método para validar si el machineId ya existe
machineInfoSchema.statics.isMachineIdExists = async function(machineId, excludeId = null) {
  const query = { machineId };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const machine = await this.findOne(query);
  return !!machine;
};

// Método para validar si el nombre del video ya existe
machineInfoSchema.statics.isNombreVideoExists = async function(nombreVideo, excludeId = null) {
  const query = { nombreVideo: { $regex: new RegExp(`^${nombreVideo}$`, 'i') } };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const machine = await this.findOne(query);
  return !!machine;
};

// Método para validar si el nombre de la imagen ya existe
machineInfoSchema.statics.isNombreImagenExists = async function(nombreImagen, excludeId = null) {
  const query = { nombreImagen: { $regex: new RegExp(`^${nombreImagen}$`, 'i') } };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const machine = await this.findOne(query);
  return !!machine;
};

// Método estático para obtener estadísticas por categoría
machineInfoSchema.statics.getStatsByCategory = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: '$categoria',
          count: { $sum: '$cantidad' },
          tipos: { $sum: 1 }
        }
      }
    ]);
    
    return stats.reduce((acc, stat) => {
      acc[stat._id] = {
        cantidad: stat.count,
        tipos: stat.tipos
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {};
  }
};

// Virtual para obtener la URL del video
machineInfoSchema.virtual('videoUrl').get(function() {
  return this.nombreVideo ? `/uploads/${this.nombreVideo}` : null;
});

// Virtual para obtener la URL de la imagen
machineInfoSchema.virtual('imagenUrl').get(function() {
  return this.nombreImagen ? `/uploads/${this.nombreImagen}` : null;
});

// Virtual para obtener el total de máquinas de este tipo
machineInfoSchema.virtual('totalMachines').get(function() {
  return this.cantidad;
});

// Asegurar que los virtuals se incluyan en JSON
machineInfoSchema.set('toJSON', { virtuals: true });

// Índices para optimizar búsquedas
machineInfoSchema.index({ machineId: 1 });
machineInfoSchema.index({ nombre: 1 });
machineInfoSchema.index({ categoria: 1 });
machineInfoSchema.index({ status: 1 });
machineInfoSchema.index({ nombreVideo: 1 });
machineInfoSchema.index({ nombreImagen: 1 });

const Machine = mongoose.model('Machine', machineInfoSchema, 'info_machines');

module.exports = Machine;