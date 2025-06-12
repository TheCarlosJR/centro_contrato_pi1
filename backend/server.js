
// Importa o .env
require('dotenv').config( { path: "backend/.env" } );

// Importa ferramentas
const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const webpush = require('web-push');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Importa autentificacao
const { authenticate, authorize } = require("./auth");

// Importa rotas
const contratosRoutes = require("./routes/contratos");
const usuariosRoutes = require('./routes/usuarios');

// Configuracao do servidor
const app = express();
const BK_PORT = process.env.BK_PORT || 3001;

// Importa a conexao e config com o banco
const pool = require("./db_config"); 

// Permite trabalhar com JSON no corpo das requisicoes
app.use(express.json());
app.use(cors());

// Query para obter reajustes
const QUERY_VER_REAJUSTES = `
  SELECT COUNT(*) as total
  FROM contratos 
  WHERE 
    (mes_reajuste1 = $1 OR mes_reajuste2 = $1) AND
    (mes_reajuste1 != 0 OR mes_reajuste2 != 0)
`;

// Configuracao da Push API (VAPID Keys)
webpush.setVapidDetails(
    'mailto:contato@umsite.com.br', // Nao temos endereco disponivel para isso
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/*
// Agendamento: Seg a Sex as 8h05
cron.schedule('16 8 * * 1-5', async () => {
    
    //console.log('Verificando reajustes agendados em', new Date());
  
    } catch (err) {
      console.error('Erro no agendamento:', err);
    }
},
{
    scheduled: true,
    timezone: "America/Sao_Paulo"
});
*/

// Rota de teste
app.get('/', (req, res) => {
    res.send('Servidor rodando!');
});

// Rota para registrar um novo usuario
app.post("/registro", async (req, res) => {
    const { username, password, fullname, email, role } = req.body;

    // Verifica ausencia de campos
    if (!username || !password || !fullname || !email || !role) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO usuarios (username, password, fullname, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [username, hashedPassword, fullname, email, role]
        );
        res.status(201).json({ message: "Usuário registrado com sucesso!", userId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: "Erro ao registrar usuário." });
    }
});

// Rota de login de usuario
app.post("/login", async (req, res) => {
    
    //console.log("Tentativa de login:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    try {
        
        const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        //console.log("Resultado da consulta:", result.rows);

        if (result.rows.length === 0)
        {
            //console.log("Usuário não encontrado.");
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const user = result.rows[0];
        //console.log("Usuário encontrado:", user);
        
        const isMatch = await bcrypt.compare(password, user.password);
        //console.log("Senha correta?", isMatch);

        if (!isMatch) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        if (!process.env.JWT_SECRET) {
            console.error("ERRO: JWT_SECRET não definido no .env");
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "20h" });
        //console.log("Login bem-sucedido!\nToken gerado:", token);

        // Sucesso
        res.json({ message: "Login bem-sucedido!", token });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro ao realizar login." });
    }
});

// Obtem dados do usuario logado
app.get("/eu", authenticate, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, email, role, push_server_bool FROM usuarios WHERE id = $1", [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados do usuário." });
    }
});

// Verifica reajuste no banco de dados para avisar usuario
app.get('/ver-reajustes', authenticate, async (req, res) => {
    const hoje = new Date();
    const proximoMes = hoje.getMonth() + 2; // Janeiro=0 -> Fevereiro=2
  
    // Query que CONTA os contratos com reajuste no próximo mês
    const query = QUERY_VER_REAJUSTES;
  
    try {
      const { rows } = await pool.query(query, [proximoMes]);
      const totalContratos = parseInt(rows[0].total);
  
      res.json({
        deveNotificar: totalContratos > 0,
        totalContratos // Numero de contratos com reajuste
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao verificar reajustes" });
    }
});

// Salva permitir notificacoes do usuario
app.post('/salva-push-server-id', authenticate, async (req, res) => {
    const { userId, subscription } = req.body;
    try {
        console.log(userId);
        console.log(subscription);
        
        await pool.query(
            `UPDATE usuarios SET
                push_server_bool = TRUE,
                push_server_id = $1
            WHERE id = $2`,
            [subscription, userId]
        );
        res.status(200).send('Assinatura salva!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar assinatura.');
    }
});

// Query para alterar permissao de notificacoes
async function mudaNotificacoes(id = -1, habilita = true) {
    const booleano = habilita ? "TRUE" : "FALSE";

    if (id < 0)
        return;
    
    await pool.query(  
        'UPDATE usuarios SET push_server_bool = $1 WHERE id = $2',  
        [booleano, id]  
    ); 
}

// Rota para desativar notificacoes
app.post('/notificacoes-off', authenticate, async (req, res) => {
    await mudaNotificacoes(req.user.id, false);
    res.sendStatus(200);  
});  
  
// Rota para reativar notificacoes
app.post('/notificacoes-on', authenticate, async (req, res) => {  
    await mudaNotificacoes(req.user.id, true);
    res.sendStatus(200);
});

// Rotas para manipular contratos ("./routes/contratos.js")
app.use("/contratos", contratosRoutes);

// Rotas para manipular usuarios ("./routes/usuarios.js")
app.use("/usuarios", usuariosRoutes);

// Inicia o servidor (aceitando conexoes com diferentes dispositivos)
app.listen(BK_PORT, '0.0.0.0', () => {
    console.log(`Servidor executando em https://localhost:${BK_PORT}`);

    // Execute apos 10 min (600000 ms)
    setTimeout(async () => {
        
        try {
            // Busca usuarios com notificacoes ativas
            const { rows: usuarios } = await pool.query(`
                SELECT id, push_server_id 
                FROM usuarios 
                WHERE push_server_bool = TRUE 
                AND push_server_id IS NOT NULL
            `);

            // Nenhum usuario para receber
            if (usuarios.length === 0) {
                return;
            }

            // Consulta o banco para encontrar usuarios com contratos elegiveis
            const hoje = new Date();
            const proximoMes = hoje.getMonth() + 2; // Janeiro=0 -> Fevereiro=2
        
            // Req para obter contratos a vencer
            const query = QUERY_VER_REAJUSTES;
            const { rows } = await pool.query(query, [proximoMes]);

            // Nenhum contrato
            if (rows.length === 0)
                return;
            // Apenas um contrato
            else
            if (rows.length === 1) {
                const msg = `Você tem um contrato com reajuste no próximo mês`;
            }
            // Mais de um contrato
            else {
                const msg = `Você tem ${rows.length} contratos com reajuste no próximo mês`;
            }

            console.log(msg);

            // Envia para cada usuario
            for (const usuario of usuarios) {
                try {
                    await webpush.sendNotification(
                        JSON.parse(usuario.push_server_id),
                        JSON.stringify(msg)
                    );
                    console.log(`Notificação enviada para o usuário ${usuario.id}`);
                } catch (err) {
                    console.error(`Erro no usuário ${usuario.id}:`, err.message);
                    
                    // Remove assinatura inválida (código 410 = "Gone")
                    if (err.statusCode === 410) {
                        await pool.query(`
                            UPDATE usuarios 
                            SET push_server_id = NULL, 
                                push_server_bool = FALSE 
                            WHERE id = $1
                        `, [usuario.id]);
                    }
                }
            }

            /*
            // Para cada usuario, envia notificacao via Push API
            rows.forEach(async (row) => {

                if (row.subscription) {
                
                    await webpush.sendNotification(
                        JSON.parse(row.subscription),
                        JSON.stringify({
                        title: "📅 Reajuste Agendado",
                        body: msg
                        })
                    ).catch(async (err) => {
                        
                        console.log("DEU ERRO " + err);

                        if (err.statusCode === 410) {
                        // Remove assinaturas inválidas do banco
                        await pool.query(`UPDATE usuarios SET
                                push_server_id = NULL,
                                push_server_bool = false
                            WHERE id = $1`, [row.user_id]);
                        }
                        //console.error('Erro ao enviar notificação:', err);
                    });
                }
            });
            */
        
            } catch (err) {
                console.error('Erro no agendamento:', err);
            }

    }, 100); // 10 minutos = 600000 milissegundos
});
