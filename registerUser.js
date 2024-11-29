const bcrypt = require('bcrypt');
const db = require('./db');  // Asegúrate de que db tenga las conexiones prometidas correctamente.

const registerUser = async (req, res) => {
    const { documento, nombre, apellido, telefono, correo, password } = req.body;

    // Validar campos
    if (!documento || !nombre || !apellido || !telefono || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const connection = await db.getConnection(); // Obtener la conexión de la base de datos
    try {
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
        await connection.rollback();

        res.status(500).json({ error: 'Error al registrar el usuario' });
    } finally {
        // Liberar la conexión
        connection.release();
    }
};

module.exports = registerUser;
