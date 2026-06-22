// useEffect Exercise — Starter Code
import React, { useState, useEffect } from 'react';

/**
 * Clock component
 * Displays the current time and updates every second.
 * Clean up the interval when the component unmounts.
 */
function Clock() {
  const [time, setTime] = useState(new Date());

  // TODO: useEffect to setInterval every 1000ms
  //       return cleanup function that calls clearInterval
  //       remember empty dependency array

  return <div>{time.toLocaleTimeString()}</div>;
}

/**
 * UserFetcher component
 * Props: userId (number)
 * Fetches user data from an API whenever userId changes.
 * Displays loading state while fetching.
 */
function UserFetcher({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // TODO: useEffect that depends on userId
  //       set loading to true before fetch
  //       after response.json(), setUser and setLoading(false)
  //       handle abort if component unmounts or userId changes mid-fetch

  if (loading) return <div>Loading...</div>;
  if (!user) return null;
  return <div>{user.name}</div>;
}

export { Clock, UserFetcher };
