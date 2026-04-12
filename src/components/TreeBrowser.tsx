import React, { useMemo } from 'react';
import { useStore, TreeNode } from '../store';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const TreeNodeItem: React.FC<{ node: TreeNode }> = ({ node }) => {
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
  
  // Filter logic: if search query exists, only show nodes that match or have descendants that match
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(query)) return true;
    
    if (node.type === 'tree') {
      // Check if any descendant matches
      const checkDescendants = (n: TreeNode): boolean => {
        for (const childPath of n.children) {
          const childNode = nodesMap[childPath];
          if (childNode.name.toLowerCase().includes(query)) return true;
          if (childNode.type === 'tree' && checkDescendants(childNode)) return true;
        }
        return false;
      };
      return checkDescendants(node);
    }
    return false;
  }, [node, searchQuery, nodesMap]);

  if (!matchesSearch) return null;

  // If searching, auto-expand folders that contain matches
  const shouldExpand = isExpanded || (searchQuery && node.type === 'tree');

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1.5 px-2 hover:bg-white/5 rounded-md cursor-pointer group transition-colors",
          isSelected && "bg-[#C48BFF]/10 hover:bg-[#C48BFF]/20"
        )}
        style={{ paddingLeft: `${node.depth * 1.2 + 0.5}rem` }}
        onClick={() => node.type === 'tree' ? toggleExpand(node.path) : toggleSelection(node.path)}
      >
        {/* Expand/Collapse Icon */}
        <div 
          className={cn("w-5 h-5 flex items-center justify-center text-zinc-500", node.type === 'blob' && "invisible")}
          onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'tree') toggleExpand(node.path);
          }}
        >
          {shouldExpand ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        {/* Checkbox */}
        <div 
          className="mx-2 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelection(node.path);
          }}
        >
          <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
            isSelected ? "bg-[#C48BFF] border-[#C48BFF]" : 
            isPartiallySelected ? "bg-[#C48BFF]/50 border-[#C48BFF]" : "border-zinc-500 group-hover:border-zinc-300"
          )}>
            {isSelected && <svg className="w-3 h-3 text-[#2B253C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            {!isSelected && isPartiallySelected && <div className="w-2 h-0.5 bg-[#2B253C] rounded-full" />}
          </div>
        </div>

        {/* File/Folder Icon */}
        <div className="mr-2 text-zinc-400">
          {node.type === 'tree' ? (
            shouldExpand ? <FolderOpen size={16} className="text-[#60A5FA]" /> : <Folder size={16} className="text-[#60A5FA]" />
          ) : (
            <File size={16} />
          )}
        </div>

        {/* Name */}
        <span className={cn(
          "text-sm truncate",
          isSelected ? "text-[#D4A8FF] font-bold" : "text-zinc-200 font-medium"
        )}>
          {node.name}
        </span>
      </div>

      {/* Children */}
      {node.type === 'tree' && shouldExpand && (
        <div>
          {node.children.map(childPath => (
            <TreeNodeItem key={childPath} node={nodesMap[childPath]} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeBrowser: React.FC = () => {
  const { rootNodes, nodesMap, isLoadingTree, error } = useStore();

  if (isLoadingTree) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#C48BFF] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Loading repository structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
        <p className="font-bold mb-2">Failed to load repository</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (rootNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 bg-[#423657] border border-black/20 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-medium">No files found in this repository.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#423657] border border-black/20 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="overflow-y-auto overflow-x-auto p-3 flex-1 custom-scrollbar">
        {rootNodes.map(path => (
          <TreeNodeItem key={path} node={nodesMap[path]} />
        ))}
      </div>
    </div>
  );
};
