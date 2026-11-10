import { Link } from "react-router-dom";
import "./AccountCard.css";

export default function AccountCard({ title, description, children, className = "" }) {
  return (
    <main className={`login-card ${className}`}>
      <Link className="back-link" to="/">← Back to startups</Link>
      <div className="login-heart" aria-hidden="true">♡</div>
      <h1>{title}</h1>
      <p className="login-description">{description}</p>
      {children}
    </main>
  );
}
