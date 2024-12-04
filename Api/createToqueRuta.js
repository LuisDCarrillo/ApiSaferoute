/* eslint-disable camelcase */
const db = require('./db') // Asegúrate de tener tu archivo de conexión a la base de datos

const createToqueRuta = async (req, res) => {
  const { ruta_id, punto_id, status, tipos_toques_id } = req.body

  // Verificar que todos los campos estén presentes
  if (!ruta_id || !punto_id || !status || !tipos_toques_id) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos'
    })
  }

  try {
    // Consulta SQL para insertar en la tabla toques_rutas
    const [result] = await db.query(`
      INSERT INTO toques_rutas (ruta_id, punto_id, status, tipos_toques_id)
      VALUES (?, ?, ?, ?)
    `, [ruta_id, punto_id, status, tipos_toques_id])

    // Respuesta exitosa con el ID del nuevo toque de ruta
    res.status(201).json({
      success: true,
      message: 'Toque de ruta creado exitosamente',
      data: {
        id: result.insertId,
        ruta_id,
        punto_id,
        status,
        tipos_toques_id
      }
    })
  } catch (error) {
    console.error('Error al crear el toque de ruta:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear el toque de ruta'
    })
  }
}

module.exports = { createToqueRuta }
