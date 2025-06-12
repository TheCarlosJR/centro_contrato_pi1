
// Componente de paginacao
const DBPageNav = ({ 
    page, 
    setPage,
    total,
    perPage
  }) => {
    const totalPages = Math.ceil(total / perPage);
    
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "10px" 
      }}>
        <button
          onClick={() => setPage(page - 1)} 
          disabled={page === 1}
          style={{
            padding: '5px 10px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            opacity: page === 1 ? 0.5 : 1
          }}
        >
          ← Anterior
        </button>
        
        <div style={{ margin: "0 10px" }}>
          Página {page} de {totalPages}
        </div>
        
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          style={{
            padding: '5px 10px',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages ? 0.5 : 1
          }}
        >
          Próxima →
        </button>
      </div>
    );
  };
  
  export default DBPageNav;