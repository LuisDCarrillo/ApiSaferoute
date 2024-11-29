require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./authRoutes'); // Importar las rutas de autenticación

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Usar las rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta básica para pruebas
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});