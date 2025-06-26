import React, { useState } from 'react';
import './maquina.css';

const MachineDetail = ({ machine, onClose }) => {
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'cardio': return 'Cardio';
      case 'strength': return 'Fuerza';
      case 'weights': return 'Pesos Libres';
      case 'functional': return 'Funcional';
      default: return 'Equipo';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cardio': return '🏃';
      case 'strength': return '🏋️';
      case 'weights': return '💪';
      case 'functional': return '🤸';
      default: return '⚡';
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="machine-detail-overlay" onClick={onClose}>
      <div className="machine-detail-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="machine-detail-header">
          <div className="machine-title">
            <span className="machine-type-icon">{getTypeIcon(machine.type)}</span>
            <div className="machine-title-text">
              <h2>{machine.name}</h2>
              <span className="machine-category">{getTypeLabel(machine.type)}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="machine-detail-content">
          
          {/* Sección de imagen */}
          <div className="machine-image-section">
            <div className="image-container">
              {!imageError ? (
                <img 
                  src={machine.image} 
                  alt={machine.name}
                  className="machine-image"
                  onError={handleImageError}
                />
              ) : (
                <div className="image-placeholder">
                  <div className="placeholder-content">
                    <span className="placeholder-icon">📷</span>
                    <p>Imagen no disponible</p>
                  </div>
                </div>
              )}
              <div className="image-overlay">
                <span className="image-icon">{getTypeIcon(machine.type)}</span>
              </div>
            </div>
          </div>

          {/* Sección de información - SOLO DATOS DE LA BD */}
          <div className="machine-info-section">
            <div className="info-card">
              <h3>📋 Información</h3>
              <p><strong>ID:</strong> {machine.id}</p>
              <p><strong>Categoría:</strong> {machine.categoria}</p>
              <p><strong>Cantidad:</strong> {machine.cantidad}</p>
              <p><strong>Pesos:</strong> {machine.pesos}</p>
              <p><strong>Estado:</strong> {machine.status === 'available' ? 'Disponible' : 'No disponible'}</p>
            </div>
          </div>

          {/* Sección de video */}
          <div className="machine-video-section">
            <h3>🎥 Video Tutorial</h3>
            <div className="video-container">
              {!videoError ? (
                <video 
                  controls 
                  preload="metadata"
                  className="tutorial-video"
                  onError={handleVideoError}
                >
                  <source src={machine.video} type="video/mp4" />
                  Tu navegador no soporta el elemento video.
                </video>
              ) : (
                <div className="video-placeholder">
                  <div className="placeholder-content">
                    <span className="placeholder-icon">🎬</span>
                    <p>Video no disponible</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default MachineDetail;