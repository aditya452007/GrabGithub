import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const DownloadPanel: React.FC = () => {
  const { selectedPaths, nodesMap, repoInfo } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate only the files that need to be downloaded
  // If a folder is selected, we need to include all its descendant files
  const getFilesToDownload = () => {
    const files = new Set<string>();
    
    const addDescendantFiles = (path: string) => {
      const node = nodesMap[path];
      if (!node) return;
      if (node.type === 'blob') {
        files.add(path);
      } else {
        node.children.forEach(addDescendantFiles);
      }
    };

    selectedPaths.forEach(path => addDescendantFiles(path));
    return Array.from(files);
  };

  const filesToDownload = getFilesToDownload();
  const fileCount = filesToDownload.length;

  const handleDownload = async () => {
    if (fileCount === 0 || !repoInfo) return;
    
    setIsDownloading(true);
    setDownloadStatus('downloading');
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Handle streaming response as a blob download
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
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadStatus('error');
      setErrorMessage(err.message || 'An error occurred during download');
      setTimeout(() => setDownloadStatus('idle'), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  if (fileCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
      <div className="bg-[#423657] border border-black/30 rounded-2xl p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-white font-bold">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} selected
          </span>
          <span className="text-xs text-zinc-300 font-medium">
            Ready to download as ZIP
          </span>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
            downloadStatus === 'idle' ? "bg-[#C48BFF] hover:bg-[#D4A8FF] text-[#2B253C]" :
            downloadStatus === 'downloading' ? "bg-[#2B253C] text-[#C48BFF] cursor-not-allowed shadow-none translate-y-[2px]" :
            downloadStatus === 'success' ? "bg-[#C48BFF]/20 text-[#D4A8FF] shadow-none translate-y-[2px]" :
            "bg-red-500/20 text-red-400 shadow-none translate-y-[2px]"
          )}
        >
          {downloadStatus === 'idle' && (
            <>
              <Download size={18} strokeWidth={3} />
              <span>Download</span>
            </>
          )}
          {downloadStatus === 'downloading' && (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Zipping...</span>
            </>
          )}
          {downloadStatus === 'success' && (
            <>
              <CheckCircle size={18} />
              <span>Done!</span>
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
      {downloadStatus === 'error' && (
        <div className="mt-2 text-center text-xs text-red-400 bg-[#2B253C] rounded-lg py-1 px-3 border border-red-500/20 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
