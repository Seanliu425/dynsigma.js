import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useCallback, PropsWithChildren } from "react";
import { keyBy, omit } from "lodash";

import { Dataset, FiltersState, NodeSizingMode, NodeData } from "../types";

interface Props {
  dataset: Dataset;
  filters: FiltersState;
  nodeSizingMode: NodeSizingMode;
  selectedYear?: string;
  selectedYears: string[];
  showAllConnections?: boolean;
  selectedNode?: string | null;
}

// Export this interface so it can be used in other components
export interface NodeAttributes extends Omit<NodeData, 'cluster'> {
  clusters: string[];
  image: string;
  color: string;
  clusterLabel: string;
  clusterColors: string[];
  healthzone?: string;
  schooltype?: string;
  hidden?: boolean;
  tagFiltered?: boolean;
  filteredOut?: boolean;
  [key: string]: any; // Allow for dynamic year properties
}

const GraphDataController: FC<PropsWithChildren<Props>> = ({
  dataset,
  filters,
  nodeSizingMode,
  selectedYear = "2024",
  selectedYears = ["2024", "2023", "2022", "2021"],
  showAllConnections = false,
  selectedNode = null,
  children
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const checkSecondDegreeConnections = useCallback(() => {
    const nodeEdgeColors = new Map();

    graph.forEachNode((nodeKey) => {
      const nodeCluster = graph.getNodeAttribute(nodeKey, "cluster");
      const connectedNodes = graph.neighbors(nodeKey);
      let redEdges = 0;
      let totalEdges = connectedNodes.length;
      
      const nodeColors = new Map();

      connectedNodes.forEach(connectedNodeKey => {
        const secondDegreeNodes = graph.neighbors(connectedNodeKey);
        const hasMatchingSecondDegreeNode = secondDegreeNodes.some(secondDegreeNodeKey => 
          secondDegreeNodeKey !== nodeKey && 
          graph.getNodeAttribute(secondDegreeNodeKey, "cluster") === nodeCluster
        );
        
        const color = hasMatchingSecondDegreeNode ? "#66BB6A" : "#FF0000";
        nodeColors.set(connectedNodeKey, color);
        
        if (!hasMatchingSecondDegreeNode) {
          redEdges++;
        }
      });

      nodeEdgeColors.set(nodeKey, nodeColors);

      const linchpinScore = totalEdges > 0 ? redEdges / totalEdges : 0;
      graph.setNodeAttribute(nodeKey, "linchpinScore", linchpinScore);
    });

    return nodeEdgeColors;
  }, [graph]);

  const countVisibleEdges = useCallback((nodeId: string) => {
    let visibleEdges = 0;
    graph.forEachEdge(nodeId, (edge, attrs, source, target) => {
      const sourceHidden = graph.getNodeAttribute(source, "hidden");
      const targetHidden = graph.getNodeAttribute(target, "hidden");
      if (!sourceHidden && !targetHidden && !attrs.hidden) {
        visibleEdges++;
      }
    });
    return visibleEdges;
  }, [graph]);

  const updateVisibleEdgeCounts = useCallback(() => {
    graph.forEachNode(node => {
      let visibleEdges = 0;
      graph.forEachEdge(node, (edge, attrs, source, target) => {
        const sourceHidden = graph.getNodeAttribute(source, "hidden");
        const targetHidden = graph.getNodeAttribute(target, "hidden");
        if (!sourceHidden && !targetHidden && !attrs.hidden) {
          visibleEdges++;
        }
      });
      graph.setNodeAttribute(node, "visibleEdgeCount", visibleEdges);
    });
  }, [graph]);

  const updateNodeSizes = useCallback(() => {
    const scores = graph.nodes().map((node) => {
      if (nodeSizingMode === 'linchpin') {
        const degree = graph.neighbors(node).length;
        const tag = graph.getNodeAttribute(node, "tag");
        if (degree < 2 || tag === "Provider") {
          return 0;
        }
        return graph.getNodeAttribute(node, "linchpinScore");
      } else {
        return graph.getNodeAttribute(node, "score");
      }
    });

    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = nodeSizingMode === 'linchpin' ? 12 : 20;
    
    graph.forEachNode((node) => {
      if (nodeSizingMode === 'linchpin') {
        const degree = graph.neighbors(node).length;
        const cluster = graph.getNodeAttribute(node, "cluster");
        if (degree < 2 || cluster === "School") {
          graph.setNodeAttribute(node, "size", MIN_NODE_SIZE);
          return;
        }
      }
      
      const value = nodeSizingMode === 'linchpin' 
        ? graph.getNodeAttribute(node, "linchpinScore")
        : graph.getNodeAttribute(node, "score");
        
      graph.setNodeAttribute(
        node,
        "size",
        ((value - minDegree) / (maxDegree - minDegree)) *
          (MAX_NODE_SIZE - MIN_NODE_SIZE) +
          MIN_NODE_SIZE,
      );
    });
  }, [graph, nodeSizingMode]);

  /**
   * Feed graphology with the new dataset:
   */
  useEffect(() => {
    if (!graph || !dataset) return;

    const clusters = keyBy(dataset.clusters, "key");
    const tags = keyBy(dataset.tags, "key");
    const communities = keyBy(dataset.communities, "key");

    dataset.nodes.forEach((node: NodeData) => {
      // Convert single cluster to array if needed
      const nodeClusters = Array.isArray((node as any).clusters) 
        ? (node as any).clusters 
        : [node.clusters];

      const nodeAttributes: NodeAttributes = {
        ...node,
        clusters: nodeClusters,
        ...omit(clusters[nodeClusters[0]], "key"),
        image: `${process.env.PUBLIC_URL}/images/${tags[node.tag].image}`,
        clusterColors: nodeClusters.map((c: string) => clusters[c].color),
        cluster: nodeClusters[0] // Keep the single cluster for backward compatibility
      };

      // Add healthzone and schooltype if they exist
      if ('healthzone' in node) {
        nodeAttributes.healthzone = (node as any).healthzone;
      }
      if ('schooltype' in node) {
        nodeAttributes.schooltype = (node as any).schooltype;
      }

      graph.addNode(node.key, nodeAttributes);
    });

    dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 2 })); // Set initial edge thickness here

    // After adding all nodes and edges, we can perform our analysis
    checkSecondDegreeConnections();

    // Get linchpin scores for sizing
    const scores = graph.nodes().map((node) => {
      const degree = graph.neighbors(node).length;
      const tag = graph.getNodeAttribute(node, "tag");
      if (degree < 2 || tag === "Provider") {
        return 0;
      }
      return graph.getNodeAttribute(node, "linchpinScore");
    });
    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 12;
    
    graph.forEachNode((node) => {
      const degree = graph.neighbors(node).length;
      const cluster = graph.getNodeAttribute(node, "cluster");
      if (degree < 2 || cluster === "School") {
        graph.setNodeAttribute(node, "size", MIN_NODE_SIZE);
      } else {
        graph.setNodeAttribute(
          node,
          "size",
          ((graph.getNodeAttribute(node, "linchpinScore") - minDegree) / (maxDegree - minDegree)) *
            (MAX_NODE_SIZE - MIN_NODE_SIZE) +
            MIN_NODE_SIZE,
        );
      }
    });

    // After adding all nodes and edges, set the total edge count for each node
    graph.forEachNode(node => {
      const totalEdges = graph.degree(node);  // gets total number of edges for the node
      graph.setNodeAttribute(node, "totalEdgeCount", totalEdges);
    });

    return () => graph.clear();
  }, [graph, dataset, checkSecondDegreeConnections]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    if (!graph) return;

    graph.forEachNode((node) => {
      const nodeData = graph.getNodeAttributes(node);
      const nodeClusters = nodeData.clusters;
      
      // Node is visible if ANY of its clusters are visible
      const clusterFiltered = !nodeClusters.some((cluster: string) => filters.clusters[cluster]);
      
      // Rest of the filtering logic
      const yearFiltered = !selectedYears.some((year: string) => {
        const yearValue = graph.getNodeAttribute(node, year);
        return yearValue === "Yes";
      });
      const tagFiltered = graph.getNodeAttribute(node, "tagFiltered");
      const communityFiltered = graph.getNodeAttribute(node, "filteredOut");

      graph.setNodeAttribute(node, "clusterFiltered", clusterFiltered);
      graph.setNodeAttribute(node, "yearFiltered", yearFiltered);

      let shouldHide = yearFiltered || tagFiltered || clusterFiltered || communityFiltered;

      if (showAllConnections && selectedNode) {
        if (node === selectedNode) {
          shouldHide = yearFiltered;
        } else {
          const isNeighbor = graph.neighbors(selectedNode).includes(node);
          shouldHide = yearFiltered || !isNeighbor;
        }
      }
      
      graph.setNodeAttribute(node, "hidden", shouldHide);
    });

    // Update edge visibility
    graph.forEachEdge((edge, _attrs, source, target) => {
      const sourceHidden = graph.getNodeAttribute(source, "hidden");
      const targetHidden = graph.getNodeAttribute(target, "hidden");
      graph.setEdgeAttribute(edge, "hidden", sourceHidden || targetHidden);
    });

    updateVisibleEdgeCounts();
  }, [graph, filters, selectedYears, showAllConnections, selectedNode]);

  // Add effect to update sizes when mode changes
  useEffect(() => {
    if (!graph) return;
    updateNodeSizes();
  }, [nodeSizingMode, updateNodeSizes]);

  return <>{children}</>;
};

export default GraphDataController;
