const Clinica = require('../models/Clinica');

exports.getClinicas = async (req, res) => {
  const clinicas = await Clinica.findAll();
  res.json(clinicas);
};

exports.createClinica = async (req, res) => {
  try {
    const nueva = await Clinica.create(req.body);
    res.json(nueva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteClinica = async (req, res) => {
  try {
    await Clinica.destroy({ where: { id_clinica: req.params.id } });
    res.json({ message: "Clínica eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};