const db = require('./db')

// Función para calcular la distancia entre dos coordenadas
function calcularDistancia (lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distancia en km
}
// Función para generar un valor aleatorio para la duración en minutos
function generarDuracionAleatoria () {
  const minDuracion = 30 // 30 minutos
  const maxDuracion = 480 // 8 horas en minutos
  return Math.floor(Math.random() * (maxDuracion - minDuracion + 1)) + minDuracion
}
// Función para manejar la solicitud de servicios
const services = async (req, res) => {
  const { fechaSalida, clienteDocumento, tipoTransporteId, precio, tiposPagosId, origenLat, origenLon, destinoLat, destinoLon } = req.body

  // Verificar que se reciban los campos obligatorios
  if (!fechaSalida || !clienteDocumento || !tipoTransporteId || !tiposPagosId || origenLat === undefined || origenLon === undefined || destinoLat === undefined || destinoLon === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    console.log('Verificando cliente en la base de datos...')
    // Verificar si el cliente existe
    const [clienteResults] = await db.query('SELECT * FROM cliente WHERE documento = ?', [clienteDocumento])

    if (clienteResults.length === 0) {
      console.log('Cliente no encontrado. Creando un nuevo cliente...')
      // Crear un cliente nuevo si no existe
      await db.query('INSERT INTO cliente (documento) VALUES (?)', [clienteDocumento])
    }

    console.log('Verificando tipo de transporte...')
    // Verificar que tipoTransporteId existe
    const [transporteResult] = await db.query('SELECT id FROM tipos_transportes WHERE id = ?', [tipoTransporteId])
    if (transporteResult.length === 0) {
      return res.status(400).json({ error: 'El tipo de transporte no es válido.' })
    }

    console.log('Verificando tipo de pago...')
    // Verificar que tiposPagosId existe
    const [pagoResult] = await db.query('SELECT id FROM tipos_pagos WHERE id = ?', [tiposPagosId])
    if (pagoResult.length === 0) {
      return res.status(400).json({ error: 'El tipo de pago no es válido.' })
    }

    console.log('Insertando punto de origen...')
    const [origenResult] = await db.query('INSERT INTO puntos (latitud, longitud, status) VALUES (?, ?, 1)', [origenLat, origenLon])
    const puntoOrigenId = origenResult.insertId

    console.log('Insertando punto de destino...')
    const [destinoResult] = await db.query('INSERT INTO puntos (latitud, longitud, status) VALUES (?, ?, 1)', [destinoLat, destinoLon])
    const puntoDestinoId = destinoResult.insertId

    console.log('Calculando distancia...')
    const distancia = calcularDistancia(origenLat, origenLon, destinoLat, destinoLon)
    const duracion = generarDuracionAleatoria()
    console.log('Insertando nueva solicitud...')
    const query = `
      INSERT INTO solicitudes (punto_origen, punto_destino, fecha_traslado, fecha_creacion, estado_id, status, tipos_transportes_id, cliente_documento)
      VALUES (?, ?, ?, NOW(), 1, 1, ?, ?)
    `
    const [result] = await db.query(query, [puntoOrigenId, puntoDestinoId, fechaSalida, tipoTransporteId, clienteDocumento])
    const solicitudId = result.insertId

    console.log('Insertando nueva ruta...')
    const [rutaInsertResult] = await db.query(
      'INSERT INTO rutas (punto_origen, punto_destino, trayectoria, distancia,duracion) VALUES (?, ?, ?, ?, ?)',
      [puntoOrigenId, puntoDestinoId, 'Trayectoria indefinida', distancia, duracion]
    )
    const rutaId = rutaInsertResult.insertId

    console.log('Insertando guía de carga...')
    const guiaQuery = `
      INSERT INTO guias_cargas (ruta_id, solicitud_id, fecha_inicio, fecha_final, precio, status, tipos_pagos_id)
      VALUES (?, ?, NOW(), ?, ?, 1, ?)
    `
    const [guiaResult] = await db.query(guiaQuery, [rutaId, solicitudId, fechaSalida, precio, tiposPagosId])

    return res.status(201).json({ message: 'Solicitud registrada exitosamente', solicitudId, guiaId: guiaResult.insertId })
  } catch (err) {
    console.error('Error al procesar la solicitud:', err)
    return res.status(500).json({ error: 'Hubo un error al procesar la solicitud.' })
  }
}

module.exports = { services }
