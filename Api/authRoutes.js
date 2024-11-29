const express = require('express');
const { registerUser, loginUser } = require('./authController');

const router = express.Router();

// Ruta de registro
router.post('/register', registerUser);

// Ruta de inicio de sesión
router.post('/login', loginUser);

module.exports = router;
