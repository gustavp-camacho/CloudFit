const corsOptions = {
  origin: 'http://localhost:3000', // Ajusta esto según tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

module.exports = corsOptions;