const db = require('./db');
const { User, CollectionPoint } = require('./associations'); // Importa os modelos associados

// Define o modelo de agendamentos
const Schedule = db.sequelize.define(
  'schedule',
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Nome da tabela no banco de dados
        key: 'id',
      },
    },
    collectionPointId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'collectionPoints',
        key: 'id',
      },
    },
    dateScheduled: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
    },
    timeScheduled: {
      type: db.Sequelize.TIME,
      allowNull: false,
    },
    createdAt: {
      type: db.Sequelize.DATE,
      allowNull: false,
      defaultValue: db.Sequelize.NOW,
    },
  },
  {
    timestamps: false, // Desativa a criação automática de `createdAt` e `updatedAt`
  }
);

module.exports = Schedule;
