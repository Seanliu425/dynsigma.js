import { useRegisterEvents, useSigma } from "react-sigma-v2";
import { FC, useEffect, useCallback } from "react";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse");
}

const GraphEventsController: FC<{
  setHoveredNode: (node: string | null) => void;
  setClickedNode: React.Dispatch<React.SetStateAction<string | null>>;
  interactionsEnabled: boolean;
}> = ({ setHoveredNode, setClickedNode, interactionsEnabled, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const registerEvents = useRegisterEvents();

  const handleNodeClick = useCallback((node: string) => {
    console.log("Node clicked:", node);
    setClickedNode((prevNode) => {
      if (prevNode === node) {
        // If clicking the same node, deselect it
        console.log("Deselecting node:", node);
        return null;
      } else {
        // If clicking a new node, select it and recenter
        console.log("Selecting new node:", node);
        const nodePosition = graph.getNodeAttributes(node);
        if (nodePosition) {
          console.log("Recentering on node:", node, "Position:", nodePosition);
          sigma.getCamera().animate(
            { x: nodePosition.x, y: nodePosition.y },
            { duration: 500 }
          );
        } else {
          console.warn("Node position not found for:", node);
        }
        return node;
      }
    });
  }, [graph, setClickedNode, sigma]);

  useEffect(() => {
    if (!interactionsEnabled) return;

    const clickNodeHandler = ({ node }: { node: string }) => {
      handleNodeClick(node);
    };

    const clickStageHandler = () => {
      console.log("Stage clicked, deselecting node");
      setClickedNode(null);
    };

    registerEvents({
      clickNode: clickNodeHandler,
      clickStage: clickStageHandler,
      enterNode({ node }) {
        setHoveredNode(node);
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer");
      },
      leaveNode() {
        setHoveredNode(null);
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer");
      },
    });

    return () => {
      sigma.removeListener('clickNode', clickNodeHandler);
      sigma.removeListener('clickStage', clickStageHandler);
    };
  }, [interactionsEnabled, setHoveredNode, setClickedNode, graph, registerEvents, sigma, handleNodeClick]);

  return <>{children}</>;
};

export default GraphEventsController;