import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useRef } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#eee";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  clickedNode: string | null;
  showSecondDegree: boolean;
  showCluster: boolean;
}> = ({ children, hoveredNode, clickedNode, showSecondDegree, showCluster }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const previousCamera = useRef(sigma.getCamera().getState());

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
    const activeNode = clickedNode || debouncedHoveredNode;
    
    sigma.setSetting(
      "nodeReducer",
      (node, data) => {
        // If no filtering is active, show all nodes
        if (!activeNode && !showCluster) {
          return data;
        }

        // Always show the clicked node
        if (node === clickedNode) {
          return { ...data, zIndex: 2 }; // Higher zIndex to ensure it's on top
        }

        if (showCluster && clickedNode) {
          const clickedNodeCluster = graph.getNodeAttribute(clickedNode, "cluster");
          const nodeCluster = graph.getNodeAttribute(node, "cluster");
          if (nodeCluster === clickedNodeCluster) {
            return { ...data, zIndex: 1 };
          }
        }
        
        if (activeNode) {
          if (node === activeNode || graph.hasEdge(node, activeNode) || graph.hasEdge(activeNode, node)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = graph.neighbors(activeNode).some(neighbor => 
              graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
            );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
        }
        
        // Hide the node if it doesn't meet any of the above conditions
        return { ...data, hidden: true };
      }
    );

    sigma.setSetting(
      "edgeReducer",
      (edge, data) => {
        // If no filtering is active, show all edges
        if (!activeNode && !showCluster) {
          return data;
        }

        const [source, target] = graph.extremities(edge);

        // Always show edges connected to the clicked node
        if (clickedNode && (source === clickedNode || target === clickedNode)) {
          return { ...data, zIndex: 2 }; // Higher zIndex to ensure it's on top
        }

        if (showCluster && clickedNode) {
          const clickedNodeCluster = graph.getNodeAttribute(clickedNode, "cluster");
          const sourceCluster = graph.getNodeAttribute(source, "cluster");
          const targetCluster = graph.getNodeAttribute(target, "cluster");
          if (sourceCluster === clickedNodeCluster && targetCluster === clickedNodeCluster) {
            return { ...data, zIndex: 1 };
          }
        }
        
        if (activeNode) {
          if (graph.hasExtremity(edge, activeNode)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = 
              graph.hasEdge(activeNode, source) || graph.hasEdge(activeNode, target) ||
              graph.neighbors(activeNode).some(neighbor => 
                graph.hasEdge(neighbor, source) || graph.hasEdge(neighbor, target)
              );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
        }
        
        // Hide the edge if it doesn't meet any of the above conditions
        return { ...data, hidden: true };
      }
    );
  }, [debouncedHoveredNode, clickedNode, showSecondDegree, showCluster, sigma, graph]);

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

  return <>{children}</>;
};

export default GraphSettingsController;