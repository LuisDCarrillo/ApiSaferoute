const db = require('./db')

const driver = async (req, res) => {
  try {
    // Consulta para obtener todas las guías de carga
    const [rows] = await db.query(`
           SELECT 
    gc.id, 
    gc.ruta_id, 
    gc.solicitud_id, 
    gc.fecha_inicio, 
    gc.fecha_final, 
    gc.precio, 
    gc.status, 
    gc.tipos_pagos_id
FROM guias_cargas gc
LEFT JOIN rutas r ON gc.ruta_id = r.id
LEFT JOIN solicitudes s ON gc.solicitud_id = s.id
LEFT JOIN tipos_pagos tp ON gc.tipos_pagos_id = tp.id;
        `)

    // Respuesta con las guías de carga
    res.status(200).json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('Error al obtener guías de carga:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener las guías de carga'
    })
  }
}

module.exports = { driver }
