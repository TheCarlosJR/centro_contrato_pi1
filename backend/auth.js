
// Importa ferramentas
const jwt = require("jsonwebtoken");

// Middleware para proteger rotas com token
const authenticate = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    
    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido." });
    }
};

// Middleware de autorizacao por role (papel)
const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Acesso negado." });
    }
    next();
};

module.exports = { authenticate, authorize };