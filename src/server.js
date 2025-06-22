require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./Backend/config/database');
const corsOptions = require('./Backend/config/cors');
const errorHandler = require('./Backend/middleware/errorHandler');
const authRoutes = require('./Backend/routes/auth');
const eventRoutes = require('./Backend/routes/events');

// Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(express.json());
app.use(cors(corsOptions));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Manejo de errores global
app.use(errorHandler);

// Iniciar el servidor
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
};

start();