const User = require('./post'); // Modelo de usuários
const Schedule = require('./schedule'); // Modelo de agendamentos
const CollectionPoint = require('./collectionPoint'); // Modelo de pontos de coleta

// As associações entre tabelas está aqui
User.hasMany(Schedule, { foreignKey: 'userId', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Schedule.belongsTo(CollectionPoint, {
  as: 'collectionPoint',
  foreignKey: 'collectionPointId',
});

// Exporta os modelos associados
module.exports = { User, Schedule, CollectionPoint };