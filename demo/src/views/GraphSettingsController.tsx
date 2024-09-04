import { useSigma } from "react-sigma-v2";
import { FC, useEffect, useRef } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#eee";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  selectedNode: string | null;
  showSecondDegree: boolean;
}> = ({ children, hoveredNode, selectedNode, showSecondDegree }) => {
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
    const activeNode = selectedNode || debouncedHoveredNode;
    
    sigma.setSetting(
      "nodeReducer",
      activeNode
        ? (node, data) => {
            if (node === activeNode || graph.hasEdge(node, activeNode) || graph.hasEdge(activeNode, node)) {
              return { ...data, zIndex: 1 };
            } else if (showSecondDegree) {
              const isSecondDegree = graph.neighbors(activeNode).some(neighbor => 
                graph.hasEdge(node, neighbor) || graph.hasEdge(neighbor, node)
              );
              return isSecondDegree ? { ...data, zIndex: 0 } : { ...data, hidden: true };
            } else {
              return { ...data, hidden: true };
            }
          }
        : null,
    );
    sigma.setSetting(
      "edgeReducer",
      activeNode
        ? (edge, data) => {
            const [source, target] = graph.extremities(edge);
            if (graph.hasExtremity(edge, activeNode)) {
              return { ...data, zIndex: 1 };
            } else if (showSecondDegree) {
              const isSecondDegree = 
                graph.hasEdge(activeNode, source) || graph.hasEdge(activeNode, target) ||
                graph.neighbors(activeNode).some(neighbor => 
                  graph.hasEdge(neighbor, source) || graph.hasEdge(neighbor, target)
                );
              return isSecondDegree ? { ...data, zIndex: 0 } : { ...data, hidden: true };
            } else {
              return { ...data, hidden: true };
            }
          }
        : null,
    );
  }, [debouncedHoveredNode, selectedNode, showSecondDegree]);

  // Modify this useEffect to prevent zooming
  useEffect(() => {
    if (selectedNode) {
      const nodePosition = sigma.getNodeDisplayData(selectedNode);
      if (nodePosition) {
        const camera = sigma.getCamera();
        const currentState = camera.getState();
        
        // Only update x and y, keep the same ratio (zoom level)
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
  }, [selectedNode, sigma]);

  // Reset camera position when no node is selected
  useEffect(() => {
    if (!selectedNode && !hoveredNode) {
      sigma.getCamera().animate(previousCamera.current, { duration: 300 });
    }
  }, [selectedNode, hoveredNode, sigma]);

  return <>{children}</>;
};

export default GraphSettingsController;
