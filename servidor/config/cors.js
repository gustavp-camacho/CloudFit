const corsOptions = {
  origin: [
    'https://cloudfitnessgym.com',
    'https://www.cloudfitnessgym.com',
    'https://main.dowoiz6fy8rk4.amplifyapp.com', // Backup
    /^https:\/\/.*\.ngrok-free\.app$/, // Desarrollo con ngrok
    /^https:\/\/.*\.trycloudflare\.com$/ // Desarrollo con Cloudflare
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

module.exports = corsOptions;