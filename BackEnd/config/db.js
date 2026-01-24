const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
    logging: false, // Ponlo en true si quieres ver los comandos SQL en la consola
  }
);

// Función para probar conexión
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MariaDB con Sequelize');
    // ESTA LÍNEA ES LA MAGIA: Crea las tablas si no existen
    // 'force: false' significa: "Si ya existe, no la borres".
    // 'alter: true' significa: "Si cambié algo en el código, actualiza la tabla".
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tablas sincronizadas');
  } catch (error) {
    console.error('❌ Error conectando a la DB:', error);
  }
};

module.exports = { sequelize, connectDB };