const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Clinica = require('./Clinica');

const Paciente = sequelize.define('Paciente', {
  id_paciente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dui: {
    type: DataTypes.STRING(10), // Limita caracteres
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'pacientes',
  timestamps: true
});

// Relación: Una Clínica tiene muchos Pacientes
Clinica.hasMany(Paciente, { foreignKey: 'id_clinica' });
Paciente.belongsTo(Clinica, { foreignKey: 'id_clinica' });

module.exports = Paciente;