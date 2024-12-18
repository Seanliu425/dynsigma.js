import Graph from "graphology";
import { FiltersState } from "../types";

export const applyFilters = (graph: Graph, filters: FiltersState) => {
  // First check year filter, then apply combined filtering
  graph.forEachNode((node) => {
    const yearFiltered = graph.getNodeAttribute(node, "yearFiltered");
    const nodeCluster = graph.getNodeAttribute(node, "cluster");
    const nodeTag = graph.getNodeAttribute(node, "tag");
    const nodeCommunity = graph.getNodeAttribute(node, "community");
    
    // Check visibility for all filter types
    const clusterVisible = Object.keys(filters.clusters).length === 0 || filters.clusters[nodeCluster] === true;
    const tagVisible = Object.keys(filters.tags).length === 0 || filters.tags[nodeTag] === true;
    const communityVisible = Object.keys(filters.communities).length === 0 || filters.communities[nodeCommunity] === true;
    
    // Node should be visible only if it passes ALL filters
    const shouldBeVisible = clusterVisible && tagVisible && communityVisible;
    
    // If yearFiltered is true, node stays filtered out regardless of other filters
    graph.setNodeAttribute(node, "filteredOut", yearFiltered || !shouldBeVisible);
  });

  // Then update visible edge counts
  graph.forEachNode(node => {
    let visibleEdges = 0;
    graph.forEachEdge(node, (edge, attrs, source, target) => {
      const sourceFiltered = graph.getNodeAttribute(source, "filteredOut");
      const targetFiltered = graph.getNodeAttribute(target, "filteredOut");
      if (!sourceFiltered && !targetFiltered) {
        visibleEdges++;
      }
    });
    graph.setNodeAttribute(node, "visibleEdgeCount", visibleEdges);
  });
};

// Optional: Helper function to reset all filters
export const resetFilters = (filters: FiltersState): FiltersState => ({
  clusters: {},
  tags: {},
  communities: {},
  networkAttribute: filters.networkAttribute // Preserve the current network attribute
});

// Optional: Helper function to check if any filters are active
export const hasActiveFilters = (filters: FiltersState): boolean => {
  return Object.keys(filters.clusters).length > 0 ||
         Object.keys(filters.tags).length > 0 ||
         Object.keys(filters.communities).length > 0;
};