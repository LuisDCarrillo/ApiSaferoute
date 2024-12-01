const express = require('express')
const { registerUser, loginUser } = require('./authController')
const { authenticateToken } = require('./authMiddleware')
const router = express.Router()

router.get('/public', (req, res) => {
  res.json({ message: 'Ruta pública, no necesitas token' })
})

// Ruta protegida (requiere autenticación)
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenido a la ruta protegida', user: req.user })
})
// Ruta de registro
router.post('/register', registerUser)

// Ruta de inicio de sesión
router.post('/login', loginUser)
// Rutas protegidas
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: `Bienvenido, usuario con ID: ${req.user.id}` })
})

module.exports = router
