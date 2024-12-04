/* eslint-disable camelcase */
const db = require('./db') // Asegúrate de tener tu archivo de conexión a la base de datos

const createToqueRuta = async (req, res) => {
  const { ruta_id, punto_id, status, tipos_toques_id } = req.body

  // Verificar que todos los campos necesarios estén presentes
  if (!ruta_id || !punto_id || !status || !tipos_toques_id) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos para crear el toque de ruta'
    })
  }

  try {
    // Inserción en la tabla toques_rutas
    console.log('Insertando en la tabla toques_rutas...')
    const [toqueRutaResult] = await db.query(
      `
      INSERT INTO toques_rutas (ruta_id, punto_id, status, tipos_toques_id)
      VALUES (?, ?, ?, ?)
    `,
      [ruta_id, punto_id, status, tipos_toques_id]
    )

    // Verificar si se insertó correctamente el toque de ruta
    if (!toqueRutaResult.insertId) {
      throw new Error('No se pudo insertar el toque de ruta')
    }

    // Respuesta exitosa con los datos insertados
    res.status(201).json({
      success: true,
      message: 'Toque de ruta creado exitosamente',
      data: {
        toque_ruta_id: toqueRutaResult.insertId,
        ruta_id,
        punto_id,
        status,
        tipos_toques_id,
        fecha: new Date().toLocaleString()
      }
    })
  } catch (error) {
    console.error('Error al crear el toque de ruta:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear el toque de ruta',
      error: error.message // Proporcionar el mensaje de error para facilitar la depuración
    })
  }
}

module.exports = { createToqueRuta }
