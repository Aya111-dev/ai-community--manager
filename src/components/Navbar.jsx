import React from 'react';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-brand">AI Community Manager</div>
      <nav className="navbar-links">
        <button type="button">Home</button>
        <button type="button">Instagram</button>
        <button type="button">TikTok</button>
        <button type="button">Facebook</button>
      </nav>
    </header>
  );
};

export default Navbar;
