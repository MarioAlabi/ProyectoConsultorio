const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Clinica = sequelize.define('Clinica', {
  id_clinica: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  logo: {
    type: DataTypes.STRING, // Guardaremos la URL o path del logo
    allowNull: true
  }
}, {
  tableName: 'clinicas', // Nombre real en la DB
  timestamps: false // Si no quieres created_at y updated_at
});

module.exports = Clinica;