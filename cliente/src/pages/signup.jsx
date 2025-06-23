import React, { useState } from 'react';
import './signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://18.219.156.200:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setError('');
      } else {
        setError(data.message);
        setSuccess('');
      }
    } catch (error) {
      setError('Error de conexión al servidor.');
      setSuccess('');
    }
  };

  return (
    <div className="signup-container">
      <div className="user-icon">
              <img src="Yankees_logo.png" alt="Icono Usuario" />
            </div>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre de la Cuenta:
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Correo Electrónico:
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña:
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Registrar</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <p>¿Ya tienes una cuenta? <a href="/">Iniciar Sesión</a></p>
    </div>
  );
};

export default Signup;
