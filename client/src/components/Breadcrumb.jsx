import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

// items: [{ label, to }] — last item has no `to` (current page, not a link).
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="breadcrumb-item">
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {!isLast && <FaChevronRight className="breadcrumb-sep" />}
          </span>
        );
      })}
    </nav>
  );
}
