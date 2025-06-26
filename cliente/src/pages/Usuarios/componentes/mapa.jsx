import React, { useState, useEffect } from 'react';
import MachineDetail from './maquina'; // Importar el nuevo componente
import './mapa.css';

const MapSection = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]); // ← Ahora será dinámico
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ⭐ CARGAR MÁQUINAS DE LA BASE DE DATOS
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.cloudfitnessgym.com/api/maquinas/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // 🎯 MAPEAR DATOS DE LA BASE DE DATOS AL FORMATO DEL MAPA
        const mappedMachines = data.machines.map((machine, index) => ({
          id: machine.machineId,
          name: machine.nombre,
          type: mapCategoryToType(machine.categoria),
          x: getPositionX(machine.categoria, index), // ← Función para calcular posición
          y: getPositionY(machine.categoria, index), // ← Función para calcular posición
          image: `https://api.cloudfitnessgym.com/uploads/${machine.nombreImagen}`, // ← URL real
          video: `https://api.cloudfitnessgym.com/uploads/${machine.nombreVideo}`, // ← URL real
          description: `${machine.nombre} - ${machine.pesos}. Cantidad disponible: ${machine.cantidad}`,
          instructions: getInstructionsByCategory(machine.categoria),
          cantidad: machine.cantidad,
          pesos: machine.pesos,
          status: machine.status,
          categoria: machine.categoria
        }));
        
        setMachines(mappedMachines);
      } else {
        setError('Error al cargar máquinas del mapa');
      }
    } catch (error) {
      console.error('Error fetching machines for map:', error);
      setError('Error de conexión al cargar el mapa');
    } finally {
      setLoading(false);
    }
  };

  // 🗺️ MAPEAR CATEGORÍAS DE BD A TIPOS DEL MAPA
  const mapCategoryToType = (categoria) => {
    switch (categoria) {
      case 'cardio': return 'cardio';
      case 'fuerza': return 'strength';
      case 'libre': return 'weights';
      case 'funcional': return 'functional';
      default: return 'strength';
    }
  };

  // 📍 CALCULAR POSICIÓN X SEGÚN CATEGORÍA Y ORDEN
  const getPositionX = (categoria, index) => {
    switch (categoria) {
      case 'cardio': return 15 + (index * 10); // Zona izquierda
      case 'fuerza': return 55 + (index * 10); // Zona centro
      case 'libre': return 85 + (index * 5);   // Zona derecha
      case 'funcional': return 45 + (index * 10); // Zona abajo
      default: return 50;
    }
  };

  // 📍 CALCULAR POSICIÓN Y SEGÚN CATEGORÍA Y ORDEN
  const getPositionY = (categoria, index) => {
    switch (categoria) {
      case 'cardio': return 20 + (index * 15); // Distribuir verticalmente
      case 'fuerza': return 15 + (index * 15);
      case 'libre': return 20 + (index * 15);
      case 'funcional': return 70 + (index * 5); // Área funcional abajo
      default: return 50;
    }
  };

  // 📝 INSTRUCCIONES POR CATEGORÍA
  const getInstructionsByCategory = (categoria) => {
    const instructions = {
      'cardio': 'Ajusta velocidad gradualmente, mantén postura erguida y usa el apoyo solo si es necesario.',
      'fuerza': 'Ajusta peso apropiado, mantén postura correcta y realiza movimientos controlados.',
      'libre': 'Carga peso apropiado, usa collares de seguridad y mantén técnica correcta.',
      'funcional': 'Mantén core activado, controla movimientos y realiza ejercicios de estabilidad.'
    };
    return instructions[categoria] || 'Sigue las instrucciones del entrenador.';
  };

  const getMachineColor = (type) => {
    switch (type) {
      case 'cardio': return '#e74c3c';
      case 'strength': return '#9b59b6';
      case 'weights': return '#f39c12';
      case 'functional': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getMachineIcon = (type) => {
    switch (type) {
      case 'cardio': return '🏃';
      case 'strength': return '🏋️';
      case 'weights': return '💪';
      case 'functional': return '🤸';
      default: return '⚡';
    }
  };

  // 📊 ESTADÍSTICAS DINÁMICAS
  const stats = {
    total: machines.reduce((sum, machine) => sum + (machine.cantidad || 1), 0),
    cardio: machines.filter(m => m.type === 'cardio').length,
    strength: machines.filter(m => m.type === 'strength').length,
    weights: machines.filter(m => m.type === 'weights').length,
    functional: machines.filter(m => m.type === 'functional').length
  };

  if (loading) {
    return (
      <div className="map-section">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando mapa del gimnasio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-section">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMachines}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-section">
      <div className="map-header">
        <h2>🗺️ Mapa del Gimnasio</h2>
        <div className="map-stats">
          <span>Total de máquinas: {stats.total}</span>
          <button onClick={fetchMachines} className="refresh-btn">🔄 Actualizar</button>
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color cardio"></span>
            <span>Cardio ({stats.cardio})</span>
          </div>
          <div className="legend-item">
            <span className="legend-color strength"></span>
            <span>Fuerza ({stats.strength})</span>
          </div>
          <div className="legend-item">
            <span className="legend-color weights"></span>
            <span>Pesos Libres ({stats.weights})</span>
          </div>
          <div className="legend-item">
            <span className="legend-color functional"></span>
            <span>Funcional ({stats.functional})</span>
          </div>
        </div>
      </div>

      <div className="gym-map">
        <div className="gym-floor">
          
          {/* Áreas de fondo */}
          <div className="floor-area cardio-area">
            <span className="area-label">ZONA CARDIO</span>
          </div>
          <div className="floor-area strength-area">
            <span className="area-label">ZONA DE FUERZA</span>
          </div>
          <div className="floor-area weights-area">
            <span className="area-label">PESOS LIBRES</span>
          </div>
          <div className="floor-area functional-area">
            <span className="area-label">ÁREA FUNCIONAL</span>
          </div>
          <div className="floor-area entrance-area">
            <span className="area-label">ENTRADA</span>
          </div>
          <div className="floor-area services-area">
            <span className="area-label">SERVICIOS</span>
          </div>

          {/* ⭐ MÁQUINAS DINÁMICAS DE LA BASE DE DATOS */}
          {machines.map((machine) => (
            <div
              key={machine.id}
              className={`machine-marker ${machine.status !== 'available' ? 'unavailable' : ''}`}
              style={{
                left: `${machine.x}%`,
                top: `${machine.y}%`,
                backgroundColor: getMachineColor(machine.type)
              }}
              onClick={() => setSelectedMachine(machine)}
              title={`${machine.name} - ${machine.status === 'available' ? 'Disponible' : 'No disponible'}`}
            >
              <span className="machine-icon">{getMachineIcon(machine.type)}</span>
              <span className="machine-label">{machine.name}</span>
              {machine.cantidad > 1 && (
                <span className="machine-count">x{machine.cantidad}</span>
              )}
              {machine.status !== 'available' && (
                <span className="machine-status">⚠️</span>
              )}
            </div>
          ))}

          {/* Elementos estructurales */}
          <div className="gym-element reception">
            <span className="element-label">Recepción</span>
          </div>
          <div className="gym-element lockers">
            <span className="element-label">Vestidores</span>
          </div>
          <div className="gym-element bathrooms">
            <span className="element-label">Baños</span>
          </div>
          <div className="gym-element emergency-exit">
            <span className="element-label">Salida Emergencia</span>
          </div>

        </div>
      </div>

      {/* Mostrar componente de detalle si hay máquina seleccionada */}
      {selectedMachine && (
        <MachineDetail 
          machine={selectedMachine} 
          onClose={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
};

export default MapSection;