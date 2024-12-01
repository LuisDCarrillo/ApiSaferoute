// authController.js

const bcrypt = require('bcrypt')
const db = require('./db') // Importa la conexión a la base de datos
require('dotenv').config()
const jwt = require('jsonwebtoken')
// Registrar un usuario
const registerUser = async (req, res) => {
  const { documento, nombre, apellido, telefono, correo, password } = req.body

  // Validar campos
  if (!documento || !nombre || !apellido || !telefono || !correo || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  let connection
  try {
    // Obtener una conexión para la transacción
    connection = await db.getConnection()

    // Iniciar la transacción
    await connection.beginTransaction()

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    const queryCheckEmail = 'SELECT * FROM user WHERE email = ?'
    const [emailCheck] = await connection.execute(queryCheckEmail, [correo])

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo electrónico' })
    }

    // Verificar si ya existe un usuario con el mismo documento
    const queryCheckDocumento = 'SELECT * FROM user WHERE usuario = ?'
    const [documentoCheck] = await connection.execute(queryCheckDocumento, [documento])

    if (documentoCheck.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese documento' })
    }

    // Insertar en la tabla 'usuarios'
    const queryUsuarios = `
            INSERT INTO usuarios (documento, nombre, apellido, telefono, correo, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `
    await connection.execute(queryUsuarios, [documento, nombre, apellido, telefono, correo, 1])

    // Insertar en la tabla 'user'
    const queryUser = `
            INSERT INTO user (usuario, categoria, username, email, password) 
            VALUES (?, ?, ?, ?, ?)
        `
    await connection.execute(queryUser, [
      documento, // Relacionar con el documento en 'usuarios'
      1, // Categoría predeterminada
      documento.toString(), // Username basado en el documento
      correo,
      hashedPassword // Contraseña encriptada
    ])

    // Confirmar la transacción
    await connection.commit()

    res.status(201).json({ message: 'Usuario registrado correctamente' })
  } catch (err) {
    console.error('Error al registrar usuario:', err.message)

    // Revertir la transacción si algo falla
    if (connection) {
      await connection.rollback()
    }

    res.status(500).json({ error: 'Error al registrar el usuario' })
  } finally {
    // Liberar la conexión al pool de conexiones
    if (connection) {
      await connection.release()
    }
  }
}

// Iniciar sesión
const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son obligatorios' })
  }

  try {
    const query = 'SELECT * FROM user WHERE email = ?'
    const [results] = await db.execute(query, [email])

    if (results.length === 0) {
      return res.status(400).json({ error: 'Correo electrónico o contraseña incorrectos' })
    }

    const user = results[0]
    // Comparar la contraseña (con hash)
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Correo electrónico o contraseña incorrectos' })
    }
    const userCategory = user.categoria
    const payload = { id: user.usuario, email: user.email, categoria: userCategory }
    // Datos que contiene el token
    const token = jwt.sign(
      payload, // Datos que contiene el token
      process.env.JWT_SECRET, // Clave secreta desde .env
      { expiresIn: '1h' } // Duración del token
    )
    res.status(200).json({ message: 'Inicio de sesión exitoso', token })
  } catch (err) {
    console.error('Error al procesar la solicitud:', err.message)
    res.status(500).json({ error: 'Error al procesar la solicitud' })
  }
}
const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] // Obtiene el token del header
    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado.' })
    }

    // Almacenar el token en la tabla 'revoked_tokens'
    const query = 'INSERT INTO revoked_tokens (token) VALUES (?)'
    await db.execute(query, [token])

    res.status(200).json({ message: 'Sesión cerrada correctamente.' })
  } catch (err) {
    console.error('Error al procesar la solicitud:', err.message)
    res.status(500).json({ error: 'Error al procesar la solicitud.' })
  }
}
module.exports = {
  registerUser,
  loginUser,
  logoutUser
}
