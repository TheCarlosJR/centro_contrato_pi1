
import API_BASE_URL from "../config";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Importa componentes personalizados
import CreditDev from '../components/CreditDev';
import CreditExt from '../components/CreditExt';
import BtnHoverGif from '../components/BtnHoverGif';

// Importa estilos
import '../styles/global.css';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    
    const navigate = useNavigate();

    // Registra assinatura Push do usuario que permitiu receber notificacoes
    const regPushNotifications = async (userId) => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                console.log("tentando registrar");

                // Registra o Service Worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                
//NAO CHEGA AQUI
aaaa

                console.log(registration);

                // Obtem a assinatura Push
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY // Chave publica VAPID
                });

                console.log(subscription);

                // Envia a assinatura para o backend
                await axios.post(`${API_BASE_URL}/salva-push-server-id`, {
                    userId,
                    subscription: JSON.stringify(subscription) // Converte para texto
                });

            } catch (err) {
                console.error("Erro ao registrar notificações Push:", err);
            }
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
            
            //console.log("Resposta do login:", response.data);

            const token = response.data.token;
            
            // Armazena token do usuario logado
            localStorage.setItem("token", token);

            // Tenta obter os dados
            const { data } = await axios.get(`${API_BASE_URL}/ver-reajustes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Se houver contratos perto do reajuste mostre notificacao com o TOTAL
            if (data.deveNotificar) {
                
                const titulo = "📢 Reajuste Próximo!";
                const icone = "/icons8-escudo-com-um-cifrao-48.png";
                let mensagem = "";

                if (data.totalContratos == 1) {
                    mensagem = `Há um contrato com reajuste para o próximo mês.`;
                }
                else {
                    mensagem = `Há ${data.totalContratos} contrato(s) com reajuste para o próximo mês.`;
                }
        
                if (Notification.permission === 'granted') {
                    new Notification(titulo, {
                        body: mensagem,
                        icon: icone
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(async (permission) => {
                        if (permission === 'granted') {
                            await regPushNotifications(response.data.userId);
                            new Notification(titulo, {
                                body: mensagem,
                                icon: icone
                            });
                        }
                    });
                }
                else {
                    alert('Por favor permita notificações nas configurações do seu navegador para receber atualizações dos reajustes mensais.');
                }
            }

            // Redireciona apos login bem-sucedido
            navigate("/dashboard");

        } catch (err) {
            setError("Senha ou login inválidos!");
        }
    };

    return (
        <div className="bg">

            <div style={{
                filter: 'blur(4px)',
                backgroundImage: `url('/bg/nastuh-abootalebi-eHD8Y1Znfpk-unsplash.jpg')`,
            }} />

            <CreditExt />

            {/* Janela suspensa ao meio */}
            <div className="floatBox">
                <form onSubmit={handleLogin}>
                    <h1>Login</h1>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="floatBoxBtn">
                        <BtnHoverGif
                            type="submit"
                            gifSrc="/icons/icons8-usuario-homem-com-circulo.gif"
                            altText="Ícone"
                            buttonText="Entrar"
                        />
                        <BtnHoverGif
                            onClick={() => navigate("/registro")}
                            gifSrc="/icons/icons8-adicionar.gif"
                            altText="Ícone"
                            buttonText="Registrar"
                        />
                    </div>
                </form>
            </div>

            <CreditDev />
        </div>
    );
};

export default Login;
