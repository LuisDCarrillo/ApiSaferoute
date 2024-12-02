const db = require('./db')

// Función para manejar la solicitud de servicios
const services = async (req, res) => {
  const { fechaSalida, origen, destino, clienteDocumento, tipoTransporteId } = req.body

  // Verificar que se reciban los campos obligatorios
  if (!fechaSalida || !origen || !destino || !clienteDocumento || !tipoTransporteId) {
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

    console.log('Insertando nueva solicitud...')
    // Insertar solicitud
    const query = `
      INSERT INTO solicitudes (punto_origen, punto_destino, fecha_traslado, fecha_creacion, estado_id, status, tipos_transportes_id, cliente_documento)
      VALUES (?, ?, ?, NOW(), 1, 1, ?, ?)
    `
    const [result] = await db.query(query, [
      origen,
      destino,
      fechaSalida,
      tipoTransporteId,
      clienteDocumento
    ])
    console.log('Solicitud insertada con éxito:', result)

    return res
      .status(201)
      .json({ message: 'Solicitud registrada exitosamente', solicitudId: result.insertId })
  } catch (err) {
    console.error('Error al procesar la solicitud:', err)
    return res.status(500).json({ error: 'Hubo un error al procesar la solicitud.' })
  }
}

module.exports = { services }
