import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useCallback } from "react";
import { keyBy, omit } from "lodash";

import { Dataset, FiltersState } from "../types";

const GraphDataController: FC<{ dataset: Dataset; filters: FiltersState }> = ({ dataset, filters, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const calculateLinchpinScores = useCallback(() => {
    graph.forEachNode((nodeKey) => {
      if (graph.getNodeAttribute(nodeKey, "hidden")) {
        graph.setNodeAttribute(nodeKey, "linchpinScore", 0);
        return;
      }

      const firstDegreeConnections = new Set<string>();
      const secondDegreeConnections = new Set<string>();

      // Get first-degree connections
      graph.forEachNeighbor(nodeKey, (neighbor) => {
        if (!graph.getNodeAttribute(neighbor, "hidden")) {
          firstDegreeConnections.add(neighbor);
        }
      });

      // Get second-degree connections
      firstDegreeConnections.forEach((neighbor) => {
        graph.forEachNeighbor(neighbor, (secondNeighbor) => {
          if (!graph.getNodeAttribute(secondNeighbor, "hidden") && 
              secondNeighbor !== nodeKey && 
              !firstDegreeConnections.has(secondNeighbor)) {
            secondDegreeConnections.add(secondNeighbor);
          }
        });
      });

      const totalConnections = firstDegreeConnections.size + secondDegreeConnections.size;
      const linchpinScore = totalConnections > 0 ? secondDegreeConnections.size / totalConnections : 0;

      graph.setNodeAttribute(nodeKey, "linchpinScore", linchpinScore);
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
      graph.addNode(node.key, {
        ...node,
        ...omit(clusters[node.cluster], "key"),
        image: `${process.env.PUBLIC_URL}/images/${tags[node.tag].image}`,
      });
    });

    dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 2 })); // Set initial edge thickness here

    // After adding all nodes and edges, we can perform our analysis
    calculateLinchpinScores();

    // Use degrees as node sizes:
    const scores = graph.nodes().map((node) => graph.getNodeAttribute(node, "score"));
    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 20;
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
  }, [graph, dataset, calculateLinchpinScores]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { clusters, tags, communities } = filters;
    graph.forEachNode((node) => {
      const nodeData = graph.getNodeAttributes(node);
      const isClusterVisible = clusters[nodeData.cluster];
      const isTagVisible = tags[nodeData.tag];
      const isCommunityVisible = communities[nodeData.community];
      graph.setNodeAttribute(node, "filteredOut", !isClusterVisible || !isTagVisible || !isCommunityVisible);
    });
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;
