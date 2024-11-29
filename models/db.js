const Sequelize = require('sequelize')
const sequelize = new Sequelize('horizon', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
})

module.exports = {
  Sequelize,
  sequelize
}
