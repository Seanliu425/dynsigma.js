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
    sigma.setSetting(
      "nodeReducer",
      (node, data) => {
        // If no filtering is active, show all nodes
        if (!clickedNode && !debouncedHoveredNode && !showCluster) {
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
        
        if (clickedNode) {
          if (graph.hasEdge(node, clickedNode) || graph.hasEdge(clickedNode, node)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = graph.neighbors(clickedNode).some(neighbor => 
              graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
            );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
          // Hide nodes not connected to clicked node
          return { ...data, color: NODE_FADE_COLOR, zIndex: 0, label: "", hidden: true };
        } else if (debouncedHoveredNode) {
          if (node === debouncedHoveredNode || graph.hasEdge(node, debouncedHoveredNode) || graph.hasEdge(debouncedHoveredNode, node)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = graph.neighbors(debouncedHoveredNode).some(neighbor => 
              graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
            );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
          // Lower opacity for nodes not connected to hovered node
          return { ...data, color: NODE_FADE_COLOR, zIndex: 0, label: "", hidden: false };
        }
        
        return data;
      }
    );

    sigma.setSetting(
      "edgeReducer",
      (edge, data) => {
        // If no filtering is active, show all edges
        if (!clickedNode && !debouncedHoveredNode && !showCluster) {
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
        
        if (clickedNode) {
          if (graph.hasExtremity(edge, clickedNode)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = 
              graph.neighbors(clickedNode).some(neighbor => 
                graph.hasExtremity(edge, neighbor)
              );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
          // Hide edges not connected to clicked node
          return { ...data, color: EDGE_FADE_COLOR, hidden: true };
        } else if (debouncedHoveredNode) {
          if (graph.hasExtremity(edge, debouncedHoveredNode)) {
            return { ...data, zIndex: 1 };
          } else if (showSecondDegree) {
            const isSecondDegree = 
              graph.neighbors(debouncedHoveredNode).some(neighbor => 
                graph.hasExtremity(edge, neighbor)
              );
            if (isSecondDegree) return { ...data, zIndex: 0 };
          }
          // Lower opacity for edges not connected to hovered node
          return { ...data, color: EDGE_FADE_COLOR, hidden: false };
        }
        
        return data;
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