const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authController = require('./controllers/authController');
const clinicaController = require('./controllers/clinicaController');

// Importar modelos para que Sequelize sepa que existen
require('./models/Clinica');
require('./models/Usuario');
require('./models/Paciente');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Conectar a DB y crear tablas
connectDB();

app.get('/', (req, res) => {
    res.json({ message: "API Consultorio con Sequelize funcionando" });
});


// RUTAS AUTH
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// RUTAS CRUD CLINICAS
app.get('/api/clinicas', clinicaController.getClinicas);
app.post('/api/clinicas', clinicaController.createClinica);
app.delete('/api/clinicas/:id', clinicaController.deleteClinica);



app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});





