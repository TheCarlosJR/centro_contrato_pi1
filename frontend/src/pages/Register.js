
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Importa componentes personalizados
import CreditDev from '../components/CreditDev';
import CreditExt from '../components/CreditExt';
import BtnHoverGif from '../components/BtnHoverGif';

// Importa estilos
import '../styles/global.css';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fullname, setFullname] = useState("");
  const [role, setRole] = useState("viewer"); // Padrao = viewer
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {

    e.preventDefault();
    setError("");

    // Validacao dos campos obrigatorios
    if (!fullname || !email || !password || !password2) {
      setError("Por favor, preencha todos os campos obrigatórios*");
      return;
    }

    // Verifica se as senhas coincidem
    if (password !== password2) {
      setError("As senhas não coincidem!");
      return;
    }

    // Se username estiver vazio usa o fullname
    const finalUsername = username.trim() || fullname;

    try {
      // Envia dados do registro
      await api.post("/registro", { username: finalUsername, email, password, fullname, role });

      // Redirecionar para login apos sucesso
      navigate("/");
    } catch (err) {
      console.log(err);
      return;
      setError("Erro ao registrar usuário.\n" + err);
    }
  };

  return (
    <div className="bg">

      <div style={{
          filter: 'blur(4px)',
          backgroundImage: `url('/bg/sean-pollock-PhYq704ffdA-unsplash.jpg')`,
      }} />

      <CreditExt />

      {/* Janela suspensa ao meio */}
      <div className="floatBox">
          <form onSubmit={handleRegister}>
              <h1>Registro</h1>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <input type="text" placeholder="Nome Completo*" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
              <input type="text" placeholder="Nome social" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="email" placeholder="E-mail*" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Senha*" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <input type="password" placeholder="Repita a senha*" value={password2} onChange={(e) => setPassword2(e.target.value)} required />

              <div className="floatBoxBtn">
                  <BtnHoverGif
                      onClick={() => navigate("/")}
                      gifSrc="/icons/icons8-a-esquerda-dentro-de-um-circulo.gif"
                      altText="Ícone"
                      buttonText="Voltar"
                  />
                  <BtnHoverGif
                      type="submit"
                      gifSrc="/icons/icons8-cracha.gif"
                      altText="Ícone"
                      buttonText="Registrar"
                  />
              </div>
          </form>
      </div>
      
      <CreditDev />

  </div>
  );
  
  /*
  return (
    <div>
      <h1>Registro</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input type="text" placeholder="Nome Completo" value={fullname} onChange={(e) => setFullname(e.target.value)} />
      <input type="text" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
      <!--<select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="viewer">Visualizador</option>
        <option value="admin">Administrador</option>
      </select>-->
      <button onClick={handleRegister}>Registrar</button>
    </div>
  );
  */
};

export default Register;
