const Usuario = require('../models/Usuario');

exports.register = async (req, res) => {
  try {
    // Recibimos datos del body
    const { nombre, email, password, rol, id_clinica } = req.body;
    
    // Creamos el usuario (OJO: En producción usa bcrypt para hashear password)
    const nuevoUsuario = await Usuario.create({ 
      nombre, email, password, rol, id_clinica 
    });
    
    res.json({ message: "Usuario registrado", user: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscamos usuario por email
    const user = await Usuario.findOne({ where: { email } });
    
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    
    // Verificamos password (comparación simple para este demo)
    if (user.password !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    res.json({ message: "Login exitoso", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};