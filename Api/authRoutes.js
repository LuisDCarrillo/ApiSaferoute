const express = require('express')
const { registerUser, loginUser, logoutUser } = require('./authController')
const { authenticateToken } = require('./authMiddleware')
const { services } = require('./authSolicitud') // Importar correctamente la función 'services'
const { driver } = require('./getSolicitud')
const { createToqueRuta } = require('./createToqueRuta')
const { reportarIncidencia } = require('./reportarIncidencia')
const router = express.Router()

// Ruta pública
router.get('/public', (req, res) => {
  res.json({ message: 'Ruta pública, no necesitas token' })
})

// Ruta protegida (requiere autenticación)
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenido a la ruta protegida', user: req.user })
})

// Ruta de registro
router.post('/register', registerUser)

// Ruta de inicio de sesióncon
router.post('/login', loginUser)

// Rutas protegidas
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: `Bienvenido, usuario con ID: ${req.user.id}` })
})

router.post('/logout', logoutUser, (req, res) => {
  // Si el token se almacena en el cliente (localStorage o cookies), el cliente es responsable de eliminarlo.
  res.status(200).json({ message: 'Sesión cerrada correctamente.' })
})

// Ruta para registrar solicitud de servicio
router.post('/services', services) // Usar la función 'services' importada

router.get('/driver', driver) // Usar la función 'services' importada

router.post('/createToqueRuta', createToqueRuta)
router.post('/reportarIncidencia', reportarIncidencia)
module.exports = router
