//routes/rutinas.js
const express = require('express');
const Routine = require('../models/rutina');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Al inicio del archivo, después de las importaciones:
console.log('🔄 Rutas de rutinas cargadas correctamente');
console.log('📋 Modelo Routine:', !!Routine);

// RUTAS PRINCIPALES

// Ruta para obtener todas las rutinas del usuario autenticado
router.get('/all', verifyToken, async (req, res) => {
  console.log('🔍 GET /api/rutinas/all - Usuario autenticado:', req.userId);
  
  try {
    console.log('🔍 Buscando rutinas del usuario en la base de datos...');
    
    // Buscar todas las rutinas del usuario y ordenar por fecha de creación
    const routines = await Routine.getUserRoutines(req.userId);

    console.log(`✅ Rutinas encontradas: ${routines.length}`);

    // Formatear la respuesta (consistente con el patrón de empleados/máquinas)
    const routinesWithInfo = routines.map(routine => ({
      id: routine.id, // ID temporal del frontend
      _id: routine._id, // ID de MongoDB
      name: routine.name,
      description: routine.description,
      selectedDays: routine.selectedDays,
      exercises: routine.exercises,
      status: routine.status,
      totalExercises: routine.totalExercises,
      estimatedDuration: routine.estimatedDuration,
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
      stats: routine.stats
    }));

    console.log('✅ Enviando respuesta con rutinas:', routinesWithInfo.length);

    res.json({
      success: true,
      message: `${routinesWithInfo.length} rutinas encontradas`,
      routines: routinesWithInfo
    });
  } catch (error) {
    console.error('❌ Error al obtener rutinas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener rutinas'
    });
  }
});

// Ruta para guardar todas las rutinas del usuario (reemplazar existentes)
router.post('/save-all', verifyToken, async (req, res) => {
  const { routines } = req.body;
  
  try {
    console.log('📝 Guardando rutinas para usuario:', req.userId);
    console.log('📊 Número de rutinas a guardar:', routines?.length || 0);

    // Validaciones básicas
    if (!routines || !Array.isArray(routines)) {
      return res.status(400).json({ 
        success: false,
        message: 'Debe proporcionar un array de rutinas' 
      });
    }

    // Validar cada rutina
    for (const routine of routines) {
      if (!routine.name || !routine.selectedDays || !Array.isArray(routine.selectedDays)) {
        return res.status(400).json({
          success: false,
          message: 'Cada rutina debe tener nombre y días seleccionados'
        });
      }

      // Validar que los días sean válidos
      const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      const invalidDays = routine.selectedDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Días inválidos encontrados: ${invalidDays.join(', ')}`
        });
      }
    }

    // Verificar conflictos entre las rutinas que se van a guardar
    const allSelectedDays = routines.flatMap(routine => routine.selectedDays);
    const duplicatedDays = allSelectedDays.filter((day, index) => allSelectedDays.indexOf(day) !== index);
    
    if (duplicatedDays.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Conflicto detectado: los siguientes días están asignados a múltiples rutinas: ${[...new Set(duplicatedDays)].join(', ')}`
      });
    }

    // Eliminar rutinas existentes del usuario (para reemplazar completamente)
    await Routine.deleteMany({ userId: req.userId });
    console.log('🗑️ Rutinas anteriores eliminadas');

    // Crear nuevas rutinas
    const savedRoutines = [];
    
    for (const routineData of routines) {
      // Preparar datos de la rutina
      const newRoutine = new Routine({
        userId: req.userId,
        id: routineData.id || Date.now() + Math.random() * 1000,
        name: routineData.name,
        description: routineData.description || '',
        selectedDays: routineData.selectedDays,
        exercises: routineData.exercises.map(exercise => ({
          id: exercise.id || Date.now() + Math.random() * 1000,
          name: exercise.name,
          equipmentType: exercise.equipmentType,
          machine: exercise.machine || null,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          rest: exercise.rest,
          createdAt: exercise.createdAt ? new Date(exercise.createdAt) : new Date()
        })),
        status: 'active'
      });
      
      const savedRoutine = await newRoutine.save();
      savedRoutines.push(savedRoutine);
      console.log('✅ Rutina guardada:', savedRoutine.name);
    }

    console.log('✅ Todas las rutinas guardadas exitosamente');

    // Formatear respuesta
    const formattedRoutines = savedRoutines.map(routine => ({
      id: routine.id,
      _id: routine._id,
      name: routine.name,
      description: routine.description,
      selectedDays: routine.selectedDays,
      exercises: routine.exercises,
      status: routine.status,
      totalExercises: routine.totalExercises,
      estimatedDuration: routine.estimatedDuration,
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
      stats: routine.stats
    }));

    // Respuesta exitosa
    res.status(201).json({ 
      success: true,
      message: `${savedRoutines.length} rutinas guardadas exitosamente`,
      routines: formattedRoutines
    });
    
  } catch (error) {
    console.error('❌ Error al guardar rutinas:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Conflicto de datos al guardar rutinas'
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
      message: 'Error interno del servidor al guardar rutinas' 
    });
  }
});

// Ruta para obtener una rutina específica
router.get('/rutina/:routineId', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Buscando rutina con ID:', req.params.routineId);

    const routine = await Routine.findOne({ 
      _id: req.params.routineId,
      userId: req.userId 
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Rutina encontrada',
      routine: {
        id: routine.id,
        _id: routine._id,
        name: routine.name,
        description: routine.description,
        selectedDays: routine.selectedDays,
        exercises: routine.exercises,
        status: routine.status,
        totalExercises: routine.totalExercises,
        estimatedDuration: routine.estimatedDuration,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        stats: routine.stats
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener rutina'
    });
  }
});

// Ruta para obtener rutina de un día específico
router.get('/day/:day', verifyToken, async (req, res) => {
  const { day } = req.params;
  
  try {
    console.log('🔍 Buscando rutina para día:', day);

    const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Día inválido'
      });
    }

    const routine = await Routine.getRoutineForDay(req.userId, day);

    if (!routine) {
      return res.json({
        success: true,
        message: 'No hay rutina para este día',
        routine: null
      });
    }

    res.json({
      success: true,
      message: 'Rutina encontrada para el día',
      routine: {
        id: routine.id,
        _id: routine._id,
        name: routine.name,
        description: routine.description,
        selectedDays: routine.selectedDays,
        exercises: routine.exercises,
        status: routine.status,
        totalExercises: routine.totalExercises,
        estimatedDuration: routine.estimatedDuration,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        stats: routine.stats
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener rutina del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener rutina del día'
    });
  }
});

// Ruta para actualizar una rutina específica
router.put('/rutina/:routineId', verifyToken, async (req, res) => {
  const { name, description, selectedDays, exercises } = req.body;

  try {
    console.log('📝 Actualizando rutina:', req.params.routineId);

    const routine = await Routine.findOne({ 
      _id: req.params.routineId,
      userId: req.userId 
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    // Validaciones
    if (name && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-._]{1,100}$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre debe contener solo letras, números, espacios y caracteres básicos (1-100 caracteres)'
      });
    }

    if (selectedDays) {
      const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      const invalidDays = selectedDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Días inválidos: ${invalidDays.join(', ')}`
        });
      }

      // Verificar conflictos con otras rutinas
      for (const day of selectedDays) {
        const hasConflict = await Routine.hasRoutineForDay(req.userId, day, routine._id);
        if (hasConflict) {
          return res.status(400).json({
            success: false,
            message: `El día ${day} ya está asignado a otra rutina`
          });
        }
      }
    }

    // Preparar datos para actualizar
    const updateData = {
      updatedAt: Date.now()
    };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (selectedDays) updateData.selectedDays = selectedDays;
    if (exercises) {
      updateData.exercises = exercises.map(exercise => ({
        id: exercise.id || Date.now() + Math.random() * 1000,
        name: exercise.name,
        equipmentType: exercise.equipmentType,
        machine: exercise.machine || null,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest: exercise.rest,
        createdAt: exercise.createdAt ? new Date(exercise.createdAt) : new Date()
      }));
    }

    // Actualizar rutina
    const updatedRoutine = await Routine.findByIdAndUpdate(
      routine._id,
      updateData,
      { new: true }
    );

    console.log('✅ Rutina actualizada:', updatedRoutine.name);

    res.json({
      success: true,
      message: 'Rutina actualizada exitosamente',
      routine: {
        id: updatedRoutine.id,
        _id: updatedRoutine._id,
        name: updatedRoutine.name,
        description: updatedRoutine.description,
        selectedDays: updatedRoutine.selectedDays,
        exercises: updatedRoutine.exercises,
        status: updatedRoutine.status,
        totalExercises: updatedRoutine.totalExercises,
        estimatedDuration: updatedRoutine.estimatedDuration,
        createdAt: updatedRoutine.createdAt,
        updatedAt: updatedRoutine.updatedAt,
        stats: updatedRoutine.stats
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar rutina:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar rutina'
    });
  }
});

// Ruta para archivar (soft delete) una rutina
router.patch('/rutina/:routineId/archive', verifyToken, async (req, res) => {
  try {
    console.log('📦 Archivando rutina:', req.params.routineId);

    const routine = await Routine.findOne({ 
      _id: req.params.routineId,
      userId: req.userId 
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    await routine.archive();

    console.log('✅ Rutina archivada:', routine.name);

    res.json({
      success: true,
      message: 'Rutina archivada exitosamente',
      routine: {
        id: routine.id,
        status: routine.status
      }
    });
  } catch (error) {
    console.error('❌ Error al archivar rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al archivar rutina'
    });
  }
});

// Ruta para eliminar rutina permanentemente
router.delete('/rutina/:routineId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Eliminando rutina permanentemente:', req.params.routineId);

    const routine = await Routine.findOne({ 
      _id: req.params.routineId,
      userId: req.userId 
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada'
      });
    }

    await Routine.findByIdAndDelete(routine._id);

    console.log('✅ Rutina eliminada permanentemente:', req.params.routineId);

    res.json({
      success: true,
      message: 'Rutina eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar rutina'
    });
  }
});

// Ruta para duplicar una rutina
router.post('/rutina/:routineId/duplicate', verifyToken, async (req, res) => {
  const { newName, newDays } = req.body;
  
  try {
    console.log('📋 Duplicando rutina:', req.params.routineId);

    const originalRoutine = await Routine.findOne({ 
      _id: req.params.routineId,
      userId: req.userId 
    });

    if (!originalRoutine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina original no encontrada'
      });
    }

    // Verificar que los nuevos días no estén ocupados
    if (newDays && newDays.length > 0) {
      for (const day of newDays) {
        const hasConflict = await Routine.hasRoutineForDay(req.userId, day);
        if (hasConflict) {
          return res.status(400).json({
            success: false,
            message: `El día ${day} ya está asignado a otra rutina`
          });
        }
      }
    }

    const duplicatedRoutine = originalRoutine.duplicate(newName, newDays);
    const savedDuplicate = await duplicatedRoutine.save();

    console.log('✅ Rutina duplicada:', savedDuplicate.name);

    res.status(201).json({
      success: true,
      message: 'Rutina duplicada exitosamente',
      routine: {
        id: savedDuplicate.id,
        _id: savedDuplicate._id,
        name: savedDuplicate.name,
        description: savedDuplicate.description,
        selectedDays: savedDuplicate.selectedDays,
        exercises: savedDuplicate.exercises,
        status: savedDuplicate.status,
        totalExercises: savedDuplicate.totalExercises,
        estimatedDuration: savedDuplicate.estimatedDuration,
        createdAt: savedDuplicate.createdAt,
        updatedAt: savedDuplicate.updatedAt,
        stats: savedDuplicate.stats
      }
    });
  } catch (error) {
    console.error('❌ Error al duplicar rutina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al duplicar rutina'
    });
  }
});

// Ruta para obtener estadísticas de rutinas del usuario
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de rutinas para usuario:', req.userId);

    const routines = await Routine.getUserRoutines(req.userId);
    
    const stats = {
      totalRoutines: routines.length,
      totalExercises: routines.reduce((sum, routine) => sum + routine.totalExercises, 0),
      totalDaysAssigned: routines.reduce((sum, routine) => sum + routine.selectedDays.length, 0),
      averageDuration: routines.length > 0 
        ? Math.round(routines.reduce((sum, routine) => sum + routine.estimatedDuration, 0) / routines.length)
        : 0,
      equipmentBreakdown: routines.reduce((breakdown, routine) => {
        routine.exercises.forEach(exercise => {
          breakdown[exercise.equipmentType] = (breakdown[exercise.equipmentType] || 0) + 1;
        });
        return breakdown;
      }, {}),
      dayDistribution: routines.reduce((distribution, routine) => {
        routine.selectedDays.forEach(day => {
          distribution[day] = (distribution[day] || 0) + 1;
        });
        return distribution;
      }, {})
    };

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      stats
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