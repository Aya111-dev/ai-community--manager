import { BrowserRouter, Route, Routes } from 'react-router-dom';
import FacebookApp from './apps/facebook/FacebookApp.jsx';
import Home from './pages/Home';
import TiktokApp from './apps/tiktok/TiktokApp.jsx';
import ThreadsApp from './apps/threads/ThreadsApp.jsx';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facebook" element={<FacebookApp />} />
        <Route path="/tiktok/*" element={<TiktokApp />} />
        <Route path="/threads/*" element={<ThreadsApp />} />
      </Routes>
    </BrowserRouter>
  );
}