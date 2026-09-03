import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Credits from '../pages/Credits';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import BlockDirectory from '../pages/BlockDirectory';
import BlockDetail from '../pages/BlockDetail';
import DepartmentDirectory from '../pages/DepartmentDirectory';
import RoomDirectory from '../pages/RoomDirectory';
import FacultyDirectory from '../pages/FacultyDirectory';
import RoomDetail from '../pages/RoomDetail';
import SearchResults from '../pages/SearchResults';
import Map from '../pages/Map';
import Admin from '../pages/Admin';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/credits" element={<Credits />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/blocks" element={<BlockDirectory />} />
      <Route path="/blocks/:id" element={<BlockDetail />} />
      <Route path="/departments" element={<DepartmentDirectory />} />
      <Route path="/rooms" element={<RoomDirectory />} />
      <Route path="/faculty" element={<FacultyDirectory />} />
      <Route path="/map" element={<Map />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}