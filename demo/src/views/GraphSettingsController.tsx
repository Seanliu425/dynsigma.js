import { useSigma } from "react-sigma-v2";
import { FC, useEffect } from "react";

import { drawHover } from "../canvas-utils";
import useDebounce from "../use-debounce";

const NODE_FADE_COLOR = "#bbb";
const EDGE_FADE_COLOR = "#eee";

const GraphSettingsController: FC<{
  hoveredNode: string | null;
  selectedNode: string | null;
}> = ({ children, hoveredNode, selectedNode }) => {
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
        ? (node, data) =>
            node === activeNode ||
            graph.hasEdge(node, activeNode) ||
            graph.hasEdge(activeNode, node)
              ? { ...data, zIndex: 1 }
              : { ...data, hidden: true }
        : null,
    );
    sigma.setSetting(
      "edgeReducer",
      activeNode
        ? (edge, data) =>
            graph.hasExtremity(edge, activeNode)
              ? { ...data, zIndex: 1 }
              : { ...data, hidden: true }
        : null,
    );
  }, [debouncedHoveredNode, selectedNode]);

  return <>{children}</>;
};

export default GraphSettingsController;
