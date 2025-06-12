
const ARQ_EXCEL = "CENTRO_DE_CUSTO.xlsx";

const utils = require('./utils.js');

const xlsx = require("xlsx");
const { Client } = require("pg");

// Carrega o .env
require('dotenv').config( { path: "backend/.env" } );

async function importExcel() {
    const dbClient = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME || "contratos_db",
        password: process.env.DB_PASS,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await dbClient.connect();

        const workbook = xlsx.readFile("data/" + ARQ_EXCEL);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const rows = data.slice(2); // Pula cabeçalho e primeira linha

        for (const row of rows) {
            const cr = Number(row[utils.letra2Index("E")]) || 0;
            if (cr === 0) break;

            await dbClient.query("BEGIN"); // Inicia transação para todas as operacoes

            try {
                // Processamento dos dados (mesmo do seu código)
                const bloqueio = row[utils.letra2Index("B")]?.toLowerCase() === "bloqueado";
                const descricao = row[utils.letra2Index("F")]?.toLowerCase() ?? "";
                const nomeCliente = row[utils.letra2Index("O")]?.toLowerCase() ?? "";
                const nomeGrpCliente = row[utils.letra2Index("Q")]?.toLowerCase() ?? "";
                const gerenteMunicipal = row[utils.letra2Index("AT")]?.toLowerCase() ?? "";
                const gerente = row[utils.letra2Index("AV")]?.toLowerCase() ?? "";
                const mesReajuste1 = Number(row[utils.letra2Index("BO")]) || 0;
                const mesReajuste2 = Number(row[utils.letra2Index("BR")]) || 0;

                // Verifica se contrato ja existe
                const contratoExistente = await dbClient.query(
                    `SELECT id FROM contratos WHERE cr = $1`, 
                    [cr]
                );

                // Obtem/insere cliente e gerentes
                const clienteId = await getOrInsertCliente(dbClient, nomeCliente, nomeGrpCliente);
                const gerenteMunicipalId = await getOrInsertGerente(dbClient, gerenteMunicipal);
                const gerenteId = await getOrInsertGerente(dbClient, gerente);

                // Atualiza contrato existente
                if (contratoExistente.rows.length > 0)
                {
                    await dbClient.query(
                        `UPDATE contratos SET
                            bloqueio = $1,
                            descricao = $2,
                            cliente_id = $3,
                            gerente_municipal_id = $4,
                            gerente_id = $5,
                            mes_reajuste1 = $6,
                            mes_reajuste2 = $7,
                        WHERE cr = $8`,
                        [bloqueio, descricao, clienteId, gerenteMunicipalId, 
                         gerenteId, mesReajuste1, mesReajuste2, cr]
                    );
                }

                // Insere novo contrato
                else
                {
                    await dbClient.query(
                        `INSERT INTO contratos (
                            bloqueio, cr, descricao, cliente_id,
                            gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [bloqueio, cr, descricao, clienteId, 
                         gerenteMunicipalId, gerenteId, mesReajuste1, mesReajuste2]
                    );
                }

                await dbClient.query("COMMIT");
            }
            catch (error)
            {
                await dbClient.query("ROLLBACK");
                console.error(`Erro ao processar CR ${cr}:`, error);

                // Continua para a proxima linha
                continue;
            }
        }

        console.log("Importação concluída!");
    } catch (error) {
        console.error("Erro geral na importação:", error);
    } finally {
        await dbClient.end();
    }
}

async function getOrInsertCliente(dbClient, nome, nomeGrp) {
    let res = await dbClient.query(
        `SELECT id FROM clientes WHERE nome = $1 AND nome_grp = $2`, 
        [nome, nomeGrp]
    );
    
    if (res.rowCount === 0) {
        const insertRes = await dbClient.query(
            `INSERT INTO clientes (nome, nome_grp) VALUES ($1, $2) RETURNING id`,
            [nome, nomeGrp]
        );
        return insertRes.rows[0].id;
    }
    return res.rows[0].id;
}

async function getOrInsertGerente(dbClient, nome) {
    if (!nome) return null;
    let res = await dbClient.query(
        `SELECT id FROM gerentes WHERE nome = $1`, 
        [nome]
    );
    
    if (res.rowCount === 0) {
        const insertRes = await dbClient.query(
            `INSERT INTO gerentes (nome) VALUES ($1) RETURNING id`,
            [nome]
        );
        return insertRes.rows[0].id;
    }
    return res.rows[0].id;
}

importExcel()