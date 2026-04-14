import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  repoName: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ repoName, currentPath, onNavigate }) => {
  if (!currentPath) return null;

  const parts = currentPath.split('/').filter(Boolean);
  const crumbs = [
    { label: repoName, path: '' },
    ...parts.map((part, i) => ({
      label: part,
      path: parts.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap',
        padding: '8px 0',
        fontFamily: 'var(--font-body)',
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight
                size={14}
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
              />
            )}
            <button
              onClick={() => !isLast && onNavigate(crumb.path)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                border: 'none',
                cursor: isLast ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: isLast ? 700 : 500,
                color: isLast ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                background: isLast ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-surface)',
                boxShadow: isLast ? 'none' : 'var(--neo-flat)',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isLast) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = 'var(--neo-raised-sm)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLast) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.boxShadow = 'var(--neo-flat)';
                }
              }}
            >
              {index === 0 && <Home size={12} />}
              {crumb.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
