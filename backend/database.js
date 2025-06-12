// Carrega o .env
require('dotenv').config( { path: "backend/.env" } );

const { Client } = require("pg");

async function initializeDatabase() {
  // Primeiro, conecta ao banco padrão 'postgres' para criar o banco se necessário
  const adminClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "postgres", // Conecta ao banco padrao
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await adminClient.connect();
    
    // Verifica e cria o banco de dados se não existir
    const dbName = process.env.DB_NAME || "contratos_db";
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, 
      [dbName]
    );
    
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Banco de dados ${dbName} criado com sucesso.`);
    }
  } catch (error) {
    console.error("Erro ao verificar/criar banco de dados:", error);
  } finally {
    await adminClient.end();
  }

  // Agora conecta ao banco específico para criar as tabelas
  const dbClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || "contratos_db",
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await dbClient.connect();

    // Criando tabelas se não existirem
    await dbClient.query(`

      -- Para acesso aos dados
      CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          fullname VARCHAR(300) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(25) NOT NULL CHECK (role IN ('admin', 'viewer')), --Apenas admin pode alterar usuarios
          push_server_id TEXT, --Obj JSON para mostrar notificacoes
          push_server_bool BOOL DEFAULT TRUE --Permite mostrar notificacoes
      );

      -- Lista de clientes
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(400) NOT NULL,
        nome_grp VARCHAR(100) NOT NULL,
        UNIQUE (nome, nome_grp)  -- Combinacao unica
      );

      -- Lista de gerentes
      CREATE TABLE IF NOT EXISTS gerentes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE  -- Nome unico diretamente na coluna
      );

      -- Lista de contratos (lista geral)
      CREATE TABLE IF NOT EXISTS contratos (
        id SERIAL PRIMARY KEY,
        bloqueio BOOLEAN NOT NULL,
        cr INT NOT NULL,
        descricao VARCHAR(200),
        cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
        gerente_municipal_id INT REFERENCES gerentes(id) ON DELETE SET NULL,
        gerente_id INT REFERENCES gerentes(id) ON DELETE SET NULL,
        mes_reajuste1 INT CHECK (mes_reajuste1 BETWEEN 0 AND 12),
        mes_reajuste2 INT CHECK (mes_reajuste2 BETWEEN 0 AND 12)
      );
    `);

    console.log("Tabelas verificadas/criadas com sucesso.");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
  } finally {
    await dbClient.end();
  }
}

// Executa a inicialização
initializeDatabase().catch(console.error);