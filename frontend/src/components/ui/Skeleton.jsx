import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e0e0e0',
        ...style
      }}
    />
  );
}
