const db = require('./db')
const jwt = require('jsonwebtoken')
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Extraer el token del encabezado

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' })
  }
  const query = 'SELECT * FROM revoked_tokens WHERE token = ?'
  const [results] = await db.execute(query, [token])
  if (results.length > 0) {
    return res.status(401).json({ error: 'Token inválido.' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) // Verificar token
    req.user = decoded // Agregar usuario al objeto de solicitud
    next() // Continuar al siguiente middleware o controlador
  } catch (err) {
    console.error('Error en la autenticación:', err.message)
    return res.status(403).json({ error: 'Token no válido.' })
  }
}

module.exports = { authenticateToken }
