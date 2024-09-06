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
      const nodeTag = graph.getNodeAttribute(nodeKey, "tag");
      const connectedNodes = graph.neighbors(nodeKey);
      let redEdges = 0;
      let totalEdges = connectedNodes.length;
      
      const nodeColors = new Map();

      connectedNodes.forEach(connectedNodeKey => {
        const secondDegreeNodes = graph.neighbors(connectedNodeKey);
        const hasMatchingSecondDegreeNode = secondDegreeNodes.some(secondDegreeNodeKey => 
          secondDegreeNodeKey !== nodeKey && 
          graph.getNodeAttribute(secondDegreeNodeKey, "tag") === nodeTag
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

  /**
   * Feed graphology with the new dataset:
   */
  useEffect(() => {
    if (!graph || !dataset) return;

    const clusters = keyBy(dataset.clusters, "key");
    const tags = keyBy(dataset.tags, "key");

    dataset.nodes.forEach((node) => {
      graph.addNode(node.key, {
        ...node,
        ...omit(clusters[node.cluster], "key"),
        image: `${process.env.PUBLIC_URL}/images/${tags[node.tag].image}`,
      });
    });

    dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 2 })); // Set initial edge thickness here

    // After adding all nodes and edges, we can perform our analysis
    checkSecondDegreeConnections();

    // Use degrees as node sizes:
    const scores = graph.nodes().map((node) => graph.getNodeAttribute(node, "score"));
    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 30;
    graph.forEachNode((node) =>
      graph.setNodeAttribute(
        node,
        "size",
        ((graph.getNodeAttribute(node, "score") - minDegree) / (maxDegree - minDegree)) *
          (MAX_NODE_SIZE - MIN_NODE_SIZE) +
          MIN_NODE_SIZE,
      ),
    );

    return () => graph.clear();
  }, [graph, dataset, checkSecondDegreeConnections]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { clusters, tags } = filters;
    graph.forEachNode((node) => {
      const nodeData = graph.getNodeAttributes(node);
      const isClusterVisible = clusters[nodeData.cluster];
      const isTagVisible = tags[nodeData.tag];
      graph.setNodeAttribute(node, "filteredOut", !isClusterVisible || !isTagVisible);
    });
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;
