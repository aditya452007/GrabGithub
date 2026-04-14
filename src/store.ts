import { create } from 'zustand';

export interface TreeNode {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  size?: number;
  parentPath: string | null;
  depth: number;
  children: string[]; // paths of children
}

interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

interface AppState {
  url: string;
  repoInfo: RepoInfo | null;
  tree: TreeNode[];
  nodesMap: Record<string, TreeNode>;
  rootNodes: string[]; // paths of root nodes
  
  selectedPaths: Set<string>;
  partiallySelectedPaths: Set<string>;
  expandedPaths: Set<string>;
  
  searchQuery: string;
  currentPath: string; // For breadcrumb navigation
  isTruncated: boolean; // True if GitHub tree was truncated
  
  isLoadingInfo: boolean;
  isLoadingTree: boolean;
  error: string | null;
  
  setUrl: (url: string) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;
  fetchRepoInfo: (url: string) => Promise<void>;
  fetchTree: (info: RepoInfo) => Promise<void>;
  navigateToPath: (path: string) => void;
  
  toggleSelection: (path: string) => void;
  toggleExpand: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  url: '',
  repoInfo: null,
  tree: [],
  nodesMap: {},
  rootNodes: [],
  
  selectedPaths: new Set(),
  partiallySelectedPaths: new Set(),
  expandedPaths: new Set(),
  
  searchQuery: '',
  currentPath: '',
  isTruncated: false,
  
  isDarkMode: typeof window !== 'undefined' 
    ? localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : false,

  isLoadingInfo: false,
  isLoadingTree: false,
  error: null,
  
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
    }
    return { isDarkMode: newMode };
  }),

  setUrl: (url) => set({ url }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setError: (error) => set({ error }),
  
  fetchRepoInfo: async (url) => {
    set({ isLoadingInfo: true, error: null, repoInfo: null, tree: [], nodesMap: {}, rootNodes: [], selectedPaths: new Set(), partiallySelectedPaths: new Set(), expandedPaths: new Set(), currentPath: '', isTruncated: false });
    
    if (!url || !url.trim()) {
      set({ isLoadingInfo: false });
      return;
    }

    try {
      const res = await fetch(`/api/repo-info?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch repo info');
      }
      const info = await res.json();
      set({ repoInfo: info, isLoadingInfo: false });
      
      // Automatically fetch tree
      get().fetchTree(info);
    } catch (err: any) {
      set({ error: err.message, isLoadingInfo: false });
    }
  },
  
  fetchTree: async (info) => {
    set({ isLoadingTree: true, error: null });
    try {
      const res = await fetch(`/api/tree?owner=${info.owner}&repo=${info.repo}&branch=${info.branch}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch tree');
      }
      const data = await res.json();
      
      const isTruncated = !!data.truncated;
      
      // Normalize tree
      const nodesMap: Record<string, TreeNode> = {};
      const rootNodes: string[] = [];
      
      // First pass: create nodes
      data.tree.forEach((item: any) => {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
        
        nodesMap[item.path] = {
          path: item.path,
          name,
          type: item.type, // 'blob' or 'tree'
          size: item.size,
          parentPath,
          depth: parts.length - 1,
          children: []
        };
      });
      
      // Second pass: build hierarchy
      Object.values(nodesMap).forEach(node => {
        if (node.parentPath) {
          if (nodesMap[node.parentPath]) {
            nodesMap[node.parentPath].children.push(node.path);
          }
        } else {
          rootNodes.push(node.path);
        }
      });
      
      // Sort children: folders first, then alphabetically
      const sortNodes = (paths: string[]) => {
        paths.sort((a, b) => {
          const nodeA = nodesMap[a];
          const nodeB = nodesMap[b];
          if (nodeA.type !== nodeB.type) {
            return nodeA.type === 'tree' ? -1 : 1;
          }
          return nodeA.name.localeCompare(nodeB.name);
        });
        paths.forEach(p => {
          if (nodesMap[p].children.length > 0) {
            sortNodes(nodesMap[p].children);
          }
        });
      };
      
      sortNodes(rootNodes);
      
      const expandedPaths = new Set<string>();
      const selectedPaths = new Set<string>();
      
      // If a specific path was requested, expand to it and select it
      if (info.path) {
        const parts = info.path.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          if (i < parts.length - 1) {
            expandedPaths.add(currentPath);
          }
        }
        
        // Select the target path if it exists
        if (nodesMap[info.path]) {
          // We will use the toggleSelection logic after setting state
          setTimeout(() => get().toggleSelection(info.path), 0);
        }
      } else {
        // Expand root level folders by default
        rootNodes.forEach(p => {
          if (nodesMap[p].type === 'tree') {
            expandedPaths.add(p);
          }
        });
      }
      
      set({ 
        tree: Object.values(nodesMap), 
        nodesMap, 
        rootNodes, 
        isLoadingTree: false,
        expandedPaths,
        isTruncated,
        currentPath: info.path || ''
      });
      
    } catch (err: any) {
      set({ error: err.message, isLoadingTree: false });
    }
  },
  
  toggleExpand: (path) => {
    set(state => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    });
  },
  
  expandAll: () => {
    set(state => {
      const newExpanded = new Set<string>();
      Object.values(state.nodesMap).forEach(node => {
        if (node.type === 'tree') newExpanded.add(node.path);
      });
      return { expandedPaths: newExpanded };
    });
  },
  
  collapseAll: () => set({ expandedPaths: new Set() }),
  
  navigateToPath: (path: string) => {
    set(state => {
      const newExpanded = new Set<string>();
      
      if (path) {
        // Expand all ancestors
        const parts = path.split('/');
        let current = '';
        for (const part of parts) {
          current = current ? `${current}/${part}` : part;
          if (state.nodesMap[current]?.type === 'tree') {
            newExpanded.add(current);
          }
        }
      } else {
        // Root: expand top-level folders
        state.rootNodes.forEach(p => {
          if (state.nodesMap[p]?.type === 'tree') {
            newExpanded.add(p);
          }
        });
      }
      
      return { expandedPaths: newExpanded, currentPath: path };
    });
  },
  
  selectAll: () => {
    set(state => {
      const newSelected = new Set<string>();
      Object.keys(state.nodesMap).forEach(path => newSelected.add(path));
      return { selectedPaths: newSelected, partiallySelectedPaths: new Set() };
    });
  },
  
  clearSelection: () => set({ selectedPaths: new Set(), partiallySelectedPaths: new Set() }),
  
  toggleSelection: (targetPath) => {
    set(state => {
      const { nodesMap, selectedPaths } = state;
      const newSelected = new Set(selectedPaths);
      const isCurrentlySelected = newSelected.has(targetPath);
      
      // Helper to select/unselect all descendants
      const setDescendants = (path: string, select: boolean) => {
        const node = nodesMap[path];
        if (!node) return;
        
        if (select) {
          newSelected.add(path);
        } else {
          newSelected.delete(path);
        }
        
        node.children.forEach(childPath => setDescendants(childPath, select));
      };
      
      // 1. Toggle target and its descendants
      setDescendants(targetPath, !isCurrentlySelected);
      
      // 2. Update ancestors
      const updateAncestors = (path: string) => {
        const node = nodesMap[path];
        if (!node || !node.parentPath) return;
        
        const parentPath = node.parentPath;
        const parentNode = nodesMap[parentPath];
        
        let allChildrenSelected = true;
        
        for (const childPath of parentNode.children) {
          if (!newSelected.has(childPath)) {
            allChildrenSelected = false;
            break;
          }
        }
        
        if (allChildrenSelected) {
          newSelected.add(parentPath);
        } else {
          newSelected.delete(parentPath);
        }
        
        updateAncestors(parentPath);
      };
      
      updateAncestors(targetPath);
      
      // 3. Compute partially selected paths
      const newPartiallySelected = new Set<string>();
      
      const computePartial = (path: string): boolean => {
        const node = nodesMap[path];
        if (!node || node.type === 'blob') return newSelected.has(path);
        
        let hasSelectedDescendant = false;
        let allDescendantsSelected = true;
        
        for (const childPath of node.children) {
          const childSelected = computePartial(childPath);
          if (childSelected) hasSelectedDescendant = true;
          if (!newSelected.has(childPath)) allDescendantsSelected = false;
        }
        
        if (hasSelectedDescendant && !allDescendantsSelected && !newSelected.has(path)) {
          newPartiallySelected.add(path);
        }
        
        return hasSelectedDescendant || newSelected.has(path);
      };
      
      state.rootNodes.forEach(rootPath => computePartial(rootPath));
      
      return {
        selectedPaths: newSelected,
        partiallySelectedPaths: newPartiallySelected
      };
    });
  }
}));
