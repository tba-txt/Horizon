const db = require('./db');
const Sequelize = require('sequelize');

// Define o modelo de usuários
const User = db.sequelize.define('user', {
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
  idade: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    validate: {
        min: 18,
        max: 69,
    }
  },
dataNascimento: {
  type: Sequelize.DATE,
  allowNull: true, 
  defaultValue: Sequelize.NOW 
  },
  cpf: {
    type: db.Sequelize.STRING,
    allowNull: false,
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
    allowNull: false,
    is: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  },
  address: {
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
  bloodType: {
    type: db.Sequelize.STRING,
    allowNull: false,
    validate: {
      isIn: [['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']]
    }
  },
  resetToken: {
    type: db.Sequelize.STRING,
    allowNull: true
  },
  resetTokenExpiration: {
    type: db.Sequelize.DATE,
    allowNull: true
  },
  role: {
    type: db.Sequelize.STRING,
    defaultValue: 'user' // Valor padrão como 'user'
  }
});

// User.sync({ force: true })
//User.sync()

module.exports = User
