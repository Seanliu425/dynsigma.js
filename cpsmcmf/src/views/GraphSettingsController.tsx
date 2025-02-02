import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useRef, useState, useCallback } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#CCCCCC";
const EDGE_HOVER_COLOR = "#FCD12A"; // New yellow color
const EDGE_GREEN_COLOR = "#66BB6A";
const EDGE_RED_COLOR = "#FF0000";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  clickedNode: string | null;
  showSecondDegree: boolean;
  showCluster: boolean;
  showCommunity: boolean;
  onLinchpinScoreCalculated?: (score: number) => void;
}> = ({ children, hoveredNode, clickedNode, showSecondDegree, showCluster, showCommunity, onLinchpinScoreCalculated }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [nodeSecondDegreeConnections, setNodeSecondDegreeConnections] = useState<Map<string, Set<string>>>(new Map());

  const isSchoolCluster = useCallback((nodeId: string) => {
    return graph.getNodeAttribute(nodeId, "cluster") === "School";
  }, [graph]);

  const getRelevantAttribute = useCallback((nodeId: string) => {
    return isSchoolCluster(nodeId) ? "tag" : "cluster";
  }, [isSchoolCluster]);

  useEffect(() => {
    sigma.setSetting("hoverRenderer", (context, data, settings) =>
      drawHover(context, { 
        ...sigma.getNodeDisplayData(data.key), 
        ...data, 
        community: graph.getNodeAttribute(data.key, "community") 
      }, settings),
    );
  }, [sigma, graph]);

  const debouncedHoveredNode = useDebounce(hoveredNode, 40);

  useEffect(() => {
    if (clickedNode) {
      const nodeAttributes = graph.getNodeAttributes(clickedNode);
      const nodeCommunity = nodeAttributes.community;
      const nodeCluster = nodeAttributes.cluster;

      graph.forEachNode((node) => {
        const attributes = graph.getNodeAttributes(node);
        const isSameCommunity = attributes.community === nodeCommunity;
        const isSameCluster = attributes.cluster === nodeCluster;
        const isVisible = 
          (showCommunity && isSameCommunity) || 
          (showCluster && isSameCluster) || 
          node === clickedNode;
        
        graph.setNodeAttribute(node, "hidden", !isVisible);
      });

      if (onLinchpinScoreCalculated) {
        const linchpinScore = calculateLinchpinScore(clickedNode);
        onLinchpinScoreCalculated(linchpinScore);
      }
    } else {
      graph.forEachNode((node) => {
        graph.setNodeAttribute(node, "hidden", false);
      });
    }

    sigma.setSetting(
      "nodeReducer",
      (node, data) => {
        // First check if node is filtered by communities panel
        const communityFiltered = graph.getNodeAttribute(node, "filteredOut");
        if (communityFiltered) {
          return { ...data, hidden: true };
        }

        // Then check visible edge count
        const visibleEdgeCount = graph.getNodeAttribute(node, "visibleEdgeCount") || 0;
        if (visibleEdgeCount === 0) {
          return { ...data, hidden: true };
        }

        if (!clickedNode && !debouncedHoveredNode && !showCluster && !showCommunity) {
          // No node is clicked or hovered, show all non-filtered nodes
          return { ...data, hidden: false };
        }

        const isVisible = (targetNode: string) => {
          if (clickedNode) {
            if (targetNode === clickedNode) return true;
            if (showCluster) {
              const relevantAttribute = getRelevantAttribute(clickedNode);
              const clickedNodeValue = graph.getNodeAttribute(clickedNode, relevantAttribute);
              const nodeValue = graph.getNodeAttribute(targetNode, relevantAttribute);
              if (nodeValue === clickedNodeValue) return true;
            }
            if (showCommunity) {
              const clickedNodeCommunity = graph.getNodeAttribute(clickedNode, "community");
              const nodeCommunity = graph.getNodeAttribute(targetNode, "community");
              if (nodeCommunity === clickedNodeCommunity) return true;
            }
            if (graph.hasEdge(targetNode, clickedNode) || graph.hasEdge(clickedNode, targetNode)) return true;
            if (showSecondDegree) {
              return graph.neighbors(clickedNode).some(neighbor => 
                graph.hasEdge(targetNode, neighbor) || graph.hasEdge(neighbor, targetNode)
              );
            }
          } else if (debouncedHoveredNode) {
            if (targetNode === debouncedHoveredNode) return true;
            if (graph.hasEdge(targetNode, debouncedHoveredNode) || graph.hasEdge(debouncedHoveredNode, targetNode)) return true;
            if (showSecondDegree) {
              return graph.neighbors(debouncedHoveredNode).some(neighbor => 
                graph.hasEdge(targetNode, neighbor) || graph.hasEdge(neighbor, targetNode)
              );
            }
          }
          return false;
        };

        if (isVisible(node)) {
          return { ...data, hidden: false };
        } else {
          return clickedNode 
            ? { ...data, hidden: true }
            : { ...data, color: NODE_FADE_COLOR, zIndex: 0, label: "", hidden: false };
        }
      }
    );

    sigma.setSetting(
      "edgeReducer",
      (edge, data) => {
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Check if either the source or target node is filtered out
        if (graph.getNodeAttribute(source, "filteredOut") || graph.getNodeAttribute(target, "filteredOut")) {
          return { ...data, hidden: true };
        }

        if (!clickedNode && !debouncedHoveredNode) {
          // No node is clicked or hovered, show all edges connected to non-filtered nodes
          return { ...data, hidden: false };
        }

        if (clickedNode) {
          const isSchool = graph.getNodeAttribute(clickedNode, "cluster") === "School";
          const clickedNodeCluster = graph.getNodeAttribute(clickedNode, "cluster");

          const isFirstDegree = (node: string) => 
            node === clickedNode || graph.hasEdge(node, clickedNode) || graph.hasEdge(clickedNode, node);

          const isSecondDegree = (node: string) => 
            graph.neighbors(clickedNode).some(neighbor => 
              graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
            );

          const isVisible = (node: string) => {
            if (node === clickedNode) return true;
            if (isFirstDegree(node)) return true;
            if (showSecondDegree && isSecondDegree(node)) return true;
            if (showCluster) {
              return graph.getNodeAttribute(node, isSchool ? "tag" : "cluster") === 
                     graph.getNodeAttribute(clickedNode, isSchool ? "tag" : "cluster");
            }
            if (showCommunity) {
              return graph.getNodeAttribute(node, "community") === 
                     graph.getNodeAttribute(clickedNode, "community");
            }
            return false;
          };

          if (isVisible(source) && isVisible(target)) {
            if (isSchool) {
              return { ...data, hidden: false }; // Use default color for School cluster
            } else {
              if (isFirstDegree(source) && isFirstDegree(target)) {
                // Get the pre-calculated colors from the clicked node's edge colors
                const edgeColors = graph.getNodeAttribute(clickedNode, "edgeColors") as Map<string, string>;
                let color;
                
                if (source === clickedNode) {
                  color = edgeColors.get(target);
                } else {
                  color = edgeColors.get(source);
                }

                return { 
                  ...data, 
                  color: color || data.color, 
                  hidden: false 
                };
              } else if (showSecondDegree && (isSecondDegree(source) || isSecondDegree(target))) {
                // For second-degree connections, use default color
                return { ...data, hidden: false };
              } else if (showCluster || showCommunity) {
                // For cluster or community connections, use default color
                return { ...data, hidden: false };
              }
            }
          }
          
          // If not visible, hide the edge
          return { ...data, hidden: true };
        } else if (debouncedHoveredNode) {
          // For hover, only show edges directly connected to the hovered node
          if (source === debouncedHoveredNode || target === debouncedHoveredNode) {
            return { ...data, color: EDGE_HOVER_COLOR, hidden: false };
          } else {
            return { ...data, hidden: true };
          }
        }

        // Default case: show the edge with default styling
        return { ...data, hidden: false };
      }
    );

    if (clickedNode) {
      const linchpinScore = calculateLinchpinScore(clickedNode);
      onLinchpinScoreCalculated?.(linchpinScore);
    }
  }, [debouncedHoveredNode, clickedNode, showSecondDegree, showCluster, showCommunity, sigma, graph, isSchoolCluster, getRelevantAttribute]);

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
    if (!clickedNode) {
      sigma.getCamera().animate(previousCamera.current, { duration: 300 });
    }
  }, [clickedNode, sigma]);

  const previousCamera = useRef(sigma.getCamera().getState());

  return <>{children}</>;
};

export default GraphSettingsController;