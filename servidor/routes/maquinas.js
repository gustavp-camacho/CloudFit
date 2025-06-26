//routes/maquinas.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Machine = require('../models/maquinas');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Al inicio del archivo, después de las importaciones:
console.log('🔄 Rutas de máquinas cargadas correctamente');
console.log('🏋️‍♂️ Modelo Machine:', !!Machine);

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('📁 Directorio uploads creado');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Usar el nombre proporcionado por el frontend
    const fieldName = file.fieldname; // 'video' o 'imagen'
    const customName = req.body[fieldName === 'video' ? 'nombreVideo' : 'nombreImagen'];
    
    if (customName) {
      cb(null, customName);
    } else {
      // Fallback: usar nombre original con timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, fieldName + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Aceptar solo videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  } else if (file.fieldname === 'imagen') {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  } else {
    cb(new Error('Campo de archivo no válido'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB límite
  }
});

// Middleware para manejar múltiples archivos
const uploadFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'imagen', maxCount: 1 }
]);

// Función para generar ID de máquina (siguiendo patrón de empleados)
const generateMachineId = () => {
  // Genera ID de 6 números que empiece con 80
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `80${randomDigits}`;
};

// RUTAS PRINCIPALES

// Ruta para obtener todas las máquinas
router.get('/all', verifyToken, async (req, res) => {
  console.log('🔍 GET /api/maquinas/all - Usuario autenticado:', req.userId);
  
  try {
    console.log('🔍 Buscando máquinas en la base de datos...');
    
    // Buscar todas las máquinas y ordenar por fecha de creación
    const machines = await Machine.find()
      .sort({ createdAt: -1 });

    console.log(`✅ Máquinas encontradas: ${machines.length}`);

    // Formatear la respuesta (consistente con el patrón de empleados)
    const machinesWithInfo = machines.map(machine => ({
      id: machine._id,
      machineId: machine.machineId,
      nombre: machine.nombre,
      categoria: machine.categoria,
      pesos: machine.pesos,
      cantidad: machine.cantidad,
      nombreVideo: machine.nombreVideo,
      nombreImagen: machine.nombreImagen,
      status: machine.status,
      registrationDate: machine.registrationDate,
      createdAt: machine.createdAt,
      // URLs virtuales para acceso a archivos
      videoUrl: machine.videoUrl,
      imagenUrl: machine.imagenUrl,
      notes: machine.notes
    }));

    console.log('✅ Enviando respuesta con máquinas:', machinesWithInfo.length);

    res.json({
      success: true,
      message: `${machinesWithInfo.length} máquinas encontradas`,
      machines: machinesWithInfo
    });
  } catch (error) {
    console.error('❌ Error al obtener máquinas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener máquinas'
    });
  }
});

// Ruta para crear una nueva máquina (siguiendo patrón de empleados)
router.post('/create', verifyToken, uploadFiles, async (req, res) => {
  const { 
    machineId, // Viene del frontend
    nombre,
    categoria,
    pesos,
    cantidad,
    nombreVideo,
    nombreImagen,
    notes
  } = req.body;
  
  try {
    console.log('📝 Creando máquina con datos:', { 
      machineId, nombre, categoria, pesos, cantidad, nombreVideo, nombreImagen 
    });

    // Validaciones básicas (siguiendo patrón de empleados)
    if (!nombre || !categoria || !pesos || !cantidad || !nombreVideo || !nombreImagen) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos obligatorios son requeridos' 
      });
    }

    // Verificar que los archivos fueron subidos
    if (!req.files || !req.files.video || !req.files.imagen) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren tanto el video como la imagen'
      });
    }

    // Verificar que el ID personalizado no exista
    const existingMachine = await Machine.findOne({ machineId: machineId });
    if (existingMachine) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de máquina ya existe' 
      });
    }

    // Verificar que el nombre no exista (case insensitive)
    const existingByName = await Machine.isNombreExists(nombre);
    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una máquina con ese nombre'
      });
    }

    // Verificar que los nombres de archivos no existan
    const existingVideoName = await Machine.isNombreVideoExists(nombreVideo);
    if (existingVideoName) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un video con ese nombre'
      });
    }

    const existingImageName = await Machine.isNombreImagenExists(nombreImagen);
    if (existingImageName) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una imagen con ese nombre'
      });
    }

    // Validaciones adicionales (siguiendo patrón de empleados)
    if (!/^80\d{4}$/.test(machineId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de máquina inválido'
      });
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-._]{3,100}$/.test(nombre)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre debe contener solo letras, números, espacios y caracteres básicos (3-100 caracteres)'
      });
    }

    if (!['cardio', 'fuerza', 'funcional', 'libre'].includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría inválida. Debe ser: cardio, fuerza, funcional o libre'
      });
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 1 || cantidadNum > 999) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número entre 1 y 999'
      });
    }

    if (!/\.(mp4|avi|mov|wmv|flv|webm)$/i.test(nombreVideo)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del video debe incluir extensión válida (.mp4, .avi, .mov, .wmv, .flv, .webm)'
      });
    }

    if (!/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(nombreImagen)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de imagen debe incluir extensión válida (.jpg, .jpeg, .png, .gif, .bmp, .webp)'
      });
    }

    // Crear nueva máquina
    const newMachine = new Machine({
      machineId,
      nombre,
      categoria,
      pesos,
      cantidad: cantidadNum,
      nombreVideo,
      nombreImagen,
      status: 'available',
      registrationDate: new Date(),
      notes: notes || ''
    });
    
    const savedMachine = await newMachine.save();
    console.log('✅ Máquina creada:', savedMachine.machineId);

    // Respuesta exitosa (siguiendo patrón de empleados)
    res.status(201).json({ 
      success: true,
      message: `Máquina creada exitosamente! ID: ${savedMachine.machineId}`,
      machine: {
        id: savedMachine._id,
        machineId: savedMachine.machineId,
        nombre: savedMachine.nombre,
        categoria: savedMachine.categoria,
        pesos: savedMachine.pesos,
        cantidad: savedMachine.cantidad,
        nombreVideo: savedMachine.nombreVideo,
        nombreImagen: savedMachine.nombreImagen,
        status: savedMachine.status,
        registrationDate: savedMachine.registrationDate,
        videoUrl: savedMachine.videoUrl,
        imagenUrl: savedMachine.imagenUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Error al crear máquina:', error);
    
    // Manejar errores específicos de MongoDB (igual que empleados)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    // Manejar errores de validación de Mongoose (igual que empleados)
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al crear máquina' 
    });
  }
});

// Ruta para obtener una máquina específica
router.get('/maquina/:machineId', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Buscando máquina con ID:', req.params.machineId);

    const machine = await Machine.findOne({ machineId: req.params.machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Máquina encontrada',
      machine: {
        id: machine._id,
        machineId: machine.machineId,
        nombre: machine.nombre,
        categoria: machine.categoria,
        pesos: machine.pesos,
        cantidad: machine.cantidad,
        nombreVideo: machine.nombreVideo,
        nombreImagen: machine.nombreImagen,
        status: machine.status,
        registrationDate: machine.registrationDate,
        createdAt: machine.createdAt,
        videoUrl: machine.videoUrl,
        imagenUrl: machine.imagenUrl,
        notes: machine.notes
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener máquina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener máquina'
    });
  }
});

// Ruta para actualizar una máquina
router.put('/maquina/:machineId', verifyToken, uploadFiles, async (req, res) => {
  const { 
    nombre,
    categoria,
    pesos,
    cantidad,
    nombreVideo,
    nombreImagen,
    notes
  } = req.body;

  try {
    console.log('📝 Actualizando máquina:', req.params.machineId);

    const machine = await Machine.findOne({ machineId: req.params.machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    // Validaciones si se proporcionan nuevos valores (siguiendo patrón de empleados)
    if (nombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-._]{3,100}$/.test(nombre)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre debe contener solo letras, números, espacios y caracteres básicos (3-100 caracteres)'
      });
    }

    if (categoria && !['cardio', 'fuerza', 'funcional', 'libre'].includes(categoria)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría inválida. Debe ser: cardio, fuerza, funcional o libre'
      });
    }

    if (cantidad) {
      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum < 1 || cantidadNum > 999) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser un número entre 1 y 999'
        });
      }
    }

    if (nombreVideo && !/\.(mp4|avi|mov|wmv|flv|webm)$/i.test(nombreVideo)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del video debe incluir extensión válida'
      });
    }

    if (nombreImagen && !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(nombreImagen)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de imagen debe incluir extensión válida'
      });
    }

    // Verificar duplicados si se están cambiando valores (igual que empleados)
    if (nombre && nombre !== machine.nombre) {
      const existingByName = await Machine.isNombreExists(nombre, machine._id);
      if (existingByName) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una máquina con ese nombre'
        });
      }
    }

    if (nombreVideo && nombreVideo !== machine.nombreVideo) {
      const existingVideoName = await Machine.isNombreVideoExists(nombreVideo, machine._id);
      if (existingVideoName) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un video con ese nombre'
        });
      }
    }

    if (nombreImagen && nombreImagen !== machine.nombreImagen) {
      const existingImageName = await Machine.isNombreImagenExists(nombreImagen, machine._id);
      if (existingImageName) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una imagen con ese nombre'
        });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (categoria) updateData.categoria = categoria;
    if (pesos) updateData.pesos = pesos;
    if (cantidad) updateData.cantidad = parseInt(cantidad);
    if (nombreVideo) updateData.nombreVideo = nombreVideo;
    if (nombreImagen) updateData.nombreImagen = nombreImagen;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = Date.now();

    // Actualizar máquina
    const updatedMachine = await Machine.findByIdAndUpdate(
      machine._id,
      updateData,
      { new: true }
    );

    console.log('✅ Máquina actualizada:', updatedMachine.machineId);

    res.json({
      success: true,
      message: 'Máquina actualizada exitosamente',
      machine: {
        id: updatedMachine._id,
        machineId: updatedMachine.machineId,
        nombre: updatedMachine.nombre,
        categoria: updatedMachine.categoria,
        pesos: updatedMachine.pesos,
        cantidad: updatedMachine.cantidad,
        nombreVideo: updatedMachine.nombreVideo,
        nombreImagen: updatedMachine.nombreImagen,
        status: updatedMachine.status,
        registrationDate: updatedMachine.registrationDate,
        videoUrl: updatedMachine.videoUrl,
        imagenUrl: updatedMachine.imagenUrl,
        notes: updatedMachine.notes
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar máquina:', error);
    
    // Manejar errores específicos (igual que empleados)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} ya está en uso`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar máquina'
    });
  }
});

// Ruta para cambiar estado de máquina
router.patch('/maquina/:machineId/status', verifyToken, async (req, res) => {
  const { status } = req.body;

  try {
    console.log('🔄 Cambiando estado de la máquina:', req.params.machineId, 'a:', status);

    if (!['available', 'maintenance', 'out_of_service'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: available, maintenance o out_of_service'
      });
    }

    const machine = await Machine.findOne({ machineId: req.params.machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    // Actualizar estado
    machine.status = status;
    machine.updatedAt = Date.now();
    await machine.save();

    console.log('✅ Estado de la máquina actualizado:', machine.machineId);

    const statusMessages = {
      'available': 'disponible',
      'maintenance': 'en mantenimiento',
      'out_of_service': 'fuera de servicio'
    };

    res.json({
      success: true,
      message: `Máquina marcada como ${statusMessages[status]} exitosamente`,
      machine: {
        machineId: machine.machineId,
        status: machine.status
      }
    });
  } catch (error) {
    console.error('❌ Error al cambiar estado de la máquina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al cambiar estado de la máquina'
    });
  }
});

// Ruta para eliminar máquina
router.delete('/maquina/:machineId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Eliminando máquina:', req.params.machineId);

    const machine = await Machine.findOne({ machineId: req.params.machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    // Eliminar archivos del sistema si existen
    const uploadPath = path.join(__dirname, '../uploads');
    
    try {
      if (machine.nombreVideo) {
        const videoPath = path.join(uploadPath, machine.nombreVideo);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
          console.log('✅ Video eliminado:', machine.nombreVideo);
        }
      }
      
      if (machine.nombreImagen) {
        const imagePath = path.join(uploadPath, machine.nombreImagen);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('✅ Imagen eliminada:', machine.nombreImagen);
        }
      }
    } catch (fileError) {
      console.warn('⚠️ Error al eliminar archivos:', fileError.message);
      // Continuar con la eliminación de la máquina aunque no se puedan eliminar los archivos
    }

    // Eliminar máquina de la base de datos
    await Machine.findByIdAndDelete(machine._id);

    console.log('✅ Máquina eliminada:', req.params.machineId);

    res.json({
      success: true,
      message: 'Máquina eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar máquina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar máquina'
    });
  }
});

// Ruta para obtener estadísticas de máquinas
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de máquinas');

    const stats = await Machine.getStatsByCategory();
    const totalMachines = await Machine.aggregate([
      { $group: { _id: null, total: { $sum: '$cantidad' } } }
    ]);
    const totalTypes = await Machine.countDocuments();

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      stats: {
        total: totalMachines[0]?.total || 0,
        tipos: totalTypes,
        porCategoria: stats
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas'
    });
  }
});

module.exports = router;