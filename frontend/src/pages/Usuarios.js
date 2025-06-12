
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_BASE_URL from "../config";

// Importa estilos
import '../styles/global.css';

// Importa componentes personalizados
import CreditDev from '../components/CreditDev';
import CreditExt from '../components/CreditExt';
import BtnHoverGif from '../components/BtnHoverGif';
import DBPageNav from '../components/DBPageNav';
import LogoutButton from '../components/LogoutButton';

const STR_ADMIN = "Administrador";
const STR_VIEWER = "Leitor";

const Usuarios = () => {
    const [userData, setUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [paginacao, setPaginacao] = useState({
        pagina: 1,
        por_pagina: 30,
        total: 0
    });
    const [filtros, setFiltros] = useState({
        username: '',
        email: '',
        fullname: '',
        role: ''
    });
    const [editando, setEditando] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Verifica autenticacao e permissoes
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
              navigate("/");
          } finally {
              setLoading(false);
          }
        };
  
        verifyAuth();
    }, [navigate]);

    // Busca usuarios
    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_BASE_URL}/usuarios`, {
                params: {
                    page: paginacao.pagina,
                    limit: paginacao.por_pagina,
                    search_username: filtros.username,
                    search_email: filtros.email,
                    search_fullname: filtros.fullname,
                    search_role: filtros.role
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsuarios(response.data.usuarios);
            setPaginacao(response.data.paginacao);
        } catch (err) {
            if (err.response?.status === 401) {
              setError('Sessão expirada. Redirecionando para login...');
              setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/');
              }, 2000);
            } else {
              setError(err.response?.data?.error || 'Erro ao carregar usuários');
            }
            console.error('Detalhes do erro:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, [paginacao.pagina, filtros]);

    // Atualizar filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        setPaginacao(prev => ({ ...prev, pagina: 1 }));
    };

    // Iniciar edição
    const handleEdit = (usuario) => {
        setEditando(usuario.id);
        setEditData({ ...usuario });
    };

    // Salvar edicao
    const handleSave = async (id) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`${API_BASE_URL}/usuarios/${id}`, editData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });
            
            setEditando(null);
            await fetchUsuarios(); // Recarrega a lista após edição
            setError(''); // Limpa erros anteriores
        } catch (err) {
            if (err.response?.status === 401) {
            setError('Sessão expirada. Redirecionando para login...');
            setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/');
            }, 2000);
            } else if (err.response?.status === 404) {
            setError('Usuário não encontrado');
            } else {
            setError(err.response?.data?.error || 'Erro ao atualizar usuário');
            }
            console.error('Detalhes do erro:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id, onSuccess) => {
        if (!window.confirm("Tem certeza que deseja excluir este item?")) return;
      
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${API_BASE_URL}/usuarios/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          toast.success("Item excluído com sucesso!");

          fetchUsuarios();

          //onSuccess?.(); // Callback para atualizar a lista
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Erro ao excluir";
          toast.error(errorMessage);
          
          if (error.response?.status === 403) {
            console.error("Acesso negado - usuário não é admin");
          }
        }
      };

    // Cancelar edicao
    const handleCancel = () => {
        setEditando(null);
    };

    // Atualizar campo editavel
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    // Mudar pagina
    const handlePageChange = (newPage) => {
        setPaginacao(prev => ({ ...prev, pagina: newPage }));
    };

    return (

        <div className="bg">

            <div style={{
                filter: 'blur(4px)',
                backgroundImage: `url('/bg/sean-pollock-PhYq704ffdA-unsplash.jpg')`,
            }} />

            <CreditExt />

            <div className="content">

                {/* Primeira linha */}
                <div style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <h1>
                        Gerenciamento de Usuários
                    </h1>
                    <div style={{
                        display: "flex",
                        alignItems: "stretch",
                        gap: "16px"
                    }}>
                        {isAdmin && (
                            <BtnHoverGif
                                onClick={() => navigate("/dashboard")}
                                gifSrc="/icons/icons8-a-esquerda-dentro-de-um-circulo.gif"
                                altText="Ícone"
                                buttonText="Voltar"
                            />
                        )}
                        <LogoutButton/>
                    </div>
                </div>
                
                {error && <div className="error-message">{error}</div>}

                {/* Filtros de Busca */}
                <div className="searchBar">

                    <div>
                        <input
                            type="text"
                            name="fullname"
                            value={filtros.fullname}
                            onChange={handleFilterChange}
                            placeholder="Nome Completo"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            name="username"
                            value={filtros.username}
                            onChange={handleFilterChange}
                            placeholder="Nome Social"
                        />
                    </div>
                    
                    <div>
                        <input
                            type="text"
                            name="email"
                            value={filtros.email}
                            onChange={handleFilterChange}
                            placeholder="Email"
                        />
                    </div>
                    
                    <div>
                        <label>Tipo: </label>
                        <select
                            name="role"
                            value={filtros.role}
                            onChange={handleFilterChange}
                            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                        >
                            <option value="">Todos</option>
                            <option value="admin">{STR_ADMIN}</option>
                            <option value="viewer">{STR_VIEWER}</option>
                        </select>
                    </div>
                </div>

                {/* Tabela de Usuários */}
                <div className="dashboard">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome Completo</th>
                                <th>Nome Social</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">Carregando...</td>
                                </tr>
                            ) : usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6">Nenhum usuário encontrado</td>
                                </tr>
                            ) : (
                                usuarios.map(usuario => (
                                    <tr key={usuario.id}>
                                        <td>
                                            {usuario.id}
                                        </td>
                                        <td>
                                            {editando === usuario.id ? (
                                                <input
                                                    type="text"
                                                    name="fullname"
                                                    value={editData.fullname}
                                                    onChange={handleEditChange}
                                                />
                                            ) : (
                                                usuario.fullname
                                            )}
                                        </td>
                                        <td>
                                            {editando === usuario.id ? (
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={editData.username}
                                                    onChange={handleEditChange}
                                                />
                                            ) : (
                                                usuario.username
                                            )}
                                        </td>
                                        <td>
                                            {editando === usuario.id ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editData.email}
                                                    onChange={handleEditChange}
                                                />
                                            ) : (
                                                usuario.email
                                            )}
                                        </td>
                                        <td>
                                            {editando === usuario.id ? (
                                                <select
                                                    name="role"
                                                    value={editData.role}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="admin">{STR_ADMIN}</option>
                                                    <option value="viewer">{STR_VIEWER}</option>
                                                </select>
                                            ) : (
                                                (usuario.role === "admin") ? STR_ADMIN : STR_VIEWER
                                            )}
                                        </td>
                                        <td style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            gap: "16px"
                                        }}>
                                            {editando === usuario.id ? (
                                                <>
                                                    <button onClick={() => handleSave(usuario.id)}>Salvar</button>
                                                    <button onClick={handleCancel}>Cancelar</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(usuario)}>Editar</button>
                                                    <button onClick={() => deleteItem(usuario.id)}>Apagar</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de paginacao */}
                <div style={{ 
                    width: "100%", 
                    display: "flex", 
                    justifyContent: "center",
                    margin: "5px"
                }}>
                    <DBPageNav 
                        page={paginacao.pagina}
                        setPage={handlePageChange}
                        total={paginacao.total}
                        perPage={paginacao.por_pagina}
                    />
                </div>

                <CreditDev />

            </div>
        </div>
    );
};

export default Usuarios;