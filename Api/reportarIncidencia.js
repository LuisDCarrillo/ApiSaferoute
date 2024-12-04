/* eslint-disable camelcase */
const db = require('./db')

// Función para manejar el reporte de incidencias
const reportarIncidencia = async (req, res) => {
  const { solicitud_id, estado_id, tipos_incidencias_id, observaciones } = req.body

  // Verificar campos obligatorios
  if (!solicitud_id || !estado_id || !tipos_incidencias_id || !observaciones) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    // Verificar existencia de solicitud
    console.log('Verificando solicitud...')
    const [solicitudResult] = await db.query('SELECT * FROM solicitudes WHERE id = ?', [solicitud_id])
    if (solicitudResult.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' })
    }

    // Insertar incidencia
    console.log('Insertando incidencia...')
    const incidenciaQuery = `
      INSERT INTO incidencias (solicitud_id, estado_id, tipos_incidencias_id, observaciones)
      VALUES (?, ?, ?, ?)
    `
    const [incidenciaResult] = await db.query(incidenciaQuery, [solicitud_id, estado_id, tipos_incidencias_id, observaciones])
    const incidenciaId = incidenciaResult.insertId

    // Insertar seguimiento de la incidencia
    console.log('Insertando seguimiento de la incidencia...')
    const seguimientoQuery = `
      INSERT INTO seguimientos_incidencias (incidencia_id, estado_seguimiento_id, fecha, status)
      VALUES (?, 1, NOW(), 1)
    `
    await db.query(seguimientoQuery, [incidenciaId])

    return res.status(201).json({ message: 'Incidencia reportada exitosamente', incidenciaId })
  } catch (err) {
    console.error('Error al procesar la incidencia:', err)
    return res.status(500).json({ error: 'Hubo un error al procesar la incidencia.' })
  }
}

module.exports = { reportarIncidencia }
