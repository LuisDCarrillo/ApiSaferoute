// authController.js

const bcrypt = require('bcrypt');
const db = require('./db');  // Importa la conexión a la base de datos

// Registrar un usuario
const registerUser = async (req, res) => {
    const { documento, nombre, apellido, telefono, correo, password } = req.body;

    // Validar campos
    if (!documento || !nombre || !apellido || !telefono || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    let connection;
    try {
        // Obtener una conexión para la transacción
        connection = await db.getConnection();
        
        // Iniciar la transacción
        await connection.beginTransaction();

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar en la tabla 'usuarios'
        const queryUsuarios = `
            INSERT INTO usuarios (documento, nombre, apellido, telefono, correo, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(queryUsuarios, [documento, nombre, apellido, telefono, correo, 1]);

        // Insertar en la tabla 'user'
        const queryUser = `
            INSERT INTO user (usuario, categoria, username, email, password) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await connection.execute(queryUser, [
            documento,            // Relacionar con el documento en 'usuarios'
            1,                    // Categoría predeterminada
            documento.toString(), // Username basado en el documento
            correo,
            hashedPassword,       // Contraseña encriptada
        ]);

        // Confirmar la transacción
        await connection.commit();

        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        console.error('Error al registrar usuario:', err.message);

        // Revertir la transacción si algo falla
        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({ error: 'Error al registrar el usuario' });
    } finally {
        // Liberar la conexión al pool de conexiones
        if (connection) {
            await connection.release();
        }
    }
};

// Iniciar sesión
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo electrónico y contraseña son obligatorios' });
    }

    try {
        const query = 'SELECT * FROM user WHERE email = ?';
        const [results] = await db.execute(query, [email]);

        if (results.length === 0) {
            return res.status(400).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }

        const user = results[0];

        // Comparar la contraseña (con hash)
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }

        // Aquí puedes generar un token de autenticación (JWT) si es necesario

        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (err) {
        console.error('Error al procesar la solicitud:', err.message);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
