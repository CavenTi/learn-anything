// Component Props — Solution
import React from 'react';

function Card({ title, subtitle, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {subtitle && <h3>{subtitle}</h3>}
      <div className="card-body">{children}</div>
    </div>
  );
}

function UserProfile({ user, showEmail = false }) {
  return (
    <Card title={user.name}>
      <img src={user.avatar} alt={user.name} />
      {showEmail && <p>{user.email}</p>}
    </Card>
  );
}

export { Card, UserProfile };
