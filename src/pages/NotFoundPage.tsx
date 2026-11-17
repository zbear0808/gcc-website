import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page page-narrow not-found">
      <title>Zu Builds | Not found</title>
      <p className="not-found-code">404</p>
      <h1 className="page-title">Nothing here</h1>
      <p className="page-intro">That page doesn’t exist, or the part got renamed. Try one of these instead.</p>
      <div className="not-found-actions">
        <Link to="/" className="btn btn-go">
          Build a controller
        </Link>
        <Link to="/parts" className="btn btn-outline">
          Browse parts
        </Link>
      </div>
    </div>
  );
}
