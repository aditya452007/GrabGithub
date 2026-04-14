import React, { useState } from 'react';
import { useStore } from './store';
import { TreeBrowser } from './components/TreeBrowser';
import { DownloadPanel } from './components/DownloadPanel';
import { ToastContainer, showToast } from './components/Toast';
import { Breadcrumb } from './components/Breadcrumb';
import { Github, Search, X, CheckSquare, Square, ChevronDown, ChevronUp, RotateCcw, Moon, Sun, Wand2, Sparkles, Rocket } from 'lucide-react';

/* ──────────────────────────────────────────
   Decorative Sparkle SVG
   ────────────────────────────────────────── */
const Sparkle = ({ className, color, style }: { className?: string; color?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill={color || 'none'} stroke={color || 'currentColor'} strokeWidth="1.5" aria-hidden="true">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" strokeLinejoin="round" />
  </svg>
);

/* ──────────────────────────────────────────
   Example Pill Button
   ────────────────────────────────────────── */
const ExamplePill = ({ name, url, onClick }: { name: string; url: string; onClick: (url: string) => void }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(url); }}
    style={{
      padding: '6px 14px',
      borderRadius: '8px',
      border: '1.5px solid rgba(255, 255, 255, 0.4)',
      fontFamily: 'var(--font-heading)',
      fontWeight: 600,
      fontSize: '14px',
      color: 'var(--text-primary)',
      background: 'rgba(168, 85, 247, 0.4)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.6)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    }}
  >
    {name}
  </button>
);

/* ──────────────────────────────────────────
   Main App Component
   ────────────────────────────────────────── */
export default function App() {
  const {
    url,
    setUrl,
    fetchRepoInfo,
    repoInfo,
    isLoadingInfo,
    rootNodes,
    searchQuery,
    setSearchQuery,
    selectAll,
    clearSelection,
    expandAll,
    collapseAll,
    selectedPaths,
    nodesMap,
    error,
    setError,
    currentPath,
    navigateToPath,
    isDarkMode,
    toggleDarkMode,
  } = useStore();

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    if (trimmedUrl) {
      setError(null);

      const isGitHubUrl = trimmedUrl.includes('github.com');
      const isShorthand = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmedUrl);

      if (!isGitHubUrl && !isShorthand) {
        showToast({
          type: 'error',
          title: 'Invalid URL',
          message: 'Please enter a valid GitHub URL (e.g., https://github.com/owner/repo) or shorthand (owner/repo).',
        });
        setError('Please enter a valid GitHub URL (e.g., https://github.com/owner/repo) or shorthand (owner/repo).');
        return;
      }

      if (isGitHubUrl) {
        try {
          const urlObj = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.length < 2) {
            showToast({
              type: 'error',
              title: 'Incomplete URL',
              message: 'Please include both the repository owner and name (e.g., https://github.com/owner/repo).',
            });
            setError('Please include both the repository owner and name.');
            return;
          }
        } catch {
          // Let the server handle it
        }
      }

      setUrl(trimmedUrl);
      fetchRepoInfo(trimmedUrl);
    }
  };

  const handlePasteExample = (exampleUrl: string) => {
    setError(null);
    setInputUrl(exampleUrl);
    setUrl(exampleUrl);
    fetchRepoInfo(exampleUrl);
  };

  const handleClearInput = () => {
    setInputUrl('');
    // Focus the input
    const input = document.getElementById('url-input');
    if (input) input.focus();
  };

  const handleReset = () => {
    setUrl('');
    setInputUrl('');
    setError(null);
    fetchRepoInfo('');
  };

  const allSelected = rootNodes.length > 0 && rootNodes.every(path => selectedPaths.has(path));

  let selectedFiles = 0;
  let selectedFolders = 0;
  selectedPaths.forEach(path => {
    const node = nodesMap[path];
    if (node) {
      if (node.type === 'blob') selectedFiles++;
      else if (node.type === 'tree') selectedFolders++;
    }
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Toast notification container */}
      <ToastContainer />

      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          width: '100%',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
        aria-label="Main navigation"
      >
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '0px',
            color: 'var(--text-primary)',
            padding: 0,
          }}
        >
          <span>Grab</span>
          <span style={{ color: 'var(--accent-primary)' }}>GitHub</span>
        </button>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              padding: 0,
            }}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          <a
            href="https://github.com/aditya452007/GrabGithub"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Github size={18} />
            <span className="hidden sm:inline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              GitHub <span style={{ color: 'var(--warning)', fontSize: '12px' }}>★</span>
            </span>
          </a>
        </div>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '960px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 20px 100px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {/* ═══ HERO SECTION ═══ */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'all 0.5s ease',
          position: 'relative',
          marginBottom: repoInfo ? '32px' : 'auto',
          marginTop: repoInfo ? '0' : 'auto',
          paddingTop: repoInfo ? '0' : '40px',
          paddingBottom: repoInfo ? '0' : '40px',
        }}>
          {/* Floating sparkles — only on hero */}
          {!repoInfo && (
            <>
              <Sparkle
                color="#e94560"
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '0',
                  width: '56px',
                  height: '56px',
                  transform: 'rotate(-12deg)',
                  opacity: 0.7,
                  animation: 'float 5s ease-in-out infinite',
                }}
              />
              <Sparkle
                color="#a855f7"
                style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '80px',
                  width: '40px',
                  height: '40px',
                  transform: 'rotate(15deg)',
                  opacity: 0.5,
                  animation: 'float-reverse 6s ease-in-out infinite',
                }}
              />
              <Sparkle
                color="#60a5fa"
                style={{
                  position: 'absolute',
                  left: '60px',
                  bottom: '20px',
                  width: '36px',
                  height: '36px',
                  transform: 'rotate(-30deg)',
                  opacity: 0.4,
                  animation: 'float 8s ease-in-out infinite',
                  animationDelay: '2s',
                }}
              />
            </>
          )}

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 'clamp(48px, 8vw, 84px)',
            letterSpacing: '-2.5px',
            lineHeight: 1.05,
            marginBottom: '24px',
            color: 'var(--text-primary)',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Repository to{' '}
            <br className="hidden sm:block" />
            download
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-primary)',
            fontWeight: 500,
            marginBottom: '12px',
            maxWidth: '600px',
            opacity: 0.9,
          }}>
            Turn any GitHub repository into an interactive file explorer for downloading.<br />
            This is useful for quickly picking out the folders and files you need.
          </p>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            marginBottom: '40px',
            maxWidth: '600px',
          }}>
            You can also replace 'github' with 'grabgithub' in any Github URL
          </p>

          {/* ═══ INPUT CARD ═══ */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--neo-raised)',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            width: '100%',
            maxWidth: '700px',
            textAlign: 'left',
            position: 'relative',
            zIndex: 10,
          }}>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: error && !repoInfo ? '16px' : '20px',
                flexWrap: 'wrap',
              }}
            >
              {/* URL Input with neumorphic inset */}
              <div style={{
                flex: 1,
                minWidth: '200px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
                <input
                  id="url-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="GitHub repository URL or owner/repo"
                  autoComplete="off"
                  aria-label="GitHub repository URL"
                  style={{
                    width: '100%',
                    padding: '14px 40px 14px 40px',
                    borderRadius: '16px',
                    border: error && !repoInfo ? '1.5px solid var(--error)' : '1.5px solid transparent',
                    background: 'var(--bg-base)',
                    boxShadow: 'var(--neo-inset)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14.5px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                    e.currentTarget.style.boxShadow = 'var(--neo-inset), 0 0 12px var(--accent-secondary-glow)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = error && !repoInfo ? 'var(--error)' : 'transparent';
                    e.currentTarget.style.boxShadow = 'var(--neo-inset)';
                  }}
                />
                {/* Clear button */}
                {inputUrl && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    aria-label="Clear URL input"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Grab Button — Flat Neumorphic */}
              <button
                type="submit"
                disabled={isLoadingInfo || !inputUrl.trim()}
                style={{
                  padding: '14px 32px',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'white',
                  background: isLoadingInfo
                    ? 'var(--bg-base)'
                    : 'var(--accent-primary)',
                  backgroundSize: '200% 100%',
                  boxShadow: isLoadingInfo ? 'var(--neo-inset-sm)' : 'var(--neo-raised-sm)',
                  cursor: isLoadingInfo || !inputUrl.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minWidth: '120px',
                  opacity: !inputUrl.trim() ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoadingInfo && inputUrl.trim()) {
                    e.currentTarget.style.boxShadow = 'var(--neo-raised), 0 0 20px var(--accent-glow)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.backgroundPosition = '100% 0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoadingInfo) {
                    e.currentTarget.style.boxShadow = 'var(--neo-raised-sm)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundPosition = '0% 0';
                  }
                }}
                onMouseDown={(e) => {
                  if (!isLoadingInfo && inputUrl.trim()) {
                    e.currentTarget.style.boxShadow = 'var(--neo-inset-sm)';
                    e.currentTarget.style.transform = 'translateY(2px)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoadingInfo) {
                    e.currentTarget.style.boxShadow = 'var(--neo-raised), 0 0 20px var(--accent-glow)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
              >
                {isLoadingInfo ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2.5px solid var(--accent-secondary)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <>
                    <Rocket size={18} /> Grab
                  </>
                )}
              </button>
            </form>

            {/* Error display */}
            {error && !repoInfo && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '14px',
                boxShadow: 'var(--neo-flat)',
                marginBottom: '16px',
                animation: 'slide-up 0.3s ease',
              }}>
                <div style={{ color: 'var(--error)', marginTop: '2px', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--error)',
                    marginBottom: '2px',
                  }}>
                    Oops, something went wrong
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {error}
                  </div>
                  <button
                    onClick={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                    style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      background: 'rgba(233, 69, 96, 0.1)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(233, 69, 96, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(233, 69, 96, 0.1)'; }}
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                </div>
              </div>
            )}

            {/* Example pills */}
            {!repoInfo && (
              <>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  marginBottom: '12px',
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Wand2 size={16} /> Try these example repositories:
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <ExamplePill name="FastAPI" url="https://github.com/tiangolo/fastapi" onClick={handlePasteExample} />
                  <ExamplePill name="Streamlit" url="https://github.com/streamlit/streamlit" onClick={handlePasteExample} />
                  <ExamplePill name="Zustand" url="https://github.com/pmndrs/zustand" onClick={handlePasteExample} />
                  <ExamplePill name="Express" url="https://github.com/expressjs/express" onClick={handlePasteExample} />
                </div>
              </>
            )}
          </div>
        </header>

        {/* ═══ REPO BROWSER ═══ */}
        {repoInfo && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'slide-up 0.5s ease' }}>
            {/* Repo info bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '12px',
            }}>
              {/* Repo badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--neo-flat)',
                fontFamily: 'var(--font-body)',
              }}>
                <Github size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                  {repoInfo.owner}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                  {repoInfo.repo}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-base)',
                  boxShadow: 'var(--neo-inset-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-secondary)',
                  fontFamily: 'monospace',
                  marginLeft: '4px',
                }}>
                  {repoInfo.branch}
                </span>
              </div>

              {/* Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '14px',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--neo-flat)',
              }}>
                {/* Search filter */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{
                    position: 'absolute',
                    left: '10px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter files…"
                    aria-label="Filter files"
                    style={{
                      background: 'var(--bg-base)',
                      boxShadow: 'var(--neo-inset-sm)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '7px 30px 7px 30px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '140px',
                      transition: 'width 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.width = '200px';
                      e.currentTarget.style.boxShadow = 'var(--neo-inset-sm), 0 0 8px var(--accent-secondary-glow)';
                    }}
                    onBlur={(e) => {
                      if (!searchQuery) e.currentTarget.style.width = '140px';
                      e.currentTarget.style.boxShadow = 'var(--neo-inset-sm)';
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                      }}
                      aria-label="Clear filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: 'rgba(15, 23, 42, 0.06)' }} />

                {/* Select all/none */}
                <button
                  onClick={allSelected ? clearSelection : selectAll}
                  title={allSelected ? 'Clear selection' : 'Select all'}
                  aria-label={allSelected ? 'Clear selection' : 'Select all'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: allSelected ? 'var(--accent-secondary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    transition: 'color 0.2s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = allSelected ? 'var(--accent-secondary)' : 'var(--text-muted)'; }}
                >
                  {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  <span className="hidden sm:inline">{allSelected ? 'None' : 'All'}</span>
                </button>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: 'rgba(15, 23, 42, 0.06)' }} />

                {/* Expand/Collapse */}
                <button
                  onClick={expandAll}
                  title="Expand all folders"
                  aria-label="Expand all folders"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={collapseAll}
                  title="Collapse all folders"
                  aria-label="Collapse all folders"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            </div>

            {/* Breadcrumb */}
            {currentPath && (
              <Breadcrumb
                repoName={repoInfo.repo}
                currentPath={currentPath}
                onNavigate={navigateToPath}
              />
            )}

            {/* Selection summary */}
            {selectedPaths.size > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
                boxShadow: 'var(--neo-flat)',
                marginBottom: '12px',
                animation: 'fade-in 0.3s ease',
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--accent-secondary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {[
                    selectedFolders > 0 ? `${selectedFolders} folder${selectedFolders === 1 ? '' : 's'}` : null,
                    selectedFiles > 0 ? `${selectedFiles} file${selectedFiles === 1 ? '' : 's'}` : null,
                  ].filter(Boolean).join(', ')}{' '}
                  selected
                </span>
                <button
                  onClick={clearSelection}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'white',
                    background: 'var(--accent-secondary)',
                    boxShadow: 'var(--neo-flat)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--neo-raised-sm)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--neo-flat)';
                  }}
                >
                  <X size={12} strokeWidth={3} />
                  Clear all
                </button>
              </div>
            )}

            {/* Tree Browser */}
            <TreeBrowser />
          </div>
        )}

        <DownloadPanel />
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        width: '100%',
        padding: '16px 24px',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 40,
        textAlign: 'center',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--glass-border)',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        Made by <a href="https://github.com/aditya452007" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Aaditya Thakur</a>
      </footer>

      {/* Spin keyframe for inline use */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .hidden { display: none; }
        }
        @media (min-width: 641px) {
          .hidden.sm\\:inline { display: inline; }
          .hidden.sm\\:block { display: block; }
        }
      `}</style>
    </div>
  );
}
