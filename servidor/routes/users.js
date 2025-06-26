const express = require('express');
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

console.log('📁 ARCHIVO routes/users.js CARGADO CORRECTAMENTE');

// Ruta de prueba
router.get('/test', (req, res) => {
  console.log('🧪 Ruta de prueba /api/users/test funcionando');
  res.json({ 
    success: true, 
    message: 'Rutas de usuarios conectadas correctamente'
  });
});

// ===== RUTAS ESPECÍFICAS (DEBEN IR PRIMERO) =====

// GET /api/users/profile - Obtener MI perfil 
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Obteniendo perfil del usuario...');
    const userId = req.userId; // Extraído del token por verifyToken
    console.log('Usuario ID desde token:', userId); // Debug
    
    // Buscar información básica en la colección 'users'
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar información adicional en la colección 'info_users'
    const userInfo = await UserInfo.findOne({ userId: userId });

    // Combinar información (igual que en Header.js)
    const profileData = {
      // Datos básicos de 'users'
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // Datos adicionales de 'info_users' (si existen)
      ...(userInfo && {
        userId: userInfo.customUserId, // El ID personalizado como "501234"
        phone: userInfo.phone,
        planType: userInfo.planType,
        planPrice: userInfo.planPrice,
        subscriptionStatus: userInfo.subscriptionStatus,
        subscriptionStartDate: userInfo.subscriptionStartDate,
        subscriptionEndDate: userInfo.subscriptionEndDate,
        // Información de pago
        paymentInfo: userInfo.paymentInfo
      })
    };

    console.log('Perfil obtenido exitosamente');

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      user: profileData
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener perfil'
    });
  }
});

// PUT /api/users/profile - Actualizar MI perfil
router.put('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Actualizando perfil del usuario...');
    const userId = req.userId; // Extraído del token
    const { 
      username, 
      email, 
      phone, 
      planType,
      // Campos de tarjeta
      cardNumber,
      cardName,
      expiryDate,
      cvv,
      billingAddress,
      city,
      postalCode
    } = req.body;

    console.log('Usuario ID desde token:', userId); // Debug
    console.log('Datos recibidos:', req.body); // Debug

    // Validaciones básicas
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username y email son requeridos'
      });
    }

    // Validar formato de username
    if (!/^[a-zA-Z0-9._\s-]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username debe contener solo letras, números, guiones bajos, guiones o puntos (3-20 caracteres)'
      });
    }

    // Validar formato de email
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar teléfono si se proporciona
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener 10 dígitos'
      });
    }

    // Validar planType si se proporciona
    if (planType && !['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Plan de suscripción inválido'
      });
    }

    // Validar campos de tarjeta si se proporcionan
    if (cardNumber && !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de número de tarjeta inválido'
      });
    }

    if (expiryDate && !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha de vencimiento inválido (MM/AA)'
      });
    }

    if (cvv && !/^\d{3}$/.test(cvv)) {
      return res.status(400).json({
        success: false,
        message: 'CVV debe tener 3 dígitos'
      });
    }

    // Verificar que no exista otro usuario con el mismo email o username
    const existingUser = await User.findOne({ 
      $and: [
        { _id: { $ne: userId } }, // Excluir el usuario actual
        { $or: [{ email }, { username }] }
      ]
    });
    
    if (existingUser) {
      let message = 'Ya existe otro usuario con esos datos';
      if (existingUser.email === email) {
        message = 'El email ya está en uso por otro usuario';
      } else if (existingUser.username === username) {
        message = 'El nombre de usuario ya está en uso';
      }
      
      return res.status(400).json({ 
        success: false,
        message 
      });
    }

    // ACTUALIZAR colección 'users' (datos básicos)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username, 
        email,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ACTUALIZAR colección 'info_users' (datos adicionales) - si existen campos para actualizar
    let updatedUserInfo = null;
    const hasAdditionalFields = phone !== undefined || planType !== undefined || 
                                cardNumber || cardName || expiryDate || cvv || 
                                billingAddress || city || postalCode;
    
    if (hasAdditionalFields) {
      const updateData = {};
      
      if (phone !== undefined) updateData.phone = phone;
      if (planType !== undefined) {
        updateData.planType = planType;
        updateData.planPrice = planType === 'annual' ? 299.99 : 29.99;
        
        // Si cambia el plan, actualizar fechas de suscripción
        updateData.subscriptionStartDate = new Date();
        const endDate = new Date();
        if (planType === 'annual') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        updateData.subscriptionEndDate = endDate;
      }

      // Actualizar información de pago si se proporciona
      if (cardNumber || cardName || expiryDate || cvv || billingAddress || city || postalCode) {
        // Primero obtener la información de pago existente
        const existingUserInfo = await UserInfo.findOne({ userId: userId });
        const existingPaymentInfo = existingUserInfo?.paymentInfo || {};
        
        updateData.paymentInfo = {
          cardNumber: cardNumber || existingPaymentInfo.cardNumber,
          cardName: cardName || existingPaymentInfo.cardName,
          expiryDate: expiryDate || existingPaymentInfo.expiryDate,
          cvv: cvv || existingPaymentInfo.cvv,
          billingAddress: billingAddress || existingPaymentInfo.billingAddress,
          city: city || existingPaymentInfo.city,
          postalCode: postalCode || existingPaymentInfo.postalCode
        };
      }

      console.log('Actualizando UserInfo con:', updateData); // Debug

      // Buscar y actualizar UserInfo
      updatedUserInfo = await UserInfo.findOneAndUpdate(
        { userId: userId },
        updateData,
        { new: true }
      );
    } else {
      // Solo buscar la información existente
      updatedUserInfo = await UserInfo.findOne({ userId: userId });
    }

    // Combinar respuesta (igual formato que GET /profile)
    const responseData = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      
      // Datos adicionales (si existen)
      ...(updatedUserInfo && {
        userId: updatedUserInfo.customUserId,
        phone: updatedUserInfo.phone,
        planType: updatedUserInfo.planType,
        planPrice: updatedUserInfo.planPrice,
        subscriptionStatus: updatedUserInfo.subscriptionStatus,
        subscriptionStartDate: updatedUserInfo.subscriptionStartDate,
        subscriptionEndDate: updatedUserInfo.subscriptionEndDate,
        paymentInfo: updatedUserInfo.paymentInfo
      })
    };

    console.log('Perfil actualizado exitosamente');

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: responseData
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar perfil'
    });
  }
});

// ===== RUTAS CON PARÁMETROS (DEBEN IR DESPUÉS) =====

// GET /api/users - Obtener todos los usuarios (ADMIN)
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Obteniendo lista de usuarios...');

    // Obtener usuarios básicos (excluyendo admins)
    const users = await User.find({ role: 'user' })
      .sort({ _id: -1 });

    console.log(`${users.length} usuarios encontrados`);

    // Obtener información adicional para cada usuario
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        try {
          const userInfo = await UserInfo.findOne({ userId: user._id });
          return {
            id: userInfo ? userInfo.customUserId : user._id.toString(),
            username: user.username,
            email: user.email,
            fullName: user.username,
            phone: userInfo ? userInfo.phone : '',
            planType: userInfo ? userInfo.planType : '',
            subscriptionStatus: userInfo ? userInfo.subscriptionStatus : ''
          };
        } catch (error) {
          console.error(`Error obteniendo info para usuario ${user._id}:`, error);
          return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            fullName: user.username,
            phone: '',
            planType: '',
            subscriptionStatus: ''
          };
        }
      })
    );

    console.log(`Enviando ${usersWithInfo.length} usuarios`);

    res.json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: usersWithInfo
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id - Actualizar usuario por ID (ADMIN)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone } = req.body;

    console.log('Actualizando usuario (ADMIN):', id, req.body);

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username y email son requeridos'
      });
    }

    // Buscar usuario por customUserId o por _id
    let userInfo = await UserInfo.findOne({ customUserId: id });
    let user;

    if (userInfo) {
      user = await User.findById(userInfo.userId);
    } else {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que username y email no estén en uso
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: user._id } },
        { $or: [{ username }, { email }] }
      ]
    });

    if (existingUser) {
      let message = 'Username o email ya en uso';
      if (existingUser.username === username) {
        message = 'Username ya está en uso';
      } else if (existingUser.email === email) {
        message = 'Email ya está en uso';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Actualizar usuario básico
    user.username = username;
    user.email = email;
    await user.save();

    // Actualizar info adicional si existe
    if (userInfo && phone) {
      userInfo.phone = phone;
      await userInfo.save();
    }

    console.log('Usuario actualizado exitosamente (ADMIN)');

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario (ADMIN):', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario por ID (ADMIN)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Eliminando usuario (ADMIN):', id);

    // Buscar usuario por customUserId o por _id
    let userInfo = await UserInfo.findOne({ customUserId: id });
    let user;

    if (userInfo) {
      user = await User.findById(userInfo.userId);
    } else {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar información adicional si existe
    if (userInfo) {
      await UserInfo.findByIdAndDelete(userInfo._id);
    }

    // Eliminar usuario básico
    await User.findByIdAndDelete(user._id);

    console.log('Usuario eliminado exitosamente (ADMIN)');

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario (ADMIN):', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;