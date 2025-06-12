import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

// Importa estilos
import '../styles/global.css';

// Importa componentes personalizados
import CreditDev from '../components/CreditDev';
import CreditExt from '../components/CreditExt';
import BtnHoverGif from '../components/BtnHoverGif';
import LogoutButton from '../components/LogoutButton';
import DBPageNav2 from '../components/DBPageNav';

const ITENS_PER_PAGE = 30;

// Capitaliza - Deixa em maiuscula a primeira letra de cada palavra
function capitalizaStr(nome) {
  return nome
    .split(' ')                  // Divide a string em palavras
    .map(palavra =>             
      palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
    )                           // Capitaliza cada palavra
    .join(' ');                 // Junta as palavras novamente
}

// Pagina Dashboard
const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isNotificar, setNotificar] = useState(true);
    const [totalContratos, setTotalContratos] = useState(0);
    const [contratos, setContratos] = useState([]);
    const [page, setPage] = useState(1);
    const [search_desc, setSearchDesc] = useState("");
    const [search_cliente, setSearchCli] = useState("");
    const [search_gerente, setSearchGer] = useState("");
    const [search_re_adj1, setSearchReAdj1] = useState("");
    const [search_re_adj2, setSearchReAdj2] = useState("");
    const [filtro_bloq, setFiltroBloqueio] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingContratos, setLoadingContratos] = useState(false);

    const navigate = useNavigate();

    // Verifica autenticacao e permissoes (pega usuario)
    //----------------------------------------------------

    useEffect(() => {
      const verifyAuth = async () => {
        const token = localStorage.getItem("token");

        // Token ausente
        if (!token) {
            navigate("/");
            return;
        }

        try {
            // Busca dados do usuario
            const response = await axios.get(`${API_BASE_URL}/eu`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setUserData(response.data);
            setIsAdmin(response.data.role === 'admin');
            
        } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            localStorage.removeItem("token");
            navigate("/login");
        } finally {
            setLoading(false);
        }
      };

      verifyAuth();
    }, [navigate]);

    // Busca contratos (apenas se autenticado)
    //----------------------------------------------------
    
    useEffect(() => {
      if (!userData) return;
    
      const timer = setTimeout(() => {
        // Crie um objeto com todos os parâmetros de busca
        const params = {
          page,
          limit: ITENS_PER_PAGE,
          search_desc,
          search_cliente,
          search_gerente,
          search_re_adj1,
          search_re_adj2,
          filtro_bloq
        };
    
        // Chama as duas funções com os mesmos parâmetros
        fetchContratos(params);
        fetchTotalContratos(params);
      }, 300);
      
      return () => clearTimeout(timer);
    }, [userData, page, search_desc, search_cliente, search_gerente, search_re_adj1, search_re_adj2, filtro_bloq]);
    
    // Atualize suas funções para receber os parâmetros
    const fetchTotalContratos = async (params) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/contratos/count`, {
          params: {
            ...params,  // Usa os mesmos parâmetros
            page: undefined,  // Remove paginação para o count
            limit: undefined  // Count não precisa de limite
          },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setTotalContratos(response.data.count);
      } catch (err) {
        console.error("Erro ao buscar total:", err);
      }
    };
    
    const fetchContratos = async (params) => {
      setLoadingContratos(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/contratos`, {
          params,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setContratos(response.data.contratos || response.data);
      } catch (err) {
        // ... tratamento de erro existente
      } finally {
        setLoadingContratos(false);
      }
    };

    const mudaNotificacoes = async (mostrar) => {
      try {
        // Obtem registro do usuario
        const token = localStorage.getItem("token");

        // Redundancia
        if (mostrar !== userData.push_server_bool)
        {
          // Obtem endereco backend
          const addr = !!mostrar ? "notificacoes-on" : "notificacoes-off";

          // Pede dados para o servidor
          await axios.post(`${API_BASE_URL}/${addr}`, null, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.log(err);
        return;
      }

      // Atualiza interface
      setNotificar(mostrar);
    }

    if (loading) {
        return <div className="loading-full">Carregando informações do usuário...</div>;
    }

    return (
      <div className="bg">

        {/* Div do fundo borrado (posicao fixa) */}
        <div style={{ backgroundImage: `url('/bg/shapelined-_JBKdviweXI-unsplash.jpg')`, }}/>
      
        <CreditExt />

        <div className="content">

            {/* Linha de usuario */}
            <div style={{
              width: "100%",
              marginTop: "30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>
                Olá, {userData.username || "usuário"}!
              </span>
              <div style={{
                display: "flex",
                alignItems: "stretch",
                gap: "16px"
              }}>
                {!!isAdmin && (
                  <BtnHoverGif
                    onClick={() => navigate("/editar-usuarios")}
                    buttonText="Gerenciar usuários"
                    gifSrc="/icons/icons8-macho-de-configuracoes-de-admin.gif"
                    altText="Ícone"
                  />
                )}
                {isNotificar ? (
                  <BtnHoverGif
                    onClick={() => mudaNotificacoes(false)}
                    buttonText="Desativar notificações"
                    gifSrc="/icons/icons8-calendario-relogio.gif"
                    altText="Ícone"
                  />
                ) : (
                  <BtnHoverGif
                    onClick={() => mudaNotificacoes(true)}
                    buttonText="Ativar notificações"
                    gifSrc="/icons/icons8-calendario.gif"
                    altText="Ícone"
                  />
                )}
                <LogoutButton/>
              </div>
            </div>

            {/* Titulo */}
            <div style={{
              width: "100%",
              marginTop: "0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h1>
                Lista de Contratos
              </h1>
            </div>
            
            {/* Campos de pesquisa */}
            <div className="searchBar">
              <input
                  type="text"
                  placeholder="Buscar Contrato..."
                  value={search_desc}
                  onChange={(e) => setSearchDesc(e.target.value)}
              />
              <input
                  type="text"
                  placeholder="Buscar Cliente..."
                  value={search_cliente}
                  onChange={(e) => setSearchCli(e.target.value)}
              />
              <input
                  type="text"
                  placeholder="Buscar Gerente..."
                  value={search_gerente}
                  onChange={(e) => setSearchGer(e.target.value)}
              />
              <input
                  type="text"
                  placeholder="Buscar Reajuste 1..."
                  value={search_re_adj1}
                  onChange={(e) => setSearchReAdj1(e.target.value)}
              />
              <input
                  type="text"
                  placeholder="Buscar Reajuste 2..."
                  value={search_re_adj2}
                  onChange={(e) => setSearchReAdj2(e.target.value)}
              />
              <div>
                <select 
                  value={filtro_bloq}
                  onChange={(e) => setFiltroBloqueio(Number(e.target.value))}
                  style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                >
                  <option value={0}>Todos</option>
                  <option value={1}>Liberados</option>
                  <option value={2}>Bloqueados</option>
                </select>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <DBPageNav2
                  page={page}
                  setPage={setPage}
                  total={totalContratos}
                  perPage={ITENS_PER_PAGE}
                />
              </div>
            </div>

            {/* Tabela */}
            {loadingContratos ? (
                <div className="loading">Carregando contratos...</div>
            ) : (
                <div className="dashboard">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Descrição</th>
                                <th>Cliente</th>
                                <th>Gerente Municipal</th>
                                <th>Gerente Responsável</th>
                                <th>Reajuste 1</th>
                                <th>Reajuste 2</th>
                                <th>Bloqueio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contratos.length > 0 ? (
                                contratos.map((contrato) => (
                                    <tr key={contrato.id}>
                                        {/*
                                        <td>{contrato.id}</td>
                                        <td style={{ textAlign: "left" }}>{`Empresa #${contrato.id}`}</td>
                                        <td style={{ textAlign: "left" }}>{`Cliente #${contrato.id}`}</td>
                                        <td>{`Nome completo do gerente municipal #${contrato.id}`}</td>
                                        <td>{`Nome completo do gerente #${contrato.id}`}</td>
                                        <td>{(contrato.id + 1) % 12}</td>
                                        <td>{(contrato.id + 2) % 12}</td>
                                        <td>{((contrato.id % 2) == 0) ? '❌ Bloqueado' : '✅ Liberado'}</td>
                                        */}
                                        <td>{contrato.id}</td>
                                        <td style={{ textAlign: "left" }}>{capitalizaStr(contrato.descricao)}</td>
                                        <td style={{ textAlign: "left" }}>{capitalizaStr(contrato.cliente_completo)}</td>
                                        <td>{capitalizaStr(contrato.gerente_municipal_nome)}</td>
                                        <td>{capitalizaStr(contrato.gerente_responsavel_nome)}</td>
                                        <td>{contrato.mes_reajuste1}</td>
                                        <td>{contrato.mes_reajuste2}</td>
                                        <td>{contrato.bloqueio ? '❌ Bloqueado' : '✅ Liberado'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center' }}>
                                        Nenhum contrato encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Controles de paginacao */}
            <div style={{ 
              width: "100%", 
              display: "flex", 
              justifyContent: "center",
              margin: "5px"
            }}>
                <DBPageNav2
                  page={page}
                  setPage={setPage}
                  total={totalContratos}
                  perPage={ITENS_PER_PAGE}
                />
            </div>
        </div>

        <CreditDev />

      </div>
    );
};

export default Dashboard;