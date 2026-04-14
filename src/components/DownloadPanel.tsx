import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Download, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { showToast } from './Toast';

export const DownloadPanel: React.FC = () => {
  const { selectedPaths, nodesMap, repoInfo } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  // Calculate files to download and total size estimate
  const { filesToDownload, totalSize } = useMemo(() => {
    const files = new Set<string>();
    let size = 0;
    
    const addDescendantFiles = (path: string) => {
      const node = nodesMap[path];
      if (!node) return;
      if (node.type === 'blob') {
        files.add(path);
        if (node.size) size += node.size;
      } else {
        node.children.forEach(addDescendantFiles);
      }
    };

    selectedPaths.forEach(path => addDescendantFiles(path));
    return { filesToDownload: Array.from(files), totalSize: size };
  }, [selectedPaths, nodesMap]);

  const fileCount = filesToDownload.length;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDownload = async () => {
    if (fileCount === 0 || !repoInfo) return;

    // Warn if download is very large
    if (totalSize > 100 * 1024 * 1024) { // > 100MB
      showToast({
        type: 'warning',
        title: 'Large download',
        message: `This download is approximately ${formatSize(totalSize)}. It may take a while.`,
        duration: 5000,
      });
    }
    
    setIsDownloading(true);
    setDownloadStatus('downloading');
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          branch: repoInfo.branch,
          paths: filesToDownload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoInfo.repo}-grab.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus('success');
      showToast({
        type: 'success',
        title: 'Download complete!',
        message: `${fileCount} file${fileCount === 1 ? '' : 's'} downloaded as ${repoInfo.repo}-grab.zip`,
      });
      setTimeout(() => setDownloadStatus('idle'), 2500);
    } catch (err: any) {
      setDownloadStatus('error');
      showToast({
        type: 'error',
        title: 'Download failed',
        message: err.message || 'An error occurred during download. Please try again.',
        duration: 6000,
      });
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  if (fileCount === 0) return null;

  const sizeStr = totalSize > 0 ? ` (~${formatSize(totalSize)})` : '';

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '460px',
      padding: '0 16px',
      zIndex: 50,
      animation: 'slide-up 0.4s var(--ease-bounce)',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        padding: '16px 20px',
        boxShadow: 'var(--neo-raised), 0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '15px',
            color: 'var(--text-primary)',
          }}>
            {fileCount} {fileCount === 1 ? 'file' : 'files'} selected
          </span>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            Ready to download as ZIP{sizeStr}
          </span>
        </div>
        
        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            flexShrink: 0,
            ...(downloadStatus === 'idle' ? {
              background: 'var(--accent-primary)',
              color: 'white',
              boxShadow: 'var(--neo-raised-sm)',
            } : downloadStatus === 'downloading' ? {
              background: 'var(--bg-base)',
              color: 'var(--accent-secondary)',
              boxShadow: 'var(--neo-inset-sm)',
            } : downloadStatus === 'success' ? {
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              boxShadow: 'none',
            } : {
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              boxShadow: 'none',
            }),
          }}
          onMouseEnter={(e) => {
            if (downloadStatus === 'idle') {
              e.currentTarget.style.boxShadow = 'var(--neo-raised), 0 0 16px var(--accent-glow)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (downloadStatus === 'idle') {
              e.currentTarget.style.boxShadow = 'var(--neo-raised-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
          onMouseDown={(e) => {
            if (downloadStatus === 'idle') {
              e.currentTarget.style.boxShadow = 'var(--neo-inset-sm)';
              e.currentTarget.style.transform = 'translateY(1px)';
            }
          }}
          onMouseUp={(e) => {
            if (downloadStatus === 'idle') {
              e.currentTarget.style.boxShadow = 'var(--neo-raised-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {downloadStatus === 'idle' && (
            <>
              <Download size={18} strokeWidth={2.5} />
              <span>Download</span>
            </>
          )}
          {downloadStatus === 'downloading' && (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Zipping…</span>
            </>
          )}
          {downloadStatus === 'success' && (
            <>
              <CheckCircle size={18} />
              <span>Done ✓</span>
            </>
          )}
          {downloadStatus === 'error' && (
            <>
              <XCircle size={18} />
              <span>Failed</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
