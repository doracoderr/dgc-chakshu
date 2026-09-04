export default function DetailSkeleton() {
  return (
    <div className="page block-detail">
      <div className="landmark-detail-card skeleton-card">
        <div className="landmark-detail-media">
          <div className="skeleton-block skeleton-image" />
        </div>
        <div className="landmark-detail-info">
          <div className="skeleton-block skeleton-title" />
          <div className="skeleton-block skeleton-badge" />
          <div className="skeleton-block skeleton-line" />
          <div className="skeleton-block skeleton-line short" />
        </div>
      </div>
    </div>
  );
}
