import React, { FC, useState, useEffect, useMemo } from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";
import styles from "./SecondDescriptionPanel.module.css"; // We'll create this CSS module

interface SecondDescriptionPanelProps {
  clickedNode: string | null;
  showSecondDegree: boolean;
  setShowSecondDegree: (value: boolean) => void;
  showCluster: boolean;
  setShowCluster: (value: boolean) => void;
}

const SecondDescriptionPanel: FC<SecondDescriptionPanelProps> = ({ 
  clickedNode, 
  showSecondDegree, 
  setShowSecondDegree, 
  showCluster,
  setShowCluster 
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [showAllFirstDegree, setShowAllFirstDegree] = useState(false);

  const firstDegreeConnections = useMemo(() => {
    if (!clickedNode) return [];

    const neighbors = graph.neighbors(clickedNode);
    const connections = neighbors.map(nodeId => ({
      id: nodeId,
      label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      hasSecondDegree: graph.neighbors(nodeId).some(n => n !== clickedNode && !neighbors.includes(n))
    }));

    // Sort connections, prioritizing those with second-degree connections
    connections.sort((a, b) => {
      if (a.hasSecondDegree && !b.hasSecondDegree) return -1;
      if (!a.hasSecondDegree && b.hasSecondDegree) return 1;
      return 0;
    });

    return connections;
  }, [clickedNode, graph]);

  const displayedConnections = showAllFirstDegree 
    ? firstDegreeConnections 
    : firstDegreeConnections.slice(0, 10);

  const secondDegreeConnections = useMemo(() => {
    if (!clickedNode) return [];

    const firstDegreeIds = new Set(firstDegreeConnections.map(n => n.id));
    return Array.from(new Set(
      firstDegreeConnections.flatMap(node => 
        graph.neighbors(node.id).filter(n => n !== clickedNode && !firstDegreeIds.has(n))
      )
    )).map(nodeId => ({
      id: nodeId,
      label: graph.getNodeAttribute(nodeId, "label") || nodeId,
    }));
  }, [clickedNode, firstDegreeConnections, graph]);

  const hasSecondDegreeConnections = secondDegreeConnections.length > 0;

  const toggleShowAllFirstDegree = () => {
    setShowAllFirstDegree(!showAllFirstDegree);
  };

  useEffect(() => {
    setShowAllFirstDegree(false);
  }, [clickedNode]);

  useEffect(() => {
    if (!clickedNode) {
      setShowCluster(false);
      graph.forEachNode((node) => {
        graph.setNodeAttribute(node, "hidden", false);
      });
    }
  }, [clickedNode, setShowCluster, graph]);

  const handleClusterToggle = () => {
    if (clickedNode) {
      const newShowCluster = !showCluster;
      setShowCluster(newShowCluster);
      // Note: When a node is selected, we assume the existing clustering logic will handle visibility
    }
  };

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
        <p>Name: {clickedNode ? (graph.getNodeAttribute(clickedNode, "label") || clickedNode) : "Not Selected"}</p>
        <p>Number of Connections: {clickedNode ? firstDegreeConnections.length : "0"}</p>
        
        {clickedNode && (
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
              disabled={!hasSecondDegreeConnections}
            >
              {!hasSecondDegreeConnections
                ? "No Second-Degree Connections"
                : showSecondDegree
                ? "Hide Second-Degree Connections"
                : "Show Second-Degree Connections"}
            </button>

            {showSecondDegree && hasSecondDegreeConnections && (
              <>
                <p>Number of Second-Degree Connections: {secondDegreeConnections.length}</p>
                <h4>Second-Degree Connections:</h4>
                <ul>
                  {secondDegreeConnections.map(node => (
                    <li key={node.id}>{node.label}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {!clickedNode && (
          <p><strong>No node selected. Select a node to see its connections.</strong></p>
        )}
      </div>
      <div className={styles.panel}>
        <button
          className={`${styles.button} ${styles.clusterButton}`}
          onClick={handleClusterToggle}
          disabled={!clickedNode}
        >
          {clickedNode
            ? (showCluster ? 'Hide' : 'Show') + ' Organizations in my Cluster'
            : 'Please Search or Select a Node'}
        </button>
      </div>
    </Panel>
  );
};

export default SecondDescriptionPanel;
