import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import BlockDirectory from '../pages/BlockDirectory';
import DepartmentDirectory from '../pages/DepartmentDirectory';
import FacultyDirectory from '../pages/FacultyDirectory';
import RoomDetail from '../pages/RoomDetail';
import SearchResults from '../pages/SearchResults';
import Map from '../pages/Map';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blocks" element={<BlockDirectory />} />
      <Route path="/departments" element={<DepartmentDirectory />} />
      <Route path="/faculty" element={<FacultyDirectory />} />
      <Route path="/map" element={<Map />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/search" element={<SearchResults />} />
    </Routes>
  );
}