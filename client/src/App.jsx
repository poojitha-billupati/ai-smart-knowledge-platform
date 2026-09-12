import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Gallery from './pages/Gallery';
import Events from './pages/Events';
import AIAssistant from './pages/AIAssistant';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/events" element={<Events />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}
