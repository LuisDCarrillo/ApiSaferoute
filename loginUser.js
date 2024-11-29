const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');  // Asegúrate de que db tenga las conexiones prometidas correctamente.

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validar los campos
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

        // Comparar la contraseña encriptada con la proporcionada
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Correo electrónico o contraseña incorrectos' });
        }

        // Generar un token JWT (si estás utilizando JWT para la autenticación)
        const token = jwt.sign(
            { userId: user.usuario, email: user.email }, 
            process.env.JWT_SECRET, // Asegúrate de tener una clave secreta para el JWT
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (err) {
        console.error('Error al intentar iniciar sesión:', err.message);
        res.status(500).json({ error: 'Error al procesar la solicitud de inicio de sesión' });
    }
};

module.exports = loginUser;
