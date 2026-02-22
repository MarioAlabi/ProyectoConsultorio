import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './views/shared/Landing';
import { Login } from './views/shared/Login'; // Importamos la nueva vista

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* Aquí agregaremos la ruta /doctor después */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;