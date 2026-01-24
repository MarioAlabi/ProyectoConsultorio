const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Importamos la conexión
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: "API del Consultorio funcionando" });
});

// Ruta para probar la DB
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            mensaje: "Base de datos respondiendo", 
            resultado: results[0].solution 
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});