import React, { FC, ReactElement } from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";

interface DescriptionPanelProps {
  clickedNode: string | null;
  showSecondDegree: boolean;
  setShowSecondDegree: (value: boolean) => void;
}

const DescriptionPanel: FC<DescriptionPanelProps> = ({ 
  clickedNode, 
  showSecondDegree, 
  setShowSecondDegree 
}): ReactElement => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const clickedNodeAttributes = clickedNode && graph.hasNode(clickedNode)
    ? graph.getNodeAttributes(clickedNode)
    : null;

  const firstDegreeConnections = clickedNode && graph.hasNode(clickedNode)
    ? graph.neighbors(clickedNode).map(nodeId => ({
        id: nodeId,
        label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      }))
    : [];

  const secondDegreeConnections = clickedNode && graph.hasNode(clickedNode)
    ? Array.from(new Set(
        firstDegreeConnections.flatMap(node => 
          graph.neighbors(node.id).filter(n => n !== clickedNode && !firstDegreeConnections.some(fdc => fdc.id === n))
        )
      )).map(nodeId => ({
        id: nodeId,
        label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      }))
    : [];

  return (
    <Panel title="Node Description">
      {clickedNode ? (
        <div>
          <h2>{clickedNodeAttributes?.label || clickedNode}</h2>
          <p>First Degree Connections: {firstDegreeConnections.length}</p>
          <p>Second Degree Connections: {secondDegreeConnections.length}</p>
          <label>
            <input
              type="checkbox"
              checked={showSecondDegree}
              onChange={(e) => setShowSecondDegree(e.target.checked)}
            />
            Show Second Degree Connections
          </label>
        </div>
      ) : (
        <div>
          <BsInfoCircle />
          <p>Click on a node to see its details</p>
        </div>
      )}
    </Panel>
  );
};

export default DescriptionPanel;
