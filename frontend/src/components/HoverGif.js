
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const HoverGif = ({ gifSrc, alt, loop = false, forceHover = false, className }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [staticSrc, setStaticSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const gifRef = useRef(null);
  const containerRef = useRef(null);

  const GIF_SIZE = 32;

  // Extrai o primeiro frame do GIF como fallback
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = gifSrc;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      setStaticSrc(canvas.toDataURL('image/png'));
      setIsLoaded(true);
    };

    img.onerror = () => {
      // Fallback extremo - usar o próprio GIF como estático
      setStaticSrc(gifSrc);
      setIsLoaded(true);
    };
  }, [gifSrc]);

  /*
  // Usa uma imagem estatica png
  useEffect(() => {
    const pngSrc = gifSrc.replace('.gif', '.png');
    const img = new Image();
    
    img.onload = () => setStaticSrc(pngSrc);
    img.onerror = () => {
      // Fallback para extrair do GIF
      const gifImg = new Image();
      gifImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = gifImg.width;
        canvas.height = gifImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(gifImg, 0, 0);
        setStaticSrc(canvas.toDataURL('image/png'));
      };
      gifImg.src = gifSrc;
    };
    
    img.src = pngSrc;
  }, [gifSrc]);
  */

  // Controla a exibição do GIF baseado em forceHover
  useEffect(() => {
    if (!gifRef.current || !isLoaded) return;

    if (forceHover) {
      gifRef.current.style.display = 'block';
      gifRef.current.src = '';
      gifRef.current.src = gifSrc;
    } else {
      gifRef.current.style.display = 'none';
    }
  }, [forceHover, isLoaded, gifSrc]);

  // Reinicia o GIF quando o mouse sai
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (gifRef.current) {
      gifRef.current.style.display = 'none';
    }
  };

  if (!isLoaded) {
    return (
      <div 
        ref={containerRef}
        style={{
          width: `${GIF_SIZE}px`,
          height: `${GIF_SIZE}px`,
          backgroundColor: '#f0f0f0',
          display: 'inline-block'
        }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      role="img"
      onMouseEnter={() => {
        setIsHovering(true);
        if (gifRef.current) {
          gifRef.current.style.display = 'block';
          // Força o reinício do GIF
          gifRef.current.src = '';
          gifRef.current.src = gifSrc;
        }
      }}
      onMouseLeave={handleMouseLeave}
      style={{ 
        display: 'inline-block',
        position: 'relative',
        width: `${GIF_SIZE}px`,
        height: `${GIF_SIZE}px`,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Imagem estática (sempre presente) */}
      <img
        src={staticSrc}
        alt={alt}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isHovering ? 'none' : 'block'
        }}
      />
      
      {/* GIF (sempre presente mas oculto) */}
      <img
        ref={gifRef}
        src={gifSrc}
        alt={alt}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          animationIterationCount: loop ? 'infinite' : 1,
          display: 'none'
        }}
      />
    </div>
  );
};

HoverGif.propTypes = {
  gifSrc: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string
};

export default HoverGif;