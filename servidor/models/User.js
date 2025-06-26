const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    // Regex más permisivo para usuarios existentes
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._\s-]{3,50}$/.test(v);
      },
      message: 'Username debe contener solo letras, números, guiones bajos, guiones o puntos'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'empleado'],
    default: 'user'
  }
}, {
  timestamps: false, // No agregar createdAt/updatedAt automáticamente
  versionKey: '__v'  // Mantener __v (debe ser string, no boolean)
});

// Método para ocultar la contraseña en las respuestas JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;