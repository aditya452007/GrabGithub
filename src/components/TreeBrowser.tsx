import React, { useMemo, useCallback } from 'react';
import { useStore, TreeNode } from '../store';
import { ChevronRight, FolderOpen, Folder, FileText, FileCode, FileJson, Image, FileArchive, File, Settings, Terminal, BookOpen } from 'lucide-react';
import { SkeletonTree } from './SkeletonTree';

// File extension to icon mapping
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconProps = { size: 16, style: { flexShrink: 0 } };
  
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'swift', 'kt', 'scala', 'vue', 'svelte'];
  const configExts = ['yml', 'yaml', 'toml', 'ini', 'cfg', 'conf'];
  const docExts = ['md', 'mdx', 'txt', 'rst', 'doc', 'docx', 'pdf'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'];
  const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'];
  
  if (ext === 'json' || ext === 'jsonc') return <FileJson {...iconProps} style={{ ...iconProps.style, color: '#fbbf24' }} />;
  if (codeExts.includes(ext)) return <FileCode {...iconProps} style={{ ...iconProps.style, color: '#60a5fa' }} />;
  if (configExts.includes(ext)) return <Settings {...iconProps} style={{ ...iconProps.style, color: '#a78bfa' }} />;
  if (docExts.includes(ext)) return <BookOpen {...iconProps} style={{ ...iconProps.style, color: '#34d399' }} />;
  if (imageExts.includes(ext)) return <Image {...iconProps} style={{ ...iconProps.style, color: '#f472b6' }} />;
  if (archiveExts.includes(ext)) return <FileArchive {...iconProps} style={{ ...iconProps.style, color: '#fb923c' }} />;
  if (ext === 'sh' || ext === 'bash' || ext === 'zsh' || ext === 'fish') return <Terminal {...iconProps} style={{ ...iconProps.style, color: '#4ade80' }} />;
  if (name === 'Dockerfile' || name === 'Makefile' || name === 'Procfile') return <Terminal {...iconProps} style={{ ...iconProps.style, color: '#38bdf8' }} />;
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') return <FileCode {...iconProps} style={{ ...iconProps.style, color: '#c084fc' }} />;
  if (ext === 'html' || ext === 'htm') return <FileCode {...iconProps} style={{ ...iconProps.style, color: '#f87171' }} />;
  if (name === 'LICENSE' || name === 'CHANGELOG' || name === 'README') return <BookOpen {...iconProps} style={{ ...iconProps.style, color: '#34d399' }} />;
  
  return <FileText {...iconProps} style={{ ...iconProps.style, color: 'var(--text-muted)' }} />;
}

const TreeNodeItem: React.FC<{ node: TreeNode; index: number }> = ({ node, index }) => {
  const { 
    nodesMap, 
    expandedPaths, 
    selectedPaths, 
    partiallySelectedPaths,
    toggleExpand,
    toggleSelection,
    searchQuery
  } = useStore();

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPaths.has(node.path);
  const isPartiallySelected = partiallySelectedPaths.has(node.path);
  
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(query)) return true;
    
    if (node.type === 'tree') {
      const checkDescendants = (n: TreeNode): boolean => {
        for (const childPath of n.children) {
          const childNode = nodesMap[childPath];
          if (!childNode) continue;
          if (childNode.name.toLowerCase().includes(query)) return true;
          if (childNode.type === 'tree' && checkDescendants(childNode)) return true;
        }
        return false;
      };
      return checkDescendants(node);
    }
    return false;
  }, [node, searchQuery, nodesMap]);

  const shouldExpand = isExpanded || (searchQuery && node.type === 'tree');
  const safeId = `node-${btoa(encodeURIComponent(node.path)).replace(/=/g, '')}`;

  const handleRowClick = useCallback(() => {
    if (node.type === 'tree') {
      toggleExpand(node.path);
    } else {
      toggleSelection(node.path);
    }
  }, [node.path, node.type, toggleExpand, toggleSelection]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(node.path);
  }, [node.path, toggleSelection]);

  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'tree') toggleExpand(node.path);
  }, [node.path, node.type, toggleExpand]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.key === 'Enter' && node.type === 'tree') {
        toggleExpand(node.path);
      } else {
        toggleSelection(node.path);
      }
    }
  }, [node.path, node.type, toggleExpand, toggleSelection]);

  if (!matchesSearch) return null;

  return (
    <div id={safeId} data-path={node.path} role="treeitem" aria-expanded={node.type === 'tree' ? shouldExpand : undefined}>
      <div 
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `8px 12px 8px ${node.depth * 20 + 12}px`,
          cursor: 'pointer',
          borderRadius: '12px',
          margin: '2px 0',
          transition: 'all 0.2s ease',
          background: isSelected 
            ? 'rgba(168, 85, 247, 0.1)' 
            : index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.015)',
          borderLeft: isSelected ? '3px solid var(--accent-secondary)' : '3px solid transparent',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isSelected 
            ? 'rgba(168, 85, 247, 0.15)' 
            : 'rgba(15, 23, 42, 0.04)';
          e.currentTarget.style.transform = 'translateX(2px)';
          e.currentTarget.style.boxShadow = 'var(--neo-flat)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isSelected 
            ? 'rgba(168, 85, 247, 0.1)' 
            : index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.015)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-secondary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Expand/Collapse chevron */}
        <div 
          onClick={handleChevronClick}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--text-muted)',
            visibility: node.type === 'blob' ? 'hidden' : 'visible',
            transition: 'transform 0.2s ease',
            transform: shouldExpand ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronRight size={14} />
        </div>

        {/* Custom neumorphic checkbox */}
        <div 
          onClick={handleCheckboxClick}
          style={{
            margin: '0 8px',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            background: isSelected 
              ? 'var(--accent-secondary)' 
              : isPartiallySelected 
                ? 'rgba(168, 85, 247, 0.4)' 
                : 'var(--bg-base)',
            boxShadow: isSelected || isPartiallySelected 
              ? '0 0 8px rgba(168, 85, 247, 0.3)' 
              : 'var(--neo-inset-sm)',
          }}>
            {isSelected && (
              <svg 
                width="12" height="12" viewBox="0 0 24 24" fill="none" 
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'check-pop 0.3s var(--ease-bounce)' }}
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
            {!isSelected && isPartiallySelected && (
              <div style={{
                width: '10px',
                height: '2px',
                background: 'white',
                borderRadius: '2px',
              }} />
            )}
          </div>
        </div>

        {/* File/Folder icon */}
        <div style={{ marginRight: '8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {node.type === 'tree' ? (
            shouldExpand 
              ? <FolderOpen size={16} style={{ color: '#60a5fa' }} /> 
              : <Folder size={16} style={{ color: '#60a5fa' }} />
          ) : (
            getFileIcon(node.name)
          )}
        </div>

        {/* File name */}
        <span style={{
          fontSize: '13.5px',
          fontFamily: 'var(--font-body)',
          fontWeight: isSelected ? 700 : 500,
          color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s ease',
        }}>
          {node.name}
        </span>

        {/* File size */}
        {node.type === 'blob' && node.size !== undefined && (
          <span style={{
            marginLeft: 'auto',
            paddingLeft: '12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            flexShrink: 0,
          }}>
            {formatSize(node.size)}
          </span>
        )}
      </div>

      {/* Children with smooth expand */}
      {node.type === 'tree' && shouldExpand && (
        <div style={{
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease',
        }}>
          {node.children.map((childPath, childIndex) => (
            <TreeNodeItem key={childPath} node={nodesMap[childPath]} index={childIndex} />
          ))}
        </div>
      )}
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const TreeBrowser: React.FC = () => {
  const { rootNodes, nodesMap, isLoadingTree, error, repoInfo, isTruncated } = useStore();

  React.useEffect(() => {
    if (!isLoadingTree && repoInfo?.path) {
      setTimeout(() => {
        const safeId = `node-${btoa(encodeURIComponent(repoInfo.path)).replace(/=/g, '')}`;
        const element = document.getElementById(safeId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [isLoadingTree, repoInfo?.path]);

  if (isLoadingTree) {
    return <SkeletonTree />;
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        boxShadow: 'var(--neo-raised)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--error)',
          marginBottom: '8px',
        }}>
          Failed to load repository
        </p>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
        }}>
          {error}
        </p>
      </div>
    );
  }

  if (rootNodes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        boxShadow: 'var(--neo-raised)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          color: 'var(--text-secondary)',
        }}>
          No files found in this repository.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Truncation Warning Banner */}
      {isTruncated && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '14px',
          boxShadow: 'var(--neo-flat)',
          fontFamily: 'var(--font-body)',
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b' }}>
              Large Repository
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
              — This repository exceeds 100,000 entries. Some files may not be shown.
            </span>
          </div>
        </div>
      )}

      {/* Tree container */}
      <div
        role="tree"
        aria-label="Repository file tree"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          boxShadow: 'var(--neo-raised)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '600px',
        }}
      >
        <div className="custom-scrollbar" style={{
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '8px',
          flex: 1,
        }}>
          {rootNodes.map((path, index) => (
            <TreeNodeItem key={path} node={nodesMap[path]} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
