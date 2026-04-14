import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import archiver from 'archiver';

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple in-memory cache for trees
const treeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // Increased to 15 minutes
const MAX_CACHE_SIZE = 50; // Limit memory usage

// Helper to build GitHub API headers
function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Grab-GitHub-App',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// Helper to fetch JSON from GitHub API
async function fetchGitHubAPI(endpoint: string) {
  const headers = getGitHubHeaders();

  const response = await fetch(`https://api.github.com${endpoint}`, { headers });
  
  if (!response.ok) {
    // Check for rate limiting specifically
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (response.status === 403 && rateLimitRemaining === '0') {
      const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null;
      const resetIn = resetDate ? Math.ceil((resetDate.getTime() - Date.now()) / 60000) : '?';
      const tokenHint = process.env.GITHUB_TOKEN 
        ? 'Your token\'s rate limit has been exceeded.' 
        : 'Add a GITHUB_TOKEN to increase your limit from 60 to 5,000 requests/hour.';
      throw new Error(`GitHub API rate limit exceeded. Resets in ~${resetIn} minutes. ${tokenHint}`);
    }
    
    const errorText = await response.text();
    let errorMessage = `GitHub API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${errorText}`;
    }
    
    if (response.status === 404) {
      throw new Error('Repository not found. It may be private or the URL may be misspelled.');
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// Parse GitHub URL
app.get('/api/repo-info', async (req, res) => {
  try {
    const urlParam = req.query.url as string;
    if (!urlParam) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let urlStr = urlParam.trim();
    
    // Handle shorthand owner/repo
    if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(urlStr)) {
      urlStr = `https://github.com/${urlStr}`;
    }

    if (!urlStr.startsWith('http')) {
      urlStr = `https://${urlStr}`;
    }

    const url = new URL(urlStr);
    if (url.hostname !== 'github.com') {
      return res.status(400).json({ error: 'Not a valid GitHub URL' });
    }

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      return res.status(400).json({ error: 'Invalid repository URL' });
    }

    const owner = parts[0];
    let repo = parts[1];
    
    // Strip .git suffix if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }
    
    let branch = '';
    let subpath = '';

    if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
      // The remaining parts after 'tree'/'blob' could be branch/path.
      // Branch names can contain slashes (e.g. 'feature/my-branch'),
      // so we need to resolve which segments are branch vs path.
      const remainingParts = parts.slice(3).map(decodeURIComponent);
      
      // Strategy: try progressively longer branch name candidates
      // until the GitHub API confirms one exists.
      let resolved = false;
      for (let i = remainingParts.length; i >= 1; i--) {
        const candidateBranch = remainingParts.slice(0, i).join('/');
        const candidatePath = remainingParts.slice(i).join('/');
        try {
          // Verify the branch exists by fetching its ref
          await fetchGitHubAPI(`/repos/${owner}/${repo}/branches/${encodeURIComponent(candidateBranch)}`);
          branch = candidateBranch;
          subpath = candidatePath;
          resolved = true;
          break;
        } catch {
          // Branch doesn't exist, try a shorter name
          continue;
        }
      }
      
      if (!resolved) {
        // Fallback: assume the first segment is the branch
        branch = remainingParts[0];
        subpath = remainingParts.slice(1).join('/');
      }
    } else {
      // Fetch default branch
      const repoData = await fetchGitHubAPI(`/repos/${owner}/${repo}`);
      branch = repoData.default_branch;
    }

    res.json({ owner, repo, branch, path: subpath });
  } catch (error: any) {
    console.error('Error parsing repo info:', error);
    let errorMessage = error.message || 'Failed to parse repository info';
    if (errorMessage === 'Not Found') {
      errorMessage = 'Repository not found. It may be private or misspelled.';
    }
    res.status(404).json({ error: errorMessage });
  }
});

// Fetch Repository Tree
app.get('/api/tree', async (req, res) => {
  try {
    const { owner, repo, branch } = req.query;
    if (!owner || !repo || !branch) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const cacheKey = `${owner}/${repo}/${branch}`;
    const cached = treeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const treeData = await fetchGitHubAPI(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    
    // Filter out trees (folders) that we don't strictly need if we just want files, 
    // but we want to show folders in the UI, so we keep everything.
    // The GitHub API returns { path, mode, type, sha, size, url }
    
    if (treeCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [key, value] of treeCache.entries()) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        treeCache.delete(oldestKey);
      }
    }

    treeCache.set(cacheKey, { data: treeData, timestamp: Date.now() });
    res.json(treeData);
  } catch (error: any) {
    console.error('Error fetching tree:', error);
    let errorMessage = error.message || 'Failed to fetch repository tree';
    if (errorMessage === 'Not Found') {
      errorMessage = 'Repository tree not found. The branch or path might be incorrect.';
    }
    res.status(404).json({ error: errorMessage });
  }
});

// Download ZIP
app.post('/api/download', async (req, res) => {
  try {
    const { owner, repo, branch, paths } = req.body;
    
    if (!owner || !repo || !branch || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${repo}-download.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 5 } // Moderate compression
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);

    // Concurrency control for fetching files
    const CONCURRENCY = 5;
    let activeRequests = 0;
    let currentIndex = 0;

    const processNext = async (): Promise<void> => {
      if (currentIndex >= paths.length) return;
      
      const path = paths[currentIndex++];
      activeRequests++;

      try {
        const encodedPath = path.split('/').map((p: string) => encodeURIComponent(p)).join('/');
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
        const response = await fetch(rawUrl);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          archive.append(buffer, { name: path });
        } else {
          console.warn(`Failed to fetch ${path}: ${response.statusText}`);
          // Add a text file indicating the error to the zip
          archive.append(`Failed to download: ${response.statusText}`, { name: `${path}.error.txt` });
        }
      } catch (err) {
        console.error(`Error fetching ${path}:`, err);
        archive.append(`Error: ${err}`, { name: `${path}.error.txt` });
      } finally {
        activeRequests--;
        if (currentIndex < paths.length) {
          await processNext();
        } else if (activeRequests === 0) {
          archive.finalize();
        }
      }
    };

    // Start initial batch
    const initialBatch = Math.min(CONCURRENCY, paths.length);
    for (let i = 0; i < initialBatch; i++) {
      processNext();
    }
    
    if (paths.length === 0) {
      archive.finalize();
    }

  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate download' });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
