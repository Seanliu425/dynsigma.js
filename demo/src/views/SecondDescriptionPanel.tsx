import React, { FC, useState, useEffect, useMemo } from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";
import styles from "./SecondDescriptionPanel.module.css"; // We'll create this CSS module

interface SecondDescriptionPanelProps {
  selectedNode: string | null;
  showSecondDegree: boolean;
  setShowSecondDegree: React.Dispatch<React.SetStateAction<boolean>>;
}

const SecondDescriptionPanel: FC<SecondDescriptionPanelProps> = ({ 
  selectedNode, 
  showSecondDegree, 
  setShowSecondDegree 
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [showAllFirstDegree, setShowAllFirstDegree] = useState(false);

  const firstDegreeConnections = useMemo(() => {
    if (!selectedNode) return [];

    const neighbors = graph.neighbors(selectedNode);
    const connections = neighbors.map(nodeId => ({
      id: nodeId,
      label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      hasSecondDegree: graph.neighbors(nodeId).some(n => n !== selectedNode && !neighbors.includes(n))
    }));

    // Sort connections, prioritizing those with second-degree connections
    connections.sort((a, b) => {
      if (a.hasSecondDegree && !b.hasSecondDegree) return -1;
      if (!a.hasSecondDegree && b.hasSecondDegree) return 1;
      return 0;
    });

    return connections;
  }, [selectedNode, graph]);

  const displayedConnections = showAllFirstDegree 
    ? firstDegreeConnections 
    : firstDegreeConnections.slice(0, 10);

  const secondDegreeConnections = useMemo(() => {
    if (!selectedNode) return [];

    const firstDegreeIds = new Set(firstDegreeConnections.map(n => n.id));
    return Array.from(new Set(
      firstDegreeConnections.flatMap(node => 
        graph.neighbors(node.id).filter(n => n !== selectedNode && !firstDegreeIds.has(n))
      )
    )).map(nodeId => ({
      id: nodeId,
      label: graph.getNodeAttribute(nodeId, "label") || nodeId,
    }));
  }, [selectedNode, firstDegreeConnections, graph]);

  const toggleShowAllFirstDegree = () => {
    setShowAllFirstDegree(!showAllFirstDegree);
  };

  useEffect(() => {
    setShowAllFirstDegree(false);
  }, [selectedNode]);

  return (
    <Panel
      initiallyDeployed={true}
      title={
        <>
          <BsInfoCircle className="text-muted" /> Node Information
        </>
      }
    >
      <div>
        <h3>Selected Node Information</h3>
        <p>Name: {selectedNode ? (graph.getNodeAttribute(selectedNode, "label") || selectedNode) : "Not Selected"}</p>
        <p>Number of Connections: {selectedNode ? firstDegreeConnections.length : "0"}</p>
        
        {selectedNode && (
          <>
            <h4>First-Degree Connections:</h4>
            {displayedConnections.length > 0 ? (
              <>
                <ul>
                  {displayedConnections.map(node => (
                    <li key={node.id}>
                      {node.label}
                      {node.hasSecondDegree}
                    </li>
                  ))}
                </ul>
                {firstDegreeConnections.length > 10 && (
                  <button 
                    onClick={toggleShowAllFirstDegree}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    {showAllFirstDegree ? "Show Less" : `Show More (${firstDegreeConnections.length - 10} more)`}
                  </button>
                )}
              </>
            ) : (
              <p>No direct connections</p>
            )}

            <button 
              onClick={() => setShowSecondDegree(!showSecondDegree)}
              className={`${styles.button} ${showSecondDegree ? styles.secondaryButton : styles.primaryButton}`}
            >
              {showSecondDegree ? "Hide" : "Show"} Second-Degree Connections
            </button>

            {showSecondDegree && (
              <>
                <p>Number of Second-Degree Connections: {secondDegreeConnections.length}</p>
                <h4>Second-Degree Connections:</h4>
                {secondDegreeConnections.length > 0 ? (
                  <ul>
                    {secondDegreeConnections.map(node => (
                      <li key={node.id}>{node.label}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No second-degree connections</p>
                )}
              </>
            )}
          </>
        )}
        {!selectedNode && (
          <p>No node selected. Select a node to see its connections.</p>
        )}
      </div>
    </Panel>
  );
};

export default SecondDescriptionPanel;
