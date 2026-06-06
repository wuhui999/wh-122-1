import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OrdersPage from './pages/OrdersPage';
import PaperPage from './pages/PaperPage';
import SchemesPage from './pages/SchemesPage';
import PreviewPage from './pages/PreviewPage';
import RemnantsPage from './pages/RemnantsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OrdersPage />} />
        <Route path="/paper" element={<PaperPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/remnants" element={<RemnantsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
