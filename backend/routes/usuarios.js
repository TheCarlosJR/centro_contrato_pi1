
const { authenticate, authorize } = require("../auth");
const express = require("express");
const router = express.Router();
const pool = require("../db_config");

// Rota: Obter usuários com paginação e busca
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 30, 
            search_username = "", 
            search_email = "", 
            search_fullname = "",
            search_role = "" 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                id,
                username,
                fullname,
                email,
                role
            FROM usuarios
            WHERE 
                (username ILIKE $1 OR $1 = '')
                AND (email ILIKE $2 OR $2 = '')
                AND (fullname ILIKE $3 OR $3 = '')
                AND (role = $4 OR $4 = '')
        `;

        const values = [
            `%${search_username}%`,
            `%${search_email}%`,
            `%${search_fullname}%`,
            search_role
        ];

        query += ` ORDER BY username LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        // Contagem total para paginacao
        const countQuery = `
            SELECT COUNT(*) 
            FROM usuarios
            WHERE 
                (username ILIKE $1 OR $1 = '')
                AND (email ILIKE $2 OR $2 = '')
                AND (fullname ILIKE $3 OR $3 = '')
                AND (role = $4 OR $4 = '')
        `;
        const countResult = await pool.query(countQuery, values.slice(0, 4));

        res.json({ 
            usuarios: result.rows,
            paginacao: {
                pagina: parseInt(page),
                por_pagina: parseInt(limit),
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota: Obter um usuario pelo ID
router.get("/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT id, username, fullname, email, role FROM usuarios WHERE id = $1", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});

// Rota: Criar um novo usuario
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
    const { username, password, fullname, email, role } = req.body;
    
    if (!username || !password || !fullname || !email || !role) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    try {
        // Verifica se usuario ou email ja existem
        const existente = await pool.query(
            "SELECT 1 FROM usuarios WHERE username = $1 OR email = $2", 
            [username, email]
        );
        
        if (existente.rows.length > 0) {
            return res.status(400).json({ error: "Username ou email já cadastrado" });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            "INSERT INTO usuarios (username, password, fullname, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, fullname, email, role",
            [username, hashedPassword, fullname, email, role]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
});

// Rota: Atualizar um usuario existente
router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    const { username, fullname, email, role } = req.body;
    
    if (!username || !fullname || !email || !role) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    try {
        // Verifica se o usuario existe
        const usuarioExistente = await pool.query(
            "SELECT 1 FROM usuarios WHERE id = $1", 
            [id]
        );
        
        if (usuarioExistente.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Verifica se novo username ou email já pertencem a outro usuário
        const conflito = await pool.query(
            "SELECT 1 FROM usuarios WHERE (username = $1 OR email = $2) AND id != $3", 
            [username, email, id]
        );
        
        if (conflito.rows.length > 0) {
            return res.status(400).json({ error: "Username ou email já está em uso por outro usuário" });
        }

        const result = await pool.query(
            "UPDATE usuarios SET username = $1, fullname = $2, email = $3, role = $4 WHERE id = $5 RETURNING id, username, fullname, email, role",
            [username, fullname, email, role, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});

// Rota: Atualizar senha do usuário
router.put("/:id/password", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
        return res.status(400).json({ error: "Nova senha é obrigatória" });
    }

    try {
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.query(
            "UPDATE usuarios SET password = $1 WHERE id = $2",
            [hashedPassword, id]
        );
        
        res.json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        res.status(500).json({ error: "Erro ao atualizar senha" });
    }
});

// Rota: Excluir um usuário
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            "DELETE FROM usuarios WHERE id = $1 RETURNING id", 
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ error: "Erro ao excluir usuário" });
    }
});

module.exports = router;