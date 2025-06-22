const express = require('express');
const Event = require('../models/Event');
const { verifyToken } = require('../middleware/auth');
const { generateSeats } = require('../utils/seatGenerator');

const router = express.Router();

// Aquí puedes agregar todas las rutas relacionadas con eventos
// Ejemplo de ruta protegida para crear eventos
router.post('/', verifyToken, async (req, res) => {
  try {
    const eventData = req.body;
    const newEvent = new Event(eventData);
    await newEvent.save();
    
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      event: newEvent
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evento'
    });
  }
});

// Ejemplo de ruta para obtener eventos
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos'
    });
  }
});

module.exports = router;
