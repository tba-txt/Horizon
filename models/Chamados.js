// Chamados.js
const { sequelize, Sequelize } = require('./db'); // Importando sequelize e Sequelize
const { DataTypes } = Sequelize;

const Chamados = sequelize.define('Chamado', {
  id1: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipoChamado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  foto: {
    type: DataTypes.BLOB('long'),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Aberto'
  }
}, {
  tableName: 'Chamados',
  timestamps: false
});

module.exports = Chamados;