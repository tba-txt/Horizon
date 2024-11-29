// models/collectionPoint.js
const db = require('./db')

const CollectionPoint = db.sequelize.define('collectionPoint', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  cnpj: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isNumeric: true
    }
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  cep: {
    type: db.Sequelize.STRING,
    allowNull: false,
    validate: {
      isNumeric: true
    }
  },
  address: {
    type: db.Sequelize.STRING,
    allowNull: false
  },
  resetToken: {
    type: db.Sequelize.STRING,
    allowNull: true
  },
  resetTokenExpiration: {
    type: db.Sequelize.DATE,
    allowNull: true
  }
})

//CollectionPoint.sync({ force: true }) // Sincronize se necessário

module.exports = CollectionPoint
