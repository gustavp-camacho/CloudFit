require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // ← AGREGAR ESTA LÍNEA
const connectDB = require('./config/database');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
//const eventRoutes = require('./routes/events');

let usersRoutes;
try {
 usersRoutes = require('./routes/users');
} catch (error) {
 console.error('Error cargando routes/users:', error.message);
}

let empleadosRoutes;
try {
 empleadosRoutes = require('./routes/empleados');
} catch (error) {
 console.error('Error cargando routes/empleados:', error.message);
}

let maquinasRoutes;
try {
 maquinasRoutes = require('./routes/maquinas');
} catch (error) {
 console.error('Error cargando routes/maquinas:', error.message);
}

let rutinasRoutes;
try {
 rutinasRoutes = require('./routes/rutinas');
} catch (error) {
 console.error('Error cargando routes/rutinas:', error.message);
}

let citasRoutes;
try {
 citasRoutes = require('./routes/citas');
} catch (error) {
 console.error('Error cargando routes/citas:', error.message);
}

// Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(express.json());
app.use(cors(corsOptions));


// ✅ AGREGAR ESTA LÍNEA - Servir archivos estáticos desde uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
//app.use('/api/events', eventRoutes);

if (usersRoutes) {
 app.use('/api/users', usersRoutes);
}

if (empleadosRoutes) {
 app.use('/api/empleados', empleadosRoutes);
}

if (maquinasRoutes) {
 app.use('/api/maquinas', maquinasRoutes);
}

if (rutinasRoutes) {
 app.use('/api/rutinas', rutinasRoutes);
}

if (citasRoutes) {
 app.use('/api/citas', citasRoutes);
}

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