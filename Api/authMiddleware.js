const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Extraer el token del encabezado

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' })
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
