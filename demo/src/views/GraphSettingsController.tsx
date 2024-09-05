import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useRef, useState, useCallback } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";
import { checkSecondDegreeConnections } from "../utils/graphUtils";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#CCCCCC";
const EDGE_GREEN_COLOR = "#66BB6A";
const EDGE_RED_COLOR = "#FF0000";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  clickedNode: string | null;
  showSecondDegree: boolean;
  showCluster: boolean;
  onLinchpinScoreCalculated?: (score: number) => void;
}> = ({ children, hoveredNode, clickedNode, showSecondDegree, showCluster, onLinchpinScoreCalculated }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [nodeSecondDegreeConnections, setNodeSecondDegreeConnections] = useState<Map<string, Set<string>>>(new Map());

  const checkSecondDegreeConnections = useCallback(() => {
    const connections = new Map<string, Set<string>>();

    graph.forEachNode((nodeKey) => {
      const nodeTag = graph.getNodeAttribute(nodeKey, "tag");
      const secondDegreeMatches = new Set<string>();

      graph.forEachNeighbor(nodeKey, (neighborKey) => {
        graph.forEachNeighbor(neighborKey, (secondDegreeKey) => {
          if (secondDegreeKey !== nodeKey && graph.getNodeAttribute(secondDegreeKey, "tag") === nodeTag) {
            secondDegreeMatches.add(neighborKey);
          }
        });
      });

      connections.set(nodeKey, secondDegreeMatches);
    });

    return connections;
  }, [graph]);

  useEffect(() => {
    const connections = checkSecondDegreeConnections();
    setNodeSecondDegreeConnections(connections);
  }, [checkSecondDegreeConnections]);

  const debouncedHoveredNode = useDebounce(hoveredNode, 40);

  /**
   * Initialize here settings that require to know the graph and/or the sigma
   * instance:
   */
  useEffect(() => {
    sigma.setSetting("hoverRenderer", (context, data, settings) =>
      drawHover(context, { ...sigma.getNodeDisplayData(data.key), ...data }, settings),
    );
  }, [sigma, graph]);

  /**
   * Update node and edge reducers when a node is hovered or selected, to hide unrelated nodes:
   */
  



  useEffect(() => {
    // Helper function to determine if a node is visible
    const isNodeVisible = (node: string) => {
      if (!clickedNode && !debouncedHoveredNode && !showCluster) return true;
      if (node === clickedNode) return true;
      if (showCluster && clickedNode) {
        const clickedNodeCluster = graph.getNodeAttribute(clickedNode, "cluster");
        const nodeCluster = graph.getNodeAttribute(node, "cluster");
        if (nodeCluster === clickedNodeCluster) return true;
      }
      if (clickedNode) {
        if (graph.hasEdge(node, clickedNode) || graph.hasEdge(clickedNode, node)) return true;
        if (showSecondDegree) {
          return graph.neighbors(clickedNode).some(neighbor => 
            graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
          );
        }
      } else if (debouncedHoveredNode) {
        if (node === debouncedHoveredNode || graph.hasEdge(node, debouncedHoveredNode) || graph.hasEdge(debouncedHoveredNode, node)) return true;
        if (showSecondDegree) {
          return graph.neighbors(debouncedHoveredNode).some(neighbor => 
            graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
          );
        }
      }
      return false;
    };

    sigma.setSetting(
      "nodeReducer",
      (node, data) => {
        if (isNodeVisible(node)) {
          return { ...data, hidden: false };
        }
        return { ...data, color: NODE_FADE_COLOR, zIndex: 0, label: "", hidden: true };
      }
    );

    sigma.setSetting(
      "edgeReducer",
      (edge, data) => {
        const [source, target] = graph.extremities(edge);
        
        if (clickedNode && source === clickedNode) {
          const targetTag = graph.getNodeAttribute(target, "tag");
          const clickedNodeTag = graph.getNodeAttribute(clickedNode, "tag");
          
          const hasMatchingSecondDegree = graph.neighbors(target).some(neighbor => 
            neighbor !== clickedNode && graph.getNodeAttribute(neighbor, "tag") === clickedNodeTag
          );

          const color = hasMatchingSecondDegree ? EDGE_GREEN_COLOR : EDGE_RED_COLOR;
          return { ...data, color, size: 2, hidden: false };
        }
        
        // All other edges, including incoming edges to the clicked node
        return { ...data, color: EDGE_FADE_COLOR, size: 1, hidden: false };
      }
    );

    if (clickedNode) {
      const linchpinScore = calculateLinchpinScore(clickedNode);
      onLinchpinScoreCalculated?.(linchpinScore);
    }
  }, [debouncedHoveredNode, clickedNode, showSecondDegree, showCluster, sigma, graph, nodeSecondDegreeConnections]);

  const calculateLinchpinScore = useCallback((nodeId: string) => {
    let redEdges = 0;
    let totalEdges = 0;

    graph.forEachOutNeighbor(nodeId, (target) => {
      totalEdges++;
      const targetTag = graph.getNodeAttribute(target, "tag");
      const nodeTag = graph.getNodeAttribute(nodeId, "tag");
      
      const hasMatchingSecondDegree = graph.neighbors(target).some(neighbor => 
        neighbor !== nodeId && graph.getNodeAttribute(neighbor, "tag") === nodeTag
      );

      if (!hasMatchingSecondDegree) {
        redEdges++;
      }
    });

    return totalEdges > 0 ? redEdges / totalEdges : 0;
  }, [graph]);

  // Handle camera animation for clicked node
  useEffect(() => {
    if (clickedNode) {
      const nodePosition = sigma.getNodeDisplayData(clickedNode);
      if (nodePosition) {
        const camera = sigma.getCamera();
        const currentState = camera.getState();
        
        camera.animate(
          { 
            x: nodePosition.x,
            y: nodePosition.y,
            ratio: currentState.ratio,
            angle: currentState.angle
          },
          { 
            duration: 500,
            easing: 'quadraticInOut'
          }
        );
      }
    }
  }, [clickedNode, sigma]);

  // Reset camera position when no node is clicked or hovered
  useEffect(() => {
    if (!clickedNode && !hoveredNode) {
      sigma.getCamera().animate(previousCamera.current, { duration: 300 });
    }
  }, [clickedNode, hoveredNode, sigma]);

  const previousCamera = useRef(sigma.getCamera().getState());

  return <>{children}</>;
};

export default GraphSettingsController;