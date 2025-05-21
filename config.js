// config.js

require('dotenv').config();

module.exports = {
  PORTA_SERVIDOR: process.env.PORTA_SERVIDOR || 3000,

  // Configurações do Banco de Dados SQLite
  sqlite: {
    file: process.env.DB_SQLITE_FILE || './controle_material.sqlite3' // Caminho para o arquivo do BD
  },

  // jwtSecret: process.env.JWT_SECRET,
};

