import React from 'react';

export const SkeletonTree: React.FC = () => {
  // Simulate a tree structure with varying widths and depths
  const rows = [
    { depth: 0, width: '40%', isFolder: true },
    { depth: 1, width: '55%', isFolder: true },
    { depth: 2, width: '35%', isFolder: false },
    { depth: 2, width: '45%', isFolder: false },
    { depth: 2, width: '30%', isFolder: false },
    { depth: 1, width: '50%', isFolder: true },
    { depth: 2, width: '40%', isFolder: false },
    { depth: 2, width: '60%', isFolder: false },
    { depth: 0, width: '35%', isFolder: false },
    { depth: 0, width: '42%', isFolder: false },
    { depth: 0, width: '28%', isFolder: true },
    { depth: 1, width: '38%', isFolder: false },
    { depth: 1, width: '52%', isFolder: false },
    { depth: 0, width: '33%', isFolder: false },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        boxShadow: 'var(--neo-raised)',
        overflow: 'hidden',
        height: '600px',
        padding: '12px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: `${row.depth * 20 + 8}px`,
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingRight: '12px',
              animationDelay: `${index * 80}ms`,
            }}
          >
            {/* Chevron placeholder */}
            <div
              className="skeleton-row"
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                flexShrink: 0,
                opacity: row.isFolder ? 0.5 : 0.1,
                animationDelay: `${index * 80}ms`,
              }}
            />
            {/* Checkbox placeholder */}
            <div
              className="skeleton-row"
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '5px',
                flexShrink: 0,
                animationDelay: `${index * 80 + 40}ms`,
              }}
            />
            {/* Icon placeholder */}
            <div
              className="skeleton-row"
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                flexShrink: 0,
                animationDelay: `${index * 80 + 80}ms`,
              }}
            />
            {/* Name placeholder */}
            <div
              className="skeleton-row"
              style={{
                width: row.width,
                height: '14px',
                borderRadius: '7px',
                animationDelay: `${index * 80 + 120}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
