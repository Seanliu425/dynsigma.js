import { useRegisterEvents, useSigma } from "react-sigma-v2";
import { FC, useEffect } from "react";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse");
}

const GraphEventsController: FC<{
  setHoveredNode: (node: string | null) => void;
  setSelectedNode: (node: string | null) => void;
}> = ({ setHoveredNode, setSelectedNode, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      clickNode({ node }) {
        if (!graph.getNodeAttribute(node, "hidden")) {
          setSelectedNode(node);
        }
      },
      clickStage() {
        setSelectedNode(null);
      },
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
  }, []);

  return <>{children}</>;
};

export default GraphEventsController;
