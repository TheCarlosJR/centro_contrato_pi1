
// Importa
const { Pool } = require("pg");
// Importa o .env
require('dotenv').config( { path: "./.env" } );

// Configuracao do banco de dados
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || "contratos_db",
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
});

module.exports = pool;
