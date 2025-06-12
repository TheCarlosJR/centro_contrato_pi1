
// Importa autentificacao
const { authenticate, authorize } = require("../auth");

const express = require("express");
const router = express.Router();

// Importa a conexao com o banco
const pool = require("../db_config");

/*
// Rota: Obter todos os contratos - fica pesado para o servidor
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM public.contratos");
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar contratos:", error);
        res.status(500).json({ error: "Erro ao buscar contratos" });
    }
});
*/

// Rota: Obter contratos por offset paginacao e busca
router.get("/", authenticate, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 30, 
            search_desc = "", 
            search_cliente = "", 
            search_gerente = "", 
            search_re_adj1 = "",
            search_re_adj2 = "",
            filtro_bloq = null 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                c.id,
                c.bloqueio,
                c.cr,
                c.descricao,
                (cli.nome || ' ' || cli.nome_grp) AS cliente_completo,
                ger_municipal.nome AS gerente_municipal_nome,
                ger_responsavel.nome AS gerente_responsavel_nome,
                c.mes_reajuste1,
                c.mes_reajuste2
            FROM contratos c
            LEFT JOIN clientes cli ON c.cliente_id = cli.id
            LEFT JOIN gerentes ger_municipal ON c.gerente_municipal_id = ger_municipal.id
            LEFT JOIN gerentes ger_responsavel ON c.gerente_id = ger_responsavel.id
            WHERE 
                (c.descricao ILIKE $1 OR $1 = '')
                AND ((cli.nome || ' ' || cli.nome_grp) ILIKE $2 OR $2 = '')
                AND (ger_municipal.nome ILIKE $3 OR ger_responsavel.nome ILIKE $3 OR $3 = '')
        `;

        const values = [
            `%${search_desc}%`,
            `%${search_cliente}%`,
            `%${search_gerente}%`
        ];

        // Adiciona condicao para mes_reajuste1 se nao for vazio
        if (search_re_adj1 !== "") {
            query += ` AND (c.mes_reajuste1 = $${values.length + 1} OR $${values.length + 1} IS NULL)`;
            values.push(search_re_adj1 === "" ? null : parseInt(search_re_adj1));
        }

        // Adiciona condicao para mes_reajuste2 se nao for vazio
        if (search_re_adj2 !== "") {
            query += ` AND (c.mes_reajuste2 = $${values.length + 1} OR $${values.length + 1} IS NULL)`;
            values.push(search_re_adj2 === "" ? null : parseInt(search_re_adj2));
        }

        // Adiciona condicao de bloqueio se nao for null
        if (filtro_bloq !== null && filtro_bloq !== undefined) {
            if (filtro_bloq == 2) {
                query += ` AND c.bloqueio = true`;
            } else if (filtro_bloq == 1) {
                query += ` AND c.bloqueio = false`;
            }
        }

        query += ` ORDER BY c.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        res.json({ 
            contratos: result.rows,
            paginacao: {
                pagina: parseInt(page),
                por_pagina: parseInt(limit),
                total: result.rowCount
            }
        });
    } catch (err) {
        console.error("Erro ao buscar contratos:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota: Obter contagem total de contratos (com filtros)
router.get("/count", authenticate, async (req, res) => {
    try {
        const { 
            search_desc = "", 
            search_cliente = "", 
            search_gerente = "", 
            search_re_adj1 = "",
            search_re_adj2 = "",
            filtro_bloq = null 
        } = req.query;

        let query = `
            SELECT COUNT(*) 
            FROM contratos c
            LEFT JOIN clientes cli ON c.cliente_id = cli.id
            LEFT JOIN gerentes ger_municipal ON c.gerente_municipal_id = ger_municipal.id
            LEFT JOIN gerentes ger_responsavel ON c.gerente_id = ger_responsavel.id
            WHERE 
                (c.descricao ILIKE $1 OR $1 = '')
                AND ((cli.nome || ' ' || cli.nome_grp) ILIKE $2 OR $2 = '')
                AND (ger_municipal.nome ILIKE $3 OR ger_responsavel.nome ILIKE $3 OR $3 = '')
        `;

        const values = [
            `%${search_desc}%`,
            `%${search_cliente}%`,
            `%${search_gerente}%`
        ];

        // Adiciona condições adicionais (igual à rota principal)
        if (search_re_adj1 !== "") {
            query += ` AND (c.mes_reajuste1 = $${values.length + 1} OR $${values.length + 1} IS NULL)`;
            values.push(search_re_adj1 === "" ? null : parseInt(search_re_adj1));
        }

        if (search_re_adj2 !== "") {
            query += ` AND (c.mes_reajuste2 = $${values.length + 1} OR $${values.length + 1} IS NULL)`;
            values.push(search_re_adj2 === "" ? null : parseInt(search_re_adj2));
        }

        if (filtro_bloq !== null && filtro_bloq !== undefined) {
            if (filtro_bloq == 2) {
                query += ` AND c.bloqueio = true`;
            } else if (filtro_bloq == 1) {
                query += ` AND c.bloqueio = false`;
            }
        }

        const result = await pool.query(query, values);
        
        res.json({ 
            count: parseInt(result.rows[0].count) 
        });

    } catch (err) {
        console.error("Erro ao contar contratos:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota: Obter um contrato pelo ID
router.get("/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM contratos WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Contrato não encontrado" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao buscar contrato:", error);
        res.status(500).json({ error: "Erro ao buscar contrato" });
    }
});

// Rota: Criar um novo contrato
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
    const { bloqueio, cr, descricao, cliente_id, gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2 } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO contratos (bloqueio, cr, descricao, cliente_id, gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [bloqueio, cr, descricao, cliente_id, gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar contrato:", error);
        res.status(500).json({ error: "Erro ao criar contrato" });
    }
});

// Rota: Atualizar um contrato existente
router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    const { bloqueio, cr, descricao, cliente_id, gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2 } = req.body;

    try {
        const result = await pool.query(
            `UPDATE contratos SET bloqueio = $1, cr = $2, descricao = $3, cliente_id = $4, gerente_municipal_id = $5, 
             gerente_id = $6, mes_reajuste1 = $7, mes_reajuste2 = $8 WHERE id = $9 RETURNING *`,
            [bloqueio, cr, descricao, cliente_id, gerente_municipal_id, gerente_id, mes_reajuste1, mes_reajuste2, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Contrato não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao atualizar contrato:", error);
        res.status(500).json({ error: "Erro ao atualizar contrato" });
    }
});

// Rota: Excluir um contrato
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM contratos WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Contrato não encontrado" });
        }

        res.json({ message: "Contrato excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir contrato:", error);
        res.status(500).json({ error: "Erro ao excluir contrato" });
    }
});

module.exports = router;
