const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Ruta de registro - CREA EN AMBAS COLECCIONES
router.post('/signup', async (req, res) => {
  const { 
    userId,
    username, 
    email, 
    password, 
    phone,
    planType,
    cardNumber,
    cardName,
    expiryDate,
    cvv,
    billingAddress,
    city,
    postalCode,
    role 
  } = req.body;
  
  try {
    // Validaciones básicas
    if (!userId || !username || !email || !password || !phone || !planType) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos básicos son requeridos' 
      });
    }

    // Validaciones de pago
    if (!cardNumber || !cardName || !expiryDate || !cvv || !billingAddress || !city || !postalCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Toda la información de pago es requerida' 
      });
    }

    // Verificar que el usuario o email no existan en la colección básica
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      let message = 'El usuario ya existe';
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

    // Verificar que el ID personalizado no exista en la colección de info
    const existingUserInfo = await UserInfo.findOne({ customUserId: userId });
    if (existingUserInfo) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de usuario ya existe' 
      });
    }

    // Validaciones adicionales
    if (!/^50\d{4}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    if (!/^[a-zA-Z0-9._\s-]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username debe contener solo letras, números, guiones bajos, guiones o puntos (3-20 caracteres)'
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

    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de número de tarjeta inválido'
      });
    }

    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha de vencimiento inválido (MM/AA)'
      });
    }

    // Validar que la fecha de vencimiento sea futura
    const [month, year] = expiryDate.split('/');
    const expiryFullYear = parseInt('20' + year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (expiryFullYear < currentYear || 
        (expiryFullYear === currentYear && parseInt(month) <= currentMonth)) {
      return res.status(400).json({
        success: false,
        message: 'La tarjeta está vencida'
      });
    }

    if (!/^\d{3}$/.test(cvv)) {
      return res.status(400).json({
        success: false,
        message: 'CVV debe tener 3 dígitos'
      });
    }

    if (!['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Plan de suscripción inválido'
      });
    }

    // Calcular precio según el plan
    const planPrice = planType === 'annual' ? 299.99 : 29.99;
    
    // Calcular fechas de suscripción
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    
    if (planType === 'annual') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // PASO 1: Crear usuario básico en colección 'users'
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      role: role || 'user'
    });
    
    const savedUser = await newUser.save();
    
    // PASO 2: Crear información adicional en colección 'info_users'
    const newUserInfo = new UserInfo({
      userId: savedUser._id, // Referencia al usuario básico
      customUserId: userId,
      phone,
      planType,
      planPrice,
      paymentInfo: {
        cardNumber,
        cardName,
        expiryDate,
        cvv,
        billingAddress,
        city,
        postalCode
      },
      subscriptionStatus: 'active',
      subscriptionStartDate,
      subscriptionEndDate
    });
    
    const savedUserInfo = await newUserInfo.save();
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        userCustomId: savedUserInfo.customUserId 
      },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '24h' }
    );

    // Respuesta exitosa
    res.status(201).json({ 
      success: true,
      message: `Usuario registrado exitosamente! Tu ID es: ${savedUserInfo.customUserId}`,
      token,
      user: {
        id: savedUser._id,
        userId: savedUserInfo.customUserId,
        username: savedUser.username,
        email: savedUser.email,
        phone: savedUserInfo.phone,
        planType: savedUserInfo.planType,
        planPrice: savedUserInfo.planPrice,
        subscriptionStatus: savedUserInfo.subscriptionStatus,
        subscriptionEndDate: savedUserInfo.subscriptionEndDate,
        role: savedUser.role
      }
    });
    
  } catch (error) {
    console.error('Error en el registro:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al registrar usuario' 
    });
  }
});

// Ruta de login - SOLO USA COLECCIÓN BÁSICA 'users'
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('Intentando login con email:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar SOLO en la colección básica 'users'
    const user = await User.findOne({ email });
    console.log('Usuario encontrado:', user ? 'SÍ' : 'NO');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('Comparando contraseñas...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Contraseña válida:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('Login exitoso');

    // Buscar información adicional si existe
    let userInfo = null;
    try {
      userInfo = await UserInfo.findOne({ userId: user._id });
    } catch (infoError) {
      console.log('No se encontró información adicional (usuario legacy)');
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        userCustomId: userInfo ? userInfo.customUserId : 'legacy'
      },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '24h' }
    );

    console.log('Token generado exitosamente');

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        userId: userInfo ? userInfo.customUserId : null,
        username: user.username,
        email: user.email,
        role: user.role,
        // Información adicional si existe
        ...(userInfo && {
          phone: userInfo.phone,
          planType: userInfo.planType,
          planPrice: userInfo.planPrice,
          subscriptionStatus: userInfo.subscriptionStatus,
          subscriptionEndDate: userInfo.subscriptionEndDate
        })
      }
    });
  } catch (error) {
    console.error('Error completo en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el login'
    });
  }
});

module.exports = router;