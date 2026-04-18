import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// ── WebMCP — Expose GrabGitHub tools to AI agents in the browser ──────────────
// https://webmachinelearning.github.io/webmcp/
// https://developer.chrome.com/blog/webmcp-epp
if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
  (navigator as any).modelContext.provideContext({
    name: 'GrabGitHub',
    description: 'Browse and download files from any public GitHub repository without cloning.',
    tools: [
      {
        name: 'search_repo',
        description: 'Fetch the file tree of a GitHub repository. Returns all files and folders recursively.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'GitHub repository URL or owner/repo shorthand (e.g. "vercel/next.js").',
            },
          },
          required: ['url'],
        },
        execute: async ({ url }: { url: string }) => {
          // Step 1: resolve URL → repo metadata
          const infoRes = await fetch(`/api/repo-info?url=${encodeURIComponent(url)}`);
          if (!infoRes.ok) throw new Error(await infoRes.text());
          const { owner, repo, branch } = await infoRes.json();

          // Step 2: fetch file tree
          const treeRes = await fetch(
            `/api/tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`
          );
          if (!treeRes.ok) throw new Error(await treeRes.text());
          return treeRes.json();
        },
      },
      {
        name: 'download_files',
        description: 'Download a list of file paths from a GitHub repository as a ZIP archive. Returns a Blob.',
        inputSchema: {
          type: 'object',
          properties: {
            owner:  { type: 'string', description: 'GitHub username or org.' },
            repo:   { type: 'string', description: 'Repository name.' },
            branch: { type: 'string', description: 'Branch name.' },
            paths: {
              type: 'array',
              items: { type: 'string' },
              description: 'File paths relative to the repo root to include in the ZIP.',
            },
          },
          required: ['owner', 'repo', 'branch', 'paths'],
        },
        execute: async ({
          owner,
          repo,
          branch,
          paths,
        }: {
          owner: string;
          repo: string;
          branch: string;
          paths: string[];
        }) => {
          const res = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner, repo, branch, paths }),
          });
          if (!res.ok) throw new Error(await res.text());
          return res.blob();
        },
      },
    ],
  });
}

