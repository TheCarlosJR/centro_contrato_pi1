
// Endereco e porta para o backend (tem que ser diferente do frontend)
const BK_PORT = process.env.REACT_APP_BK_PORT || 3001;
const BK_IP = process.env.REACT_APP_BK_IP || "localhost";

const API_BASE_URL = `http://${BK_IP}:${BK_PORT}`;

export default API_BASE_URL;