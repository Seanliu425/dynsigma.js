import { useSigma } from "react-sigma-v2";
import { FC, useEffect } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#eee";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  selectedNode: string | null;
  showSecondDegree: boolean;  // New prop
}> = ({ children, hoveredNode, selectedNode, showSecondDegree }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

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
              // Check if the node is a second-degree connection
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
            if (graph.hasExtremity(edge, activeNode)) {
              return { ...data, zIndex: 1 };
            } else if (showSecondDegree) {
              // Check if the edge connects to a first-degree neighbor
              const [source, target] = graph.extremities(edge);
              const isSecondDegree = 
                graph.hasEdge(activeNode, source) || graph.hasEdge(activeNode, target);
              return isSecondDegree ? { ...data, zIndex: 0 } : { ...data, hidden: true };
            } else {
              return { ...data, hidden: true };
            }
          }
        : null,
    );
  }, [debouncedHoveredNode, selectedNode, showSecondDegree]);

  return <>{children}</>;
};

export default GraphSettingsController;
