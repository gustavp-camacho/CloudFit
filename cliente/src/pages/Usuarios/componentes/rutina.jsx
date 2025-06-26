import React, { useState, useEffect } from 'react';
import './rutina.css';

const RoutineManagement = () => {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);
  const [showExerciseCreator, setShowExerciseCreator] = useState(false);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeRoutineId, setActiveRoutineId] = useState(null);
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [routinesLoaded, setRoutinesLoaded] = useState(false);

  // Estado para crear nueva rutina
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    selectedDays: [],
    description: ''
  });

  // Estado para crear nuevo ejercicio
  const [newExercise, setNewExercise] = useState({
    name: '',
    equipmentType: '', // 'machine', 'bodyweight', 'weights'
    selectedMachine: null,
    sets: 3,
    reps: 12,
    weight: 0,
    rest: 60
  });

  const daysOfWeek = [
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
  ];

  const equipmentTypes = [
    { value: 'machine', label: 'Máquina del Gimnasio', icon: '🏋️‍♂️' },
    { value: 'bodyweight', label: 'Peso Corporal', icon: '🤸‍♂️' },
    { value: 'weights', label: 'Pesas/Mancuernas', icon: '💪' }
  ];

  // Estado de las rutinas creadas
  const [routines, setRoutines] = useState([]);

  // Cargar máquinas disponibles del backend
  useEffect(() => {
    fetchMachines();
    fetchRoutines();
  }, []);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://18.219.156.200:5000/api/maquinas/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMachines(data.machines || []);
      } else {
        setError('Error al cargar máquinas');
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError('Error de conexión al cargar máquinas');
    }
  };

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://18.219.156.200:5000/api/rutinas/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRoutines(data.routines || []);
        setRoutinesLoaded(true);
      } else {
        console.error('Error al cargar rutinas:', data.message);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRoutinesToBackend = async () => {
    try {
      setSavingRoutines(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://18.219.156.200:5000/api/rutinas/save-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routines: routines.map(routine => ({
            ...routine,
            // Asegurar que las fechas sean strings
            createdAt: routine.createdAt ? routine.createdAt.toISOString() : new Date().toISOString(),
            exercises: routine.exercises.map(exercise => ({
              ...exercise,
              createdAt: exercise.createdAt ? exercise.createdAt.toISOString() : new Date().toISOString()
            }))
          }))
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Rutinas guardadas exitosamente en la base de datos');
        // Actualizar las rutinas con los IDs del backend si los hay
        if (data.routines) {
          setRoutines(data.routines);
        }
      } else {
        setError(data.message || 'Error al guardar rutinas');
      }
    } catch (error) {
      console.error('Error saving routines:', error);
      setError('Error de conexión al guardar rutinas');
    } finally {
      setSavingRoutines(false);
    }
  };

  // Funciones para manejar rutinas
  const resetNewRoutine = () => {
    setNewRoutine({
      name: '',
      selectedDays: [],
      description: ''
    });
  };

  const openRoutineCreator = () => {
    resetNewRoutine();
    setError('');
    setShowRoutineCreator(true);
  };

  const closeRoutineCreator = () => {
    setShowRoutineCreator(false);
    resetNewRoutine();
    setError('');
  };

  const handleRoutineInputChange = (field, value) => {
    setNewRoutine(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const toggleDaySelection = (day) => {
    setNewRoutine(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const validateRoutine = () => {
    if (!newRoutine.name.trim()) {
      setError('El nombre de la rutina es obligatorio');
      return false;
    }

    if (newRoutine.selectedDays.length === 0) {
      setError('Debes seleccionar al menos un día');
      return false;
    }

    // Verificar que no haya conflictos con rutinas existentes
    const conflictingDays = newRoutine.selectedDays.filter(day =>
      routines.some(routine => routine.selectedDays.includes(day))
    );

    if (conflictingDays.length > 0) {
      setError(`Los siguientes días ya tienen rutinas asignadas: ${conflictingDays.join(', ')}`);
      return false;
    }

    return true;
  };

  const createRoutine = () => {
    if (!validateRoutine()) return;

    const routineToAdd = {
      id: Date.now(),
      name: newRoutine.name,
      selectedDays: newRoutine.selectedDays,
      description: newRoutine.description,
      exercises: [],
      createdAt: new Date()
    };

    setRoutines(prev => [...prev, routineToAdd]);
    closeRoutineCreator();
  };

  const deleteRoutine = (routineId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      setRoutines(prev => prev.filter(routine => routine.id !== routineId));
      if (activeRoutineId === routineId) {
        setActiveRoutineId(null);
      }
    }
  };

  // Funciones para manejar ejercicios
  const resetNewExercise = () => {
    setNewExercise({
      name: '',
      equipmentType: '',
      selectedMachine: null,
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60
    });
  };

  const openExerciseCreator = (routineId) => {
    setActiveRoutineId(routineId);
    resetNewExercise();
    setError('');
    setShowExerciseCreator(true);
  };

  const closeExerciseCreator = () => {
    setShowExerciseCreator(false);
    setActiveRoutineId(null);
    resetNewExercise();
    setError('');
  };

  const handleExerciseInputChange = (field, value) => {
    setNewExercise(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateExercise = () => {
    if (!newExercise.name.trim()) {
      setError('El nombre del ejercicio es obligatorio');
      return false;
    }

    if (!newExercise.equipmentType) {
      setError('Debes seleccionar el tipo de equipo');
      return false;
    }

    if (newExercise.equipmentType === 'machine' && !newExercise.selectedMachine) {
      setError('Debes seleccionar una máquina');
      return false;
    }

    if (newExercise.sets < 1 || newExercise.sets > 10) {
      setError('Las series deben estar entre 1 y 10');
      return false;
    }

    if (newExercise.reps < 1 || newExercise.reps > 100) {
      setError('Las repeticiones deben estar entre 1 y 100');
      return false;
    }

    if (newExercise.rest < 30 || newExercise.rest > 600) {
      setError('El descanso debe estar entre 30 y 600 segundos');
      return false;
    }

    return true;
  };

  const addExerciseToRoutine = () => {
    if (!validateExercise()) return;

    const exerciseToAdd = {
      id: Date.now(),
      name: newExercise.name,
      equipmentType: newExercise.equipmentType,
      machine: newExercise.selectedMachine,
      sets: newExercise.sets,
      reps: newExercise.reps,
      weight: newExercise.weight,
      rest: newExercise.rest,
      createdAt: new Date()
    };

    setRoutines(prev => prev.map(routine => 
      routine.id === activeRoutineId 
        ? { ...routine, exercises: [...routine.exercises, exerciseToAdd] }
        : routine
    ));

    closeExerciseCreator();
  };

  const removeExerciseFromRoutine = (routineId, exerciseId) => {
    setRoutines(prev => prev.map(routine =>
      routine.id === routineId
        ? { ...routine, exercises: routine.exercises.filter(ex => ex.id !== exerciseId) }
        : routine
    ));
  };

  const updateExerciseInRoutine = (routineId, exerciseId, field, value) => {
    setRoutines(prev => prev.map(routine =>
      routine.id === routineId
        ? {
            ...routine,
            exercises: routine.exercises.map(ex =>
              ex.id === exerciseId ? { ...ex, [field]: value } : ex
            )
          }
        : routine
    ));
  };

  // Funciones de utilidad
  const getEquipmentIcon = (equipmentType) => {
    switch (equipmentType) {
      case 'machine': return '🏋️‍♂️';
      case 'bodyweight': return '🤸‍♂️';
      case 'weights': return '💪';
      default: return '⚡';
    }
  };

  const getEquipmentDisplay = (exercise) => {
    switch (exercise.equipmentType) {
      case 'machine':
        return exercise.machine ? exercise.machine.nombre : 'Máquina no especificada';
      case 'bodyweight':
        return 'Peso Corporal';
      case 'weights':
        return 'Pesas/Mancuernas';
      default:
        return 'No especificado';
    }
  };

  // Obtener rutina para un día específico
  const getRoutineForDay = (day) => {
    return routines.find(routine => routine.selectedDays.includes(day));
  };

  // Filtrar máquinas por categoría
  const getMachinesByCategory = () => {
    const categories = ['cardio', 'fuerza', 'funcional', 'libre'];
    return categories.reduce((acc, category) => {
      acc[category] = machines.filter(machine => machine.categoria === category);
      return acc;
    }, {});
  };

  const machinesByCategory = getMachinesByCategory();
  const currentDayRoutine = getRoutineForDay(selectedDay);

  return (
    <div className="routine-management">
      <div className="routine-header">
        <h2>💪 Gestión de Rutinas Personalizadas</h2>
        <div className="header-actions">
          <button 
            className="save-routines-btn"
            onClick={saveRoutinesToBackend}
            disabled={savingRoutines || routines.length === 0}
          >
            {savingRoutines ? '💾 Guardando...' : '💾 Guardar Rutinas'}
          </button>
          <button 
            className="add-exercise-btn"
            onClick={openRoutineCreator}
          >
            + Crear Rutina
          </button>
        </div>
      </div>

      {/* Mostrar mensajes globales de error y éxito */}
      {error && <div className="global-error-message">{error}</div>}
      {success && <div className="global-success-message">{success}</div>}

      {/* Lista de rutinas creadas */}
      <div className="routines-section">
        <h3>Mis Rutinas ({routines.length})</h3>
        {loading && !routinesLoaded ? (
          <div className="loading-routines">
            <div className="spinner"></div>
            <p>Cargando rutinas...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="empty-routines">
            <p>No tienes rutinas creadas</p>
            <button className="add-first-routine" onClick={openRoutineCreator}>
              Crear primera rutina
            </button>
          </div>
        ) : (
          <div className="routines-grid">
            {routines.map(routine => (
              <div key={routine.id} className="routine-card">
                <div className="routine-card-header">
                  <h4>{routine.name}</h4>
                  <button 
                    className="delete-routine-btn"
                    onClick={() => deleteRoutine(routine.id)}
                  >
                    🗑️
                  </button>
                </div>
                <div className="routine-days">
                  <span>Días: {routine.selectedDays.join(', ')}</span>
                </div>
                <div className="routine-exercises-count">
                  <span>{routine.exercises.length} ejercicios</span>
                </div>
                {routine.description && (
                  <div className="routine-description">
                    <span>{routine.description}</span>
                  </div>
                )}
                <button 
                  className="add-exercise-to-routine-btn"
                  onClick={() => openExerciseCreator(routine.id)}
                >
                  + Agregar Ejercicio
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="week-navigator">
        {daysOfWeek.map(day => {
          const dayRoutine = getRoutineForDay(day);
          return (
            <button
              key={day}
              className={`day-btn ${selectedDay === day ? 'active' : ''} ${dayRoutine ? 'has-routine' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
              {dayRoutine && (
                <span className="routine-indicator">{dayRoutine.name}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="routine-content">
        <div className="day-routine">
          <h3>
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
            {currentDayRoutine && ` - ${currentDayRoutine.name}`}
          </h3>
          
          {!currentDayRoutine ? (
            <div className="empty-routine">
              <p>No hay rutina asignada para este día</p>
              <button 
                className="add-first-exercise"
                onClick={openRoutineCreator}
              >
                Crear rutina para este día
              </button>
            </div>
          ) : currentDayRoutine.exercises.length === 0 ? (
            <div className="empty-routine">
              <p>No hay ejercicios en la rutina "{currentDayRoutine.name}"</p>
              <button 
                className="add-first-exercise"
                onClick={() => openExerciseCreator(currentDayRoutine.id)}
              >
                Agregar primer ejercicio
              </button>
            </div>
          ) : (
            <div className="exercises-list">
              {currentDayRoutine.exercises.map((exercise, index) => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-header">
                    <span className="exercise-number">{index + 1}</span>
                    <span className="equipment-icon">
                      {getEquipmentIcon(exercise.equipmentType)}
                    </span>
                    <div className="exercise-info">
                      <h4>{exercise.name}</h4>
                      <span className="equipment-type">{getEquipmentDisplay(exercise)}</span>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeExerciseFromRoutine(currentDayRoutine.id, exercise.id)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="exercise-params">
                    <div className="param-group">
                      <label>Series:</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExerciseInRoutine(currentDayRoutine.id, exercise.id, 'sets', parseInt(e.target.value))}
                        min="1"
                        max="10"
                      />
                    </div>
                    
                    <div className="param-group">
                      <label>Repeticiones:</label>
                      <input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExerciseInRoutine(currentDayRoutine.id, exercise.id, 'reps', parseInt(e.target.value))}
                        min="1"
                        max="100"
                      />
                    </div>
                    
                    <div className="param-group">
                      <label>Peso (kg):</label>
                      <input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => updateExerciseInRoutine(currentDayRoutine.id, exercise.id, 'weight', parseInt(e.target.value))}
                        min="0"
                        max="500"
                        disabled={exercise.equipmentType === 'bodyweight'}
                      />
                    </div>
                    
                    <div className="param-group">
                      <label>Descanso (seg):</label>
                      <input
                        type="number"
                        value={exercise.rest}
                        onChange={(e) => updateExerciseInRoutine(currentDayRoutine.id, exercise.id, 'rest', parseInt(e.target.value))}
                        min="30"
                        max="600"
                        step="30"
                      />
                    </div>
                  </div>
                  
                  {exercise.equipmentType === 'machine' && exercise.machine && (
                    <div className="machine-details">
                      <span>🏷️ Categoría: {exercise.machine.categoria}</span>
                      <span>📊 Cantidad disponible: {exercise.machine.cantidad}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="routine-summary">
          <h4>Resumen Semanal</h4>
          <div className="weekly-stats">
            {daysOfWeek.map(day => {
              const dayRoutine = getRoutineForDay(day);
              return (
                <div key={day} className="day-stat">
                  <span className="day-name">{day.slice(0, 3)}</span>
                  <span className="exercise-count">
                    {dayRoutine ? `${dayRoutine.exercises.length} ejercicios` : 'Sin rutina'}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="equipment-summary">
            <h5>Estadísticas Generales:</h5>
            <div className="equipment-stats">
              <span>📋 Total de rutinas: {routines.length}</span>
              <span>🏋️ Total de ejercicios: {routines.reduce((sum, routine) => sum + routine.exercises.length, 0)}</span>
              <span>📅 Días con rutina: {routines.reduce((sum, routine) => sum + routine.selectedDays.length, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear rutina */}
      {showRoutineCreator && (
        <div className="exercise-creator-overlay">
          <div className="exercise-creator">
            <div className="creator-header">
              <h3>Crear Nueva Rutina</h3>
              <button 
                className="close-btn"
                onClick={closeRoutineCreator}
              >
                ✕
              </button>
            </div>
            
            <div className="creator-content">
              {/* Paso 1: Nombre de la rutina */}
              <div className="form-step">
                <h4>1. Nombre de la Rutina</h4>
                <input
                  type="text"
                  placeholder="Ej: Día de pierna, Torso y brazos, Cardio intenso..."
                  value={newRoutine.name}
                  onChange={(e) => handleRoutineInputChange('name', e.target.value)}
                  className="exercise-name-input"
                />
              </div>

              {/* Paso 2: Descripción (opcional) */}
              <div className="form-step">
                <h4>2. Descripción (Opcional)</h4>
                <input
                  type="text"
                  placeholder="Ej: Rutina enfocada en piernas y glúteos..."
                  value={newRoutine.description}
                  onChange={(e) => handleRoutineInputChange('description', e.target.value)}
                  className="exercise-name-input"
                />
              </div>

              {/* Paso 3: Selección de días */}
              <div className="form-step">
                <h4>3. Días de la Semana</h4>
                <div className="days-selection">
                  {daysOfWeek.map(day => {
                    const isOccupied = routines.some(routine => routine.selectedDays.includes(day));
                    const isSelected = newRoutine.selectedDays.includes(day);
                    
                    return (
                      <button
                        key={day}
                        className={`day-selector-btn ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`}
                        onClick={() => !isOccupied && toggleDaySelection(day)}
                        disabled={isOccupied}
                      >
                        <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                        {isOccupied && (
                          <span className="occupied-indicator">Ocupado</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="days-help-text">
                  Selecciona los días en que realizarás esta rutina. Los días ocupados por otras rutinas aparecen deshabilitados.
                </p>
              </div>

              {/* Mostrar errores */}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
            
            <div className="creator-footer">
              <button 
                className="btn-secondary" 
                onClick={closeRoutineCreator}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={createRoutine}
                disabled={!newRoutine.name || newRoutine.selectedDays.length === 0}
              >
                Crear Rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear ejercicio */}
      {showExerciseCreator && (
        <div className="exercise-creator-overlay">
          <div className="exercise-creator">
            <div className="creator-header">
              <h3>Agregar Ejercicio a "{routines.find(r => r.id === activeRoutineId)?.name}"</h3>
              <button 
                className="close-btn"
                onClick={closeExerciseCreator}
              >
                ✕
              </button>
            </div>
            
            <div className="creator-content">
              {/* Paso 1: Nombre del ejercicio */}
              <div className="form-step">
                <h4>1. Nombre del Ejercicio</h4>
                <input
                  type="text"
                  placeholder="Ej: Sentadillas búlgaras, Press militar, etc."
                  value={newExercise.name}
                  onChange={(e) => handleExerciseInputChange('name', e.target.value)}
                  className="exercise-name-input"
                />
              </div>

              {/* Paso 2: Tipo de equipo */}
              <div className="form-step">
                <h4>2. Tipo de Equipo</h4>
                <div className="equipment-types">
                  {equipmentTypes.map(type => (
                    <button
                      key={type.value}
                      className={`equipment-type-btn ${newExercise.equipmentType === type.value ? 'selected' : ''}`}
                      onClick={() => handleExerciseInputChange('equipmentType', type.value)}
                    >
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paso 3: Selección de máquina (si aplica) */}
              {newExercise.equipmentType === 'machine' && (
                <div className="form-step">
                  <h4>3. Seleccionar Máquina</h4>
                  {loading ? (
                    <div className="loading">Cargando máquinas...</div>
                  ) : (
                    <div className="machines-selection">
                      {Object.entries(machinesByCategory).map(([category, categoryMachines]) => (
                        categoryMachines.length > 0 && (
                          <div key={category} className="machine-category">
                            <h5>
                              {category === 'cardio' && '🏃‍♂️ Cardio'}
                              {category === 'fuerza' && '💪 Fuerza'}
                              {category === 'funcional' && '🤸‍♂️ Funcional'}
                              {category === 'libre' && '🏋️‍♂️ Libre'}
                            </h5>
                            <div className="machines-grid">
                              {categoryMachines.map(machine => (
                                <div
                                  key={machine.machineId}
                                  className={`machine-option ${newExercise.selectedMachine?.machineId === machine.machineId ? 'selected' : ''}`}
                                  onClick={() => handleExerciseInputChange('selectedMachine', machine)}
                                >
                                  <h6>{machine.nombre}</h6>
                                  <span className="machine-info">
                                    Disponible: {machine.cantidad} unidades
                                  </span>
                                  <span className="machine-weights">{machine.pesos}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Paso 4: Configuración del ejercicio */}
              <div className="form-step">
                <h4>4. Configuración del Ejercicio</h4>
                <div className="exercise-config">
                  <div className="config-group">
                    <label>Series:</label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => handleExerciseInputChange('sets', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div className="config-group">
                    <label>Repeticiones:</label>
                    <input
                      type="number"
                      value={newExercise.reps}
                      onChange={(e) => handleExerciseInputChange('reps', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                  
                  <div className="config-group">
                    <label>Peso (kg):</label>
                    <input
                      type="number"
                      value={newExercise.weight}
                      onChange={(e) => handleExerciseInputChange('weight', parseInt(e.target.value))}
                      min="0"
                      max="500"
                      disabled={newExercise.equipmentType === 'bodyweight'}
                      placeholder={newExercise.equipmentType === 'bodyweight' ? 'Peso corporal' : '0'}
                    />
                  </div>
                  
                  <div className="config-group">
                    <label>Descanso (seg):</label>
                    <input
                      type="number"
                      value={newExercise.rest}
                      onChange={(e) => handleExerciseInputChange('rest', parseInt(e.target.value))}
                      min="30"
                      max="600"
                      step="30"
                    />
                  </div>
                </div>
              </div>

              {/* Mostrar errores */}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
            
            <div className="creator-footer">
              <button 
                className="btn-secondary" 
                onClick={closeExerciseCreator}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={addExerciseToRoutine}
                disabled={!newExercise.name || !newExercise.equipmentType}
              >
                Agregar Ejercicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManagement;