import { FaBuilding } from 'react-icons/fa';

export default function LocationCard({ title, subtitle, description, image }) {
  return (
    <div className="location-card">
      <div className="location-card-image">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="location-card-image-placeholder">
            <FaBuilding />
          </div>
        )}
      </div>
      <div className="location-card-body">
        <h3>{title}</h3>
        {subtitle && <p className="location-card-subtitle">{subtitle}</p>}
        {description && <p className="location-card-description">{description}</p>}
      </div>
    </div>
  );
}
