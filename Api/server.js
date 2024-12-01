require('dotenv').config()
const express = require('express')

const cors = require('cors')
const authRoutes = require('./authRoutes') // Importar las rutas de autenticación
const app = express()

app.use(cors()) // Habilitar CORS

app.use(express.json())

// Registra las rutas

// Usar las rutas de autenticación
app.use('/api/auth', authRoutes)

// Ruta básica para pruebas
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente')
})

// Iniciar el servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
