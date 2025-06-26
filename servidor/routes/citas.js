//routes/citas.js
const express = require('express');
const Cita = require('../models/cita');
const Employee = require('../models/empleados');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

console.log('🔄 Rutas de citas cargadas correctamente');
console.log('📅 Modelo Cita:', !!Cita);

// Obtener todas las citas del usuario
router.get('/my-appointments', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Obteniendo citas del usuario:', req.userId);
    
    const citas = await Cita.obtenerCitasUsuario(req.userId);
    
    // Formatear para el frontend
    const citasFormateadas = citas.map(cita => ({
      id: cita._id,
      _id: cita._id,
      date: cita.horario.fecha,
      time: cita.horario.hora,
      serviceType: cita.actividad === 'corte' ? 'barbero' : 'coach',
      serviceName: cita.actividad === 'corte' ? 'Servicio de Barbería' : 'Entrenamiento Personal',
      serviceDuration: cita.actividad === 'corte' ? 30 : 60,
      status: cita.estado === 'activa' ? 'confirmed' : cita.estado,
      employee: {
        employeeId: cita.employeeId,
        name: cita.empleadoInfo?.nombre || 'Empleado',
        position: cita.empleadoInfo?.posicion || ''
      },
      notes: '',
      createdAt: cita.createdAt
    }));

    console.log(`✅ ${citasFormateadas.length} citas encontradas`);

    res.json({
      success: true,
      message: `${citasFormateadas.length} citas encontradas`,
      appointments: citasFormateadas
    });
  } catch (error) {
    console.error('❌ Error al obtener citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas'
    });
  }
});

// ===== NUEVA RUTA PARA EMPLEADOS =====
// GET /api/citas/employee-schedule - Obtener citas del empleado logueado para el Schedule
router.get('/employee-schedule', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    console.log('🔍 Obteniendo horario del empleado logueado para fecha:', date);
    console.log('🔍 Usuario ID desde token:', req.userId);

    // 1. Buscar el empleado en base al userId del token
    const empleado = await Employee.findOne({ userId: req.userId });
    
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    console.log('👤 Empleado encontrado:', empleado.employeeId, empleado.username);

    // 2. Buscar las citas del empleado
    const filtros = { 
      employeeId: empleado.employeeId,
      estado: 'activa'
    };

    // Filtrar por fecha si se proporciona
    if (date) {
      filtros['horario.fecha'] = date;
    }

    const citas = await Cita.find(filtros)
      .sort({ 'horario.hora': 1 }); // Ordenar por hora

    console.log(`📅 ${citas.length} citas encontradas para ${date || 'todas las fechas'}`);

    // 3. Formatear las citas para el Schedule component
    const appointmentsFormatted = citas.map(cita => {
      let serviceName = 'Servicio';
      let duration = 60;
      
      if (cita.actividad === 'corte') {
        serviceName = empleado.position === 'Barbero' ? 'Corte de Cabello' : 
                     empleado.position === 'Estilista' ? 'Corte y Peinado' : 'Servicio de Barbería';
        duration = 45;
      } else if (cita.actividad === 'coaching') {
        serviceName = 'Entrenamiento Personal';
        duration = 90;
      }

      return {
        id: cita._id.toString(),
        time: cita.horario.hora,
        client: `Cliente ${cita.userId.toString().slice(-4)}`, // Temporal: últimos 4 dígitos del userId
        service: serviceName,
        duration: duration,
        status: cita.estado === 'activa' ? 'confirmed' : 
                cita.estado === 'cancelada' ? 'cancelled' : 'pending'
      };
    });

    res.json({
      success: true,
      message: `${appointmentsFormatted.length} citas encontradas`,
      appointments: appointmentsFormatted
    });

  } catch (error) {
    console.error('❌ Error obteniendo horario del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el horario'
    });
  }
});

// Verificar disponibilidad
router.get('/check-availability', verifyToken, async (req, res) => {
  const { date, time, employeeId } = req.query;
  
  try {
    console.log('🔍 Verificando disponibilidad:', { date, time, employeeId });

    if (!date || !time || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Fecha, hora y empleado son requeridos'
      });
    }

    // Verificar que el empleado existe
    const empleado = await Employee.findOne({ employeeId });
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar disponibilidad
    const disponible = await Cita.verificarDisponibilidad(employeeId, date, time);

    console.log('✅ Disponibilidad:', disponible);

    res.json({
      success: true,
      available: disponible,
      message: disponible ? 'Horario disponible' : 'Horario ocupado'
    });
  } catch (error) {
    console.error('❌ Error verificando disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando disponibilidad'
    });
  }
});

// Agendar nueva cita
router.post('/book', verifyToken, async (req, res) => {
  const { serviceType, employeeId, date, time } = req.body;
  
  try {
    console.log('📝 Agendando cita:', { serviceType, employeeId, date, time });

    if (!serviceType || !employeeId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Determinar actividad basada en serviceType
    let actividad;
    if (serviceType === 'barbero' || serviceType === 'estilista') {
      actividad = 'corte';
    } else if (serviceType === 'coach') {
      actividad = 'coaching';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de servicio inválido'
      });
    }

    // Verificar que el empleado existe y está activo
    const empleado = await Employee.findOne({ employeeId, status: 'active' });
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o no disponible'
      });
    }

    // Verificar disponibilidad una vez más
    const disponible = await Cita.verificarDisponibilidad(employeeId, date, time);
    if (!disponible) {
      return res.status(409).json({
        success: false,
        message: 'El horario ya no está disponible'
      });
    }

    // Crear la cita
    const nuevaCita = new Cita({
      userId: req.userId,
      employeeId,
      horario: {
        fecha: date,
        hora: time
      },
      actividad,
      empleadoInfo: {
        nombre: empleado.username,
        posicion: empleado.position
      }
    });

    const citaGuardada = await nuevaCita.save();
    console.log('✅ Cita creada:', citaGuardada._id);

    res.status(201).json({
      success: true,
      message: 'Cita agendada exitosamente',
      appointment: {
        id: citaGuardada._id,
        date: citaGuardada.horario.fecha,
        time: citaGuardada.horario.hora,
        serviceType: serviceType,
        serviceName: actividad === 'corte' ? 'Servicio de Barbería' : 'Entrenamiento Personal',
        employee: {
          employeeId: citaGuardada.employeeId,
          name: citaGuardada.empleadoInfo.nombre
        }
      }
    });
  } catch (error) {
    console.error('❌ Error agendando cita:', error);
    
    if (error.name === 'ConflictError') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cita en este horario'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al agendar la cita'
    });
  }
});

// Cancelar cita
router.patch('/appointment/:appointmentId/cancel', verifyToken, async (req, res) => {
  try {
    console.log('🚫 Cancelando cita:', req.params.appointmentId);

    const cita = await Cita.findOne({
      _id: req.params.appointmentId,
      userId: req.userId
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (cita.estado === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'La cita ya está cancelada'
      });
    }

    await cita.cancelar();

    console.log('✅ Cita cancelada:', cita._id);

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error cancelando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la cita'
    });
  }
});

// Obtener citas de un empleado específico
router.get('/employee/:employeeId/appointments', verifyToken, async (req, res) => {
  const { employeeId } = req.params;
  const { fecha } = req.query;
  
  try {
    console.log('🔍 Obteniendo citas del empleado:', employeeId);

    const filtros = { employeeId, estado: 'activa' };
    if (fecha) {
      filtros['horario.fecha'] = fecha;
    }

    const citas = await Cita.find(filtros)
      .sort({ 'horario.fecha': 1, 'horario.hora': 1 });

    res.json({
      success: true,
      message: `${citas.length} citas encontradas`,
      appointments: citas
    });
  } catch (error) {
    console.error('❌ Error obteniendo citas del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas del empleado'
    });
  }
});

// Obtener horarios ocupados de un empleado en una fecha
router.get('/employee/:employeeId/busy-slots', verifyToken, async (req, res) => {
  const { employeeId } = req.params;
  const { date } = req.query;
  
  try {
    console.log('🔍 Obteniendo horarios ocupados:', { employeeId, date });

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha es requerida'
      });
    }

    const citasOcupadas = await Cita.find({
      employeeId,
      'horario.fecha': date,
      estado: 'activa'
    }).select('horario.hora');

    const horasOcupadas = citasOcupadas.map(cita => cita.horario.hora);

    res.json({
      success: true,
      busySlots: horasOcupadas
    });
  } catch (error) {
    console.error('❌ Error obteniendo horarios ocupados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios ocupados'
    });
  }
});

module.exports = router;