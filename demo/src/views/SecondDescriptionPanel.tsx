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

interface Connection {
  id: string;
  label: string;
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
  const [showAllSecondDegree, setShowAllSecondDegree] = useState(false);

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
    const connections = Array.from(new Set(
      firstDegreeConnections.flatMap(node => 
        graph.neighbors(node.id).filter(n => n !== clickedNode && !firstDegreeIds.has(n))
      )
    )).map(nodeId => ({
      id: nodeId,
      label: graph.getNodeAttribute(nodeId, "label") || nodeId,
    }));

    return connections.sort((a, b) => a.label.localeCompare(b.label));
  }, [clickedNode, firstDegreeConnections, graph]);

  const displayedSecondDegreeConnections = showAllSecondDegree 
    ? secondDegreeConnections 
    : secondDegreeConnections.slice(0, 10);

  const hasSecondDegreeConnections = secondDegreeConnections.length > 0;

  const toggleShowAllFirstDegree = () => {
    setShowAllFirstDegree(!showAllFirstDegree);
  };

  useEffect(() => {
    setShowAllFirstDegree(false);
    setShowAllSecondDegree(false);
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
        {clickedNode ? (
          <>
            <p>Name: {graph.getNodeAttribute(clickedNode, "label") || clickedNode}</p>
            <p>Tag: {graph.getNodeAttribute(clickedNode, "tag")}</p>
            <p>Number of Connections: {firstDegreeConnections.length}</p>
            <p>Linchpin Score: {graph.getNodeAttribute(clickedNode, "linchpinScore").toFixed(2)}</p>
          </>
        ) : (
          <p>No node selected</p>
        )}
        
        {/* Toggle for showing all first-degree connections */}
        {clickedNode && firstDegreeConnections.length > 10 && (
          <button 
            className={styles.showAllButton}
            onClick={() => setShowAllFirstDegree(!showAllFirstDegree)}
          >
            {showAllFirstDegree ? "Show Less" : "Show All"}
          </button>
        )}

        {/* First-degree connections */}
        {clickedNode && (
          <div>
            <h4>First-degree Connections:</h4>
            <ul>
              {displayedConnections.map(({ id, label }) => (
                <li key={id}>{label || id}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Second-degree connections */}
        {clickedNode && showSecondDegree && (
          <div>
            <h4>Second-degree Connections:</h4>
            <ul>
              {displayedSecondDegreeConnections.map(({ id, label }: Connection) => (
                <li key={id}>{label || id}</li>
              ))}
            </ul>
            {secondDegreeConnections.length > 10 && (
              <button 
                className={styles.showAllButton}
                onClick={() => setShowAllSecondDegree(!showAllSecondDegree)}
              >
                {showAllSecondDegree ? "Show Less" : "Show All"}
              </button>
            )}
          </div>
        )}

        {/* Controls for second-degree connections and cluster */}
        <div className={styles.controls}>
          <button
            className={`${styles.button} ${styles.secondDegreeButton}`}
            onClick={() => setShowSecondDegree(!showSecondDegree)}
            disabled={!clickedNode}
          >
            {showSecondDegree ? 'Hide' : 'Show'} Second-degree Connections
          </button>
          <button
            className={`${styles.button} ${styles.clusterButton}`}
            onClick={() => setShowCluster(!showCluster)}
            disabled={!clickedNode}
          >
            {showCluster ? 'Hide' : 'Show'} Cluster
          </button>
        </div>
      </div>
    </Panel>
  );
};

export default SecondDescriptionPanel;
