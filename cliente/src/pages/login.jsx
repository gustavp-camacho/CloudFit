//login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
        console.log('Intentando login con:', formData);

        const response = await fetch('https://cloudfitnessygm.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Respuesta completa del servidor:', data); // Ver toda la respuesta

        if (response.ok) {
            // Guardar el token
            localStorage.setItem('token', data.token);

            
            
            // Guardar los datos del usuario
            const userData = {
                username: data.username || data.user?.username || formData.email, // Intentar obtener username o usar email como fallback
                email: data.email || data.user?.email,
                // añade otros campos que necesites
                role: data.role || data.user?.role, // Asegúrate de que el backend envíe el rol
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            
            
            // Verificar qué se guardó
            console.log('Datos guardados en localStorage:', {
                token: localStorage.getItem('token'),
                user: JSON.parse(localStorage.getItem('user'))
            });
            
           // Redirección basada en el rol (ACTUALIZADA PARA EMPLEADOS)
            if (userData.role === 'admin') {
                navigate('/Admin');
            } else if (userData.role === 'user') {
                navigate('/menu');
            } else if (userData.role === 'empleado') {
                navigate('/Empleado'); // Nueva ruta para empleados
            } 
            
        } else {
            setError(data.message || 'Error en la autenticación');
        }
    } catch (err) {
        console.error('Error detallado:', err);
        setError('Error de conexión con el servidor. Asegúrate de que el servidor esté activo.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="user-icon">
              <img src="cloudfit_l.png" alt="Icono Usuario" />
            </div>
      <p>¡Empieza en la nube!</p>
      
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Correo Electrónico"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="create-account">
          <a href="/signup">CREAR CUENTA</a>
        </div>

        <button 
          type="submit" 
          className="login-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
