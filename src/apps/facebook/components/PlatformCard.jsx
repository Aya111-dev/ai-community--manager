import React from 'react';

const PlatformCard = ({ title, description, onClick, active }) => {
  return (
    <button
      type="button"
      className={`platform-card ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="platform-card-title">{title}</div>
      <p className="platform-card-description">{description}</p>
    </button>
  );
};

export default PlatformCard;
