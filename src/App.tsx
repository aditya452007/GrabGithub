import React, { useState } from 'react';
import { useStore } from './store';
import { TreeBrowser } from './components/TreeBrowser';
import { DownloadPanel } from './components/DownloadPanel';
import { Github, Search, X, CheckSquare, Square, Star } from 'lucide-react';
import { cn } from './lib/utils';

const Sparkle = ({ className, color }: { className?: string, color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={color || "none"} stroke={color || "currentColor"} strokeWidth="1.5">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" strokeLinejoin="round" />
  </svg>
);

const ExamplePill = ({ name, url, onClick }: { name: string, url: string, onClick: (url: string) => void }) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(url); }}
    className="px-4 py-1.5 rounded-md border-2 border-[#C48BFF] text-[#C48BFF] font-medium text-sm hover:bg-[#C48BFF] hover:text-[#2B253C] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none"
  >
    {name}
  </button>
);

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
    setError
  } = useStore();

  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    if (trimmedUrl) {
      // Basic client-side validation
      const isGitHubUrl = trimmedUrl.includes('github.com');
      const isShorthand = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmedUrl);
      
      if (!isGitHubUrl && !isShorthand) {
        setError("Please enter a valid GitHub URL (e.g., https://github.com/owner/repo) or shorthand (owner/repo).");
        return;
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
    <div className="min-h-screen bg-[#2B253C] text-zinc-50 font-sans selection:bg-[#C48BFF]/30 flex flex-col">
      
      {/* Navbar */}
      <nav className="w-full border-b border-black/20 bg-[#2B253C] py-4 px-6 flex justify-between items-center z-20 sticky top-0 shadow-sm">
        <div className="font-bold text-xl tracking-tight flex items-center cursor-pointer" onClick={() => { setUrl(''); fetchRepoInfo(''); setInputUrl(''); }}>
          <span className="text-white">Grab</span><span className="text-[#C48BFF]">GitHub</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-white/80 items-center">
          <a href="#" className="hover:text-white transition-colors hidden sm:block">Browse</a>
          <a href="#" className="hover:text-white transition-colors hidden sm:block">About</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2 transition-colors">
            <Github size={18} /> <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:py-20 flex flex-col flex-1 w-full">
        
        {/* Header / Hero */}
        <div className={cn(
          "flex flex-col items-center text-center transition-all duration-500 relative",
          repoInfo ? "mb-8" : "my-auto"
        )}>
          
          {/* Decorative Sparkles */}
          {!repoInfo && (
            <>
              <Sparkle className="absolute -left-4 sm:-left-12 top-0 text-[#C48BFF] w-12 h-12 sm:w-16 sm:h-16 -rotate-12" color="#C48BFF" />
              <Sparkle className="absolute -right-2 sm:-right-8 top-16 text-blue-400 w-8 h-8 sm:w-12 sm:h-12 rotate-12" color="#60A5FA" />
              <Sparkle className="absolute left-10 bottom-0 text-blue-400 w-10 h-10 -rotate-45" color="#60A5FA" />
            </>
          )}

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md">
            Repository to <br className="hidden sm:block" /> download
          </h1>
          <p className="text-lg text-white/90 mb-2 font-medium">
            Turn any GitHub repository into a selectable file explorer.
          </p>
          <p className="text-lg text-white/80 mb-12">
            This is useful for quickly grabbing specific files or folders.
          </p>

          {/* Input Card */}
          <div className="bg-[#423657] rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border border-black/30 w-full max-w-3xl text-left relative z-10">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="GitHub repository URL or username/repo"
                className={cn(
                  "flex-1 bg-[#2B253C] border rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none shadow-inner transition-colors",
                  error && !repoInfo ? "border-red-400 focus:border-red-400" : "border-black/40 focus:border-[#C48BFF]"
                )}
              />
              <button 
                type="submit"
                disabled={isLoadingInfo || !inputUrl.trim()}
                className="bg-[#C48BFF] text-[#2B253C] font-bold px-8 py-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
              >
                {isLoadingInfo ? (
                  <div className="w-5 h-5 border-2 border-[#2B253C] border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Grab"
                )}
              </button>
            </form>

            {error && !repoInfo && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2">
                <div className="mt-0.5 text-red-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-400 font-bold text-sm mb-1">Oops, something went wrong</h3>
                  <p className="text-red-300/90 text-sm">{error}</p>
                </div>
              </div>
            )}

            {!repoInfo && (
              <>
                <div className="text-white/80 text-sm mb-4 font-medium">Try these example repositories:</div>
                <div className="flex gap-3 flex-wrap">
                  <ExamplePill name="FastAPI" url="https://github.com/tiangolo/fastapi" onClick={handlePasteExample} />
                  <ExamplePill name="Streamlit" url="https://github.com/streamlit/streamlit" onClick={handlePasteExample} />
                  <ExamplePill name="Zustand" url="https://github.com/pmndrs/zustand" onClick={handlePasteExample} />
                  <ExamplePill name="Express" url="https://github.com/expressjs/express" onClick={handlePasteExample} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        {repoInfo && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
            
            {/* Repo Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
              <div className="flex items-center gap-2 text-zinc-300 bg-[#423657] px-4 py-2 rounded-lg border border-black/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Github size={18} className="text-[#C48BFF]" />
                <span className="font-bold text-white">{repoInfo.owner}</span>
                <span className="text-zinc-500">/</span>
                <span className="font-bold text-white">{repoInfo.repo}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#2B253C] text-xs text-[#C48BFF] border border-black/20 ml-2 font-mono">
                  {repoInfo.branch}
                </span>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 bg-[#423657] p-2 rounded-lg border border-black/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter files..."
                    className="bg-[#2B253C] border border-black/20 rounded-md pl-9 pr-8 py-1.5 text-sm outline-none focus:border-[#C48BFF] transition-colors w-40 sm:w-56 text-white placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="h-6 w-px bg-black/20" />

                <button 
                  onClick={allSelected ? clearSelection : selectAll}
                  className="text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium px-2"
                  title={allSelected ? "Clear selection" : "Select all"}
                >
                  {allSelected ? <CheckSquare size={16} className="text-[#C48BFF]" /> : <Square size={16} />}
                  <span className="hidden sm:inline">{allSelected ? 'None' : 'All'}</span>
                </button>

                <div className="h-6 w-px bg-black/20" />

                <button onClick={expandAll} className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-1">Expand</button>
                <button onClick={collapseAll} className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-1">Collapse</button>
              </div>
            </div>

            {/* Selection Summary */}
            {selectedPaths.size > 0 && (
              <div className="flex items-center justify-between bg-[#C48BFF]/10 border border-[#C48BFF]/30 rounded-lg px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                <span className="text-sm text-[#D4A8FF] font-bold">
                  {[
                    selectedFolders > 0 ? `${selectedFolders} folder${selectedFolders === 1 ? '' : 's'}` : null,
                    selectedFiles > 0 ? `${selectedFiles} file${selectedFiles === 1 ? '' : 's'}` : null
                  ].filter(Boolean).join(', ')} selected
                </span>
                <button 
                  onClick={clearSelection}
                  className="text-xs text-[#2B253C] font-bold transition-colors flex items-center gap-1 bg-[#C48BFF] hover:bg-[#D4A8FF] px-3 py-1.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <X size={14} strokeWidth={3} />
                  Clear all
                </button>
              </div>
            )}

            {/* Tree Browser */}
            <TreeBrowser />
          </div>
        )}

        <DownloadPanel />
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm text-white/50 font-medium flex flex-col items-center gap-2">
        <span>Made by developer, made for developer.</span>
        <span>
          Created by <a href="https://github.com/aditya452007" target="_blank" rel="noreferrer" className="text-[#C48BFF] hover:text-white transition-colors underline decoration-[#C48BFF]/50 underline-offset-4">Aaditya Thakur</a>
        </span>
      </footer>
    </div>
  );
}
