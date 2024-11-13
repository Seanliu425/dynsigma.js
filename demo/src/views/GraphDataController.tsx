import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useCallback } from "react";
import { keyBy, omit } from "lodash";

import { Dataset, FiltersState } from "../types";

const GraphDataController: FC<{ dataset: Dataset; filters: FiltersState }> = ({ dataset, filters, children }) => {
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

  /**
   * Feed graphology with the new dataset:
   */
  useEffect(() => {
    if (!graph || !dataset) return;

    const clusters = keyBy(dataset.clusters, "key");
    const tags = keyBy(dataset.tags, "key");
    const communities = keyBy(dataset.communities, "key");

    dataset.nodes.forEach((node) => {
      const nodeAttributes = {
        ...node,
        ...omit(clusters[node.cluster], "key"),
        image: `${process.env.PUBLIC_URL}/images/${tags[node.tag].image}`,
      };

      // Add healthzone and schooltype if they exist
      if ('healthzone' in node) {
        nodeAttributes.healthzone = node.healthzone;
      }
      if ('schooltype' in node) {
        nodeAttributes.schooltype = node.schooltype;
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
      const tag = graph.getNodeAttribute(node, "tag");
      if (degree < 2 || tag === "provider") {
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

    return () => graph.clear();
  }, [graph, dataset, checkSecondDegreeConnections]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { clusters, tags } = filters;
    graph.forEachNode((node, { cluster, tag }) => {
      const isHidden = !clusters[cluster] || !tags[tag];
      graph.setNodeAttribute(node, "hidden", isHidden);
    });

    // Update visible edge counts after changing visibility
    updateVisibleEdgeCounts();
  }, [graph, filters, updateVisibleEdgeCounts]);

  return <>{children}</>;
};

export default GraphDataController;
