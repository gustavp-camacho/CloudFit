// Función de generación de asientos
function generateSeats(eventId, zoneConfig, zoneName, price) {
  const seats = [];
  
  // Asegurar que zoneId siempre esté en minúsculas
  const zoneId = zoneName.toLowerCase().replace(/\s+/g, '_');
  
  for (let row = 1; row <= zoneConfig.rows; row++) {
    for (let seatNum = 1; seatNum <= zoneConfig.seatsPerRow; seatNum++) {
      seats.push({
        eventId,
        zoneId,
        zone: zoneName,
        row,
        seatNumber: seatNum,
        price,
        status: 'available',
        reservationTime: null,
        purchaseTime: null,
        purchasedBy: null
      });
    }
  }
  
  return seats;
}

module.exports = { generateSeats };