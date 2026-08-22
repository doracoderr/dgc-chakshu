import SearchBar from '../components/SearchBar';

export default function Home() {
  return (
    <div className="page home-page">
      <h1>DGC Chakshu</h1>
      <p className="tagline">See • Find • Navigate</p>
      <SearchBar />
      <p className="subtitle">Find blocks, rooms, departments and faculty across campus.</p>
    </div>
  );
}
