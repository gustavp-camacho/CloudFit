//routes/empleados.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/empleados');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Al inicio del archivo, después de las importaciones:
console.log('🔄 Rutas de empleados cargadas correctamente');
console.log('📋 Modelo Employee:', !!Employee);
console.log('👤 Modelo User:', !!User);

// Función para generar ID de empleado (siguiendo patrón de registro_y_login.js)
const generateEmployeeId = () => {
  // Genera ID de 6 números que empiece con 70
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `70${randomDigits}`;
};

// RUTAS PRINCIPALES

// Ruta para obtener todos los empleados
router.get('/all', verifyToken, async (req, res) => {
  console.log('🔍 GET /api/empleados/all - Usuario autenticado:', req.userId);
  
  try {
    console.log('🔍 Buscando empleados en la base de datos...');
    
    // Buscar todos los empleados y popular la información del usuario
    const employees = await Employee.find()
      .populate('userId', 'username email role status')
      .sort({ createdAt: -1 });

    console.log(`✅ Empleados encontrados: ${employees.length}`);

    // Formatear la respuesta (consistente con el patrón de login)
    const employeesWithUserInfo = employees.map(employee => ({
      id: employee._id,
      employeeId: employee.employeeId,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      role: employee.role,
      status: employee.status,
      startDate: employee.startDate,
      createdAt: employee.createdAt,
      // Info del usuario básico si está disponible
      userInfo: employee.userId ? {
        id: employee.userId._id,
        role: employee.userId.role,
        status: employee.userId.status
      } : null
    }));

    console.log('✅ Enviando respuesta con empleados:', employeesWithUserInfo.length);

    res.json({
      success: true,
      message: `${employeesWithUserInfo.length} empleados encontrados`,
      employees: employeesWithUserInfo
    });
  } catch (error) {
    console.error('❌ Error al obtener empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener empleados'
    });
  }
});

// Ruta para crear un nuevo empleado (siguiendo patrón de signup)
router.post('/create', verifyToken, async (req, res) => {
  const { 
    employeeId, // Viene del frontend
    username,
    email,
    password,
    phone,
    position,
    role
  } = req.body;
  
  try {
    console.log('📝 Creando empleado con datos:', { employeeId, username, email, phone, position });

    // Validaciones básicas (siguiendo patrón de signup)
    if (!username || !email || !password || !phone || !position) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos son requeridos' 
      });
    }

    // Verificar que el usuario o email no existan en la colección básica (igual que en signup)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      let message = 'El empleado ya existe';
      if (existingUser.email === email) {
        message = 'El email ya está registrado';
      } else if (existingUser.username === username) {
        message = 'El nombre de usuario ya está en uso';
      }
      
      return res.status(400).json({ 
        success: false,
        message 
      });
    }

    // Verificar que el ID personalizado no exista en la colección de empleados
    const existingEmployee = await Employee.findOne({ employeeId: employeeId });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de empleado ya existe' 
      });
    }

    // Validaciones adicionales (siguiendo patrón de signup)
    if (!/^70\d{4}$/.test(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado inválido'
      });
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username debe contener solo letras y espacios (3-20 caracteres)'
      });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener 10 dígitos'
      });
    }

    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres, incluyendo letras y números'
      });
    }

    if (!['Barbero', 'Estilista', 'Coach'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Puesto inválido. Debe ser: Barbero, Estilista o Coach'
      });
    }

    // Encriptar contraseña (mismo método que en signup)
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // PASO 1: Crear usuario básico en colección 'users' (igual que en signup)
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      role: role || 'empleado'
    });
    
    const savedUser = await newUser.save();
    console.log('✅ Usuario básico creado:', savedUser._id);
    
    // PASO 2: Crear información del empleado en colección 'employees' (igual patrón que UserInfo)
    const newEmployee = new Employee({
      userId: savedUser._id, // Referencia al usuario básico
      employeeId,
      username,
      email,
      phone,
      position,
      role: role || 'empleado',
      status: 'active',
      startDate: new Date()
    });
    
    const savedEmployee = await newEmployee.save();
    console.log('✅ Empleado creado:', savedEmployee.employeeId);

    // Respuesta exitosa (siguiendo patrón de signup)
    res.status(201).json({ 
      success: true,
      message: `Empleado creado exitosamente! ID: ${savedEmployee.employeeId}`,
      employee: {
        id: savedEmployee._id,
        employeeId: savedEmployee.employeeId,
        username: savedEmployee.username,
        email: savedEmployee.email,
        phone: savedEmployee.phone,
        position: savedEmployee.position,
        role: savedEmployee.role,
        status: savedEmployee.status,
        startDate: savedEmployee.startDate
      }
    });
    
  } catch (error) {
    console.error('❌ Error al crear empleado:', error);
    
    // Manejar errores específicos de MongoDB (igual que en signup)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    // Manejar errores de validación de Mongoose (igual que en signup)
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al crear empleado' 
    });
  }
});

// RUTAS CON PARÁMETROS (estas pueden ser las problemáticas)

// Ruta para obtener un empleado específico
router.get('/empleado/:employeeId', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Buscando empleado con ID:', req.params.employeeId);

    const employee = await Employee.findOne({ employeeId: req.params.employeeId })
      .populate('userId', 'username email role status');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Empleado encontrado',
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        username: employee.username,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        role: employee.role,
        status: employee.status,
        startDate: employee.startDate,
        createdAt: employee.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener empleado'
    });
  }
});

// Ruta para actualizar un empleado
router.put('/empleado/:employeeId', verifyToken, async (req, res) => {
  const { 
    username,
    email,
    password,
    phone,
    position
  } = req.body;

  try {
    console.log('📝 Actualizando empleado:', req.params.employeeId);

    const employee = await Employee.findOne({ employeeId: req.params.employeeId })
      .populate('userId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Validaciones si se proporcionan nuevos valores (siguiendo patrón de signup)
    if (username && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username debe contener solo letras y espacios (3-20 caracteres)'
      });
    }

    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    if (password && (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres, incluyendo letras y números'
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener 10 dígitos'
      });
    }

    if (position && !['Barbero', 'Estilista', 'Coach'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Puesto inválido. Debe ser: Barbero, Estilista o Coach'
      });
    }

    // Verificar duplicados si se están cambiando username o email (igual que en signup)
    if (username && username !== employee.username) {
      const existingByUsername = await User.findOne({ 
        username, 
        _id: { $ne: employee.userId._id } 
      });
      if (existingByUsername) {
        return res.status(400).json({
          success: false,
          message: 'El username ya está en uso'
        });
      }
      
      const existingEmployeeByUsername = await Employee.findOne({ 
        username,
        _id: { $ne: employee._id }
      });
      if (existingEmployeeByUsername) {
        return res.status(400).json({
          success: false,
          message: 'El username ya está en uso'
        });
      }
    }

    if (email && email !== employee.email) {
      const existingByEmail = await User.findOne({ 
        email, 
        _id: { $ne: employee.userId._id } 
      });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
      
      const existingEmployeeByEmail = await Employee.findOne({ 
        email,
        _id: { $ne: employee._id }
      });
      if (existingEmployeeByEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }

    // Preparar datos para actualizar en User (igual método que en signup)
    const userUpdateData = {};
    if (username) userUpdateData.username = username;
    if (email) userUpdateData.email = email;
    if (password) userUpdateData.password = await bcrypt.hash(password, 12);

    // Preparar datos para actualizar en Employee
    const employeeUpdateData = {};
    if (username) employeeUpdateData.username = username;
    if (email) employeeUpdateData.email = email;
    if (phone) employeeUpdateData.phone = phone;
    if (position) employeeUpdateData.position = position;
    employeeUpdateData.updatedAt = Date.now();

    // Actualizar usuario básico si hay cambios
    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(employee.userId._id, userUpdateData);
      console.log('✅ Usuario básico actualizado');
    }

    // Actualizar empleado
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      employeeUpdateData,
      { new: true }
    );

    console.log('✅ Empleado actualizado:', updatedEmployee.employeeId);

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      employee: {
        id: updatedEmployee._id,
        employeeId: updatedEmployee.employeeId,
        username: updatedEmployee.username,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        position: updatedEmployee.position,
        role: updatedEmployee.role,
        status: updatedEmployee.status,
        startDate: updatedEmployee.startDate
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar empleado:', error);
    
    // Manejar errores específicos (igual que signup)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar empleado'
    });
  }
});

// Ruta para cambiar estado de empleado
router.patch('/empleado/:employeeId/status', verifyToken, async (req, res) => {
  const { status } = req.body;

  try {
    console.log('🔄 Cambiando estado del empleado:', req.params.employeeId, 'a:', status);

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: active o inactive'
      });
    }

    const employee = await Employee.findOne({ employeeId: req.params.employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Actualizar estado en Employee
    employee.status = status;
    employee.updatedAt = Date.now();
    await employee.save();

    // Actualizar estado en User también (mantener consistencia)
    await User.findByIdAndUpdate(employee.userId, { status });

    console.log('✅ Estado del empleado actualizado:', employee.employeeId);

    res.json({
      success: true,
      message: `Empleado ${status === 'active' ? 'activado' : 'desactivado'} exitosamente`,
      employee: {
        employeeId: employee.employeeId,
        status: employee.status
      }
    });
  } catch (error) {
    console.error('❌ Error al cambiar estado del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al cambiar estado del empleado'
    });
  }
});

// Ruta para eliminar empleado
router.delete('/empleado/:employeeId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Eliminando empleado:', req.params.employeeId);

    const employee = await Employee.findOne({ employeeId: req.params.employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Eliminar de ambas colecciones (mantener consistencia)
    await User.findByIdAndDelete(employee.userId);
    await Employee.findByIdAndDelete(employee._id);

    console.log('✅ Empleado eliminado:', req.params.employeeId);

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar empleado'
    });
  }
});

// Agregar esta ruta a tu routes/empleados.js

// Ruta para obtener el perfil del empleado autenticado
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Obteniendo perfil del empleado autenticado:', req.userId);

    // Buscar el empleado por su userId (que viene del token)
    const employee = await Employee.findOne({ userId: req.userId })
      .populate('userId', 'username email role status');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de empleado no encontrado'
      });
    }

    console.log('✅ Perfil de empleado encontrado:', employee.employeeId);

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        username: employee.username,
        email: employee.email,
        phone: employee.phone,
        position: employee.position, // Esta es la info que necesita el header
        role: employee.role,
        status: employee.status,
        startDate: employee.startDate,
        // Info del usuario básico
        userInfo: employee.userId ? {
          id: employee.userId._id,
          role: employee.userId.role,
          status: employee.userId.status
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener perfil'
    });
  }
});

module.exports = router;