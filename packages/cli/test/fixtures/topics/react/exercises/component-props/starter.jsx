// Component Props — Starter Code
import React from 'react';

/**
 * Card component
 * Props: title (string), subtitle? (string, optional), children (ReactNode)
 * If subtitle is provided, render it in an <h3> inside the card.
 */
function Card({ title, subtitle, children }) {
  // TODO: destructure with default subtitle = undefined
  // TODO: render a <div className="card"> with <h2>{title}</h2>
  //       then {subtitle && <h3>{subtitle}</h3>}
  //       then <div className="card-body">{children}</div>
  return null;
}

/**
 * UserProfile component
 * Props: user (object with name, email, avatar), showEmail? (boolean, default false)
 * Uses Card internally.
 */
function UserProfile({ user, showEmail = false }) {
  // TODO: render Card with title={user.name}
  //       inside children, render <img src={user.avatar} />
  //       if showEmail, also render <p>{user.email}</p>
  return null;
}

export { Card, UserProfile };
