export default function LocationCard({ title, subtitle, image }) {
  return (
    <div className="location-card">
      {image && <img src={image} alt={title} />}
      <div className="location-card-body">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
