
import { useNavigate } from "react-router-dom";

// Importa componentes personalizados
import BtnHoverGif from '../components/BtnHoverGif';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token de autenticacao
    navigate("/"); // Redireciona para a pagina de login
  };

  return (
    
    <BtnHoverGif
        onClick={handleLogout}
        gifSrc="/icons/icons8-sair.gif"
        altText="Ícone"
        buttonText="Sair"
    />

  );
};

export default LogoutButton;