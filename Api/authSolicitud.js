/* eslint-disable camelcase */
const db = require('./db')

// Función para calcular la distancia entre dos coordenadas
function calcularDistancia (lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
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
  const {
    fechaSalida,
    clienteDocumento,
    tipoTransporteId,
    precio,
    tiposPagosId,
    origenLat,
    origenLon,
    destinoLat,
    destinoLon
  } = req.body

  // Verificar campos obligatorios
  if (!fechaSalida || !clienteDocumento || !tipoTransporteId || !tiposPagosId ||
      origenLat === undefined || origenLon === undefined ||
      destinoLat === undefined || destinoLon === undefined) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    // Verificar o insertar cliente
    console.log('Verificando cliente...')
    const [clienteResults] = await db.query('SELECT * FROM cliente WHERE documento = ?', [clienteDocumento])
    if (clienteResults.length === 0) {
      console.log('Cliente no encontrado. Creando...')
      await db.query('INSERT INTO cliente (documento) VALUES (?)', [clienteDocumento])
    }

    // Verificar tipo de transporte
    console.log('Verificando tipo de transporte...')
    const [transporteResult] = await db.query('SELECT id FROM tipos_transportes WHERE id = ?', [tipoTransporteId])
    if (transporteResult.length === 0) {
      return res.status(400).json({ error: 'El tipo de transporte no es válido.' })
    }

    // Verificar tipo de pago
    console.log('Verificando tipo de pago...')
    const [pagoResult] = await db.query('SELECT id FROM tipos_pagos WHERE id = ?', [tiposPagosId])
    if (pagoResult.length === 0) {
      return res.status(400).json({ error: 'El tipo de pago no es válido.' })
    }

    // Insertar puntos
    console.log('Insertando puntos de origen y destino...')
    const [origenResult] = await db.query('INSERT INTO puntos (latitud, longitud, status) VALUES (?, ?, 1)', [origenLat, origenLon])
    const puntoOrigenId = origenResult.insertId

    const [destinoResult] = await db.query('INSERT INTO puntos (latitud, longitud, status) VALUES (?, ?, 1)', [destinoLat, destinoLon])
    const puntoDestinoId = destinoResult.insertId

    // Calcular distancia y duración
    const distancia = calcularDistancia(origenLat, origenLon, destinoLat, destinoLon)
    const duracion = generarDuracionAleatoria()

    // Insertar solicitud
    console.log('Insertando solicitud...')
    const solicitudQuery = `
      INSERT INTO solicitudes (punto_origen, punto_destino, fecha_traslado, fecha_creacion, estado_id, status, tipos_transportes_id, cliente_documento)
      VALUES (?, ?, ?, NOW(), 1, 1, ?, ?)
    `
    const [solicitudResult] = await db.query(solicitudQuery, [puntoOrigenId, puntoDestinoId, fechaSalida, tipoTransporteId, clienteDocumento])
    const solicitudId = solicitudResult.insertId

    // Insertar ruta
    console.log('Insertando ruta...')
    const [rutaResult] = await db.query(
      'INSERT INTO rutas (punto_origen, punto_destino, trayectoria, distancia, duracion) VALUES (?, ?, ?, ?, ?)',
      [puntoOrigenId, puntoDestinoId, 'Trayectoria indefinida', distancia, duracion]
    )
    const rutaId = rutaResult.insertId

    // Insertar toques de ruta
    console.log('Insertando toques de ruta...')
    const toquesRutasQuery = `
      INSERT INTO toques_rutas (ruta_id, punto_id, status, tipos_toques_id)
      VALUES (?, ?, 1, 1), (?, ?, 1, 2)
    `
    await db.query(toquesRutasQuery, [rutaId, puntoOrigenId, rutaId, puntoDestinoId])

    // Insertar guía de carga
    console.log('Insertando guía de carga...')
    const guiaQuery = `
      INSERT INTO guias_cargas (ruta_id, solicitud_id, fecha_inicio, fecha_final, precio, status, tipos_pagos_id)
      VALUES (?, ?, NOW(), ?, ?, 1, ?)
    `
    const [guiaResult] = await db.query(guiaQuery, [rutaId, solicitudId, fechaSalida, precio, tiposPagosId])
    const guiaId = guiaResult.insertId

    // Obtener transporte disponible
    console.log('Obteniendo transporte...')
    const [transporteDatos] = await db.query('SELECT matricula, transportista_doc FROM transportes WHERE tipo_transporte_id = ?', [tipoTransporteId])
    if (transporteDatos.length === 0) {
      return res.status(400).json({ error: 'No se encontró transporte disponible.' })
    }
    const { matricula, transportista_doc } = transporteDatos[0]

    // Insertar transporte servicio
    console.log('Insertando en transporte_servicio...')
    await db.query('INSERT INTO transporte_servicio (chofer_doc, transporte_matricula, guias_cargas_id) VALUES (?, ?, ?)', [transportista_doc, matricula, guiaId])

    // Insertar seguimiento
    console.log('Insertando en seguimientos...')
    const seguimientoQuery = `
      INSERT INTO seguimientos (guias_cargas_id, estados_seguimientos_id, toque_ruta, ubicacion_actual, fecha, status)
      VALUES (?, 1, ?, 'En origen', NOW(), 1)
    `
    const [toqueRutaInicial] = await db.query('SELECT id FROM toques_rutas WHERE ruta_id = ? AND tipos_toques_id = 1', [rutaId])
    if (toqueRutaInicial.length === 0) {
      throw new Error('No se encontró el toque de ruta inicial.')
    }
    await db.query(seguimientoQuery, [guiaId, toqueRutaInicial[0].id])

    return res.status(201).json({ message: 'Solicitud registrada exitosamente', solicitudId, guiaId })
  } catch (err) {
    console.error('Error al procesar la solicitud:', err)
    return res.status(500).json({ error: 'Hubo un error al procesar la solicitud.' })
  }
}

module.exports = { services }
