import { BrowserRouter, Route, Routes } from 'react-router-dom';
import FacebookApp from './apps/facebook/FacebookApp.jsx';
import Home from './pages/Home';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facebook" element={<FacebookApp />} />
      </Routes>
    </BrowserRouter>
  );
}

