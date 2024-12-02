const mysql = require('mysql2/promise') // Usar la versión con promesas

// Crear un pool de conexiones
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1502Luis*',
  database: process.env.DB_NAME || 'db',
  waitForConnections: true, // Esperar por conexiones libres
  connectionLimit: 10, // Límite de conexiones simultáneas
  queueLimit: 0 // Sin límite en la cola
})

module.exports = db
