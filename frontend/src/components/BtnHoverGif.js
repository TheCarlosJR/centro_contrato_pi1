
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import HoverGif from './HoverGif';

const BtnHoverGif = ({
  type = 'button',
  onClick,
  gifSrc,
  altText,
  buttonText = 'Entrar',
  gifProps = {},
  buttonStyle = {},
  textStyle = {},
  containerStyle = {}
}) => {

    const [isButtonHovered, setIsButtonHovered] = useState(false);

    return (
        <button 
        type={type}
        onClick={onClick}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        style={{
            /*border: 'none',
            background: 'none',*/
            cursor: 'pointer',
            ...buttonStyle
        }}
        >
        <div style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            ...containerStyle
        }}>
            <HoverGif
                gifSrc={gifSrc}
                alt={altText}
                forceHover={isButtonHovered}
                {...gifProps}
            />
            <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold',
                ...textStyle
            }}>
            {buttonText}
            </p>
        </div>
        </button>
    );
};

BtnHoverGif.propTypes = {
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  gifSrc: PropTypes.string.isRequired,
  altText: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  gifProps: PropTypes.object,
  buttonStyle: PropTypes.object,
  textStyle: PropTypes.object,
  containerStyle: PropTypes.object
};

export default BtnHoverGif;