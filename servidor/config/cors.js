const corsOptions = {
  origin: 'https://main.dowoiz6fy8rk4.amplifyapp.com', // Ajusta esto según tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

module.exports = corsOptions;