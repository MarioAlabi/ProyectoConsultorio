const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Clinica = require('./Clinica');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('Medico', 'Enfermera', 'Admin'),
    allowNull: false
  },
  especialidad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  jvpm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Agregamos campos de autenticación que no estaban en el diagrama pero son vitales
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

// Relación: Una Clínica tiene muchos Usuarios
// Esto crea automáticamente la columna "ClinicaId" (o id_clinica) en la tabla usuarios
Clinica.hasMany(Usuario, { foreignKey: 'id_clinica' });
Usuario.belongsTo(Clinica, { foreignKey: 'id_clinica' });

module.exports = Usuario;