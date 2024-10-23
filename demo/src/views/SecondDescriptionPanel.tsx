import React, { FC, useState, useEffect, useMemo } from "react";
import { BsInfoCircle, BsArrowRepeat } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";
import styles from "./SecondDescriptionPanel.module.css";

interface SecondDescriptionPanelProps {
  clickedNode: string | null;
  showSecondDegree: boolean;
  setShowSecondDegree: (value: boolean) => void;
  showCluster: boolean;
  setShowCluster: (value: boolean) => void;
  showCommunity: boolean;
  setShowCommunity: (value: boolean) => void;
  showHealthZone: boolean;
  setShowHealthZone: (value: boolean) => void;
  showSchoolType: boolean;
  setShowSchoolType: (value: boolean) => void;
}

interface Connection {
  id: string;
  label?: string;
}

const SecondDescriptionPanel: FC<SecondDescriptionPanelProps> = ({ 
  clickedNode, 
  showSecondDegree, 
  setShowSecondDegree, 
  showCluster,
  setShowCluster,
  showCommunity,
  setShowCommunity,
  showHealthZone,
  setShowHealthZone,
  showSchoolType,
  setShowSchoolType
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
    : firstDegreeConnections.slice(0, 5);

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
    : secondDegreeConnections.slice(0, 5);

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
        // Only set hidden to false if it was not already hidden by filters
        if (!graph.getNodeAttribute(node, "filteredOut")) {
          graph.setNodeAttribute(node, "hidden", false);
        }
      });
    }
  }, [clickedNode, setShowCluster, graph]);

  const handleClusterToggle = () => {
    if (clickedNode) {
      setShowCluster(!showCluster);
    }
  };

  const handleCommunityToggle = () => {
    if (clickedNode) {
      setShowCommunity(!showCommunity);
    }
  };

  const handleHealthZoneToggle = () => {
    if (clickedNode && healthZone) {
      setShowHealthZone(!showHealthZone);
    }
  };

  const handleSchoolTypeToggle = () => {
    if (clickedNode && isSchool && schoolType) {
      setShowSchoolType(!showSchoolType);
    }
  };

  const getNodeAttribute = (attribute: string) => {
    if (!clickedNode) return null;
    const value = graph.getNodeAttribute(clickedNode, attribute);
    console.log(`${attribute} for node ${clickedNode}:`, value); // Debug log
    return value;
  };

  const healthZone = getNodeAttribute("healthZone");
  const schoolType = getNodeAttribute("schoolType");
  const isSchool = getNodeAttribute("cluster") === "School";
  const nodeTag = getNodeAttribute("tag");

  const showCommunityButton = clickedNode && nodeTag !== "Provider";
  const showHealthZoneButton = !!healthZone;
  const showSchoolTypeButton = isSchool && !!schoolType;

  const clusterButtonText = isSchool 
    ? `${showCluster ? 'Hide' : 'Show'} Other Schools in Network`
    : `${showCluster ? 'Hide' : 'Show'} Other Similar Providers`;

  const communityButtonText = `${showCommunity ? 'Hide' : 'Show'} Other Community Schools`;
  const healthZoneButtonText = `${showHealthZone ? 'Hide' : 'Show'} Same Health Zone`;
  const schoolTypeButtonText = `${showSchoolType ? 'Hide' : 'Show'} Same School Type`;

  useEffect(() => {
    if (!clickedNode) {
      setShowCluster(false);
      setShowCommunity(false);
      setShowHealthZone(false);
      setShowSchoolType(false);
    } else if (nodeTag === "Provider") {
      setShowCommunity(false);
      setShowSchoolType(false);
    } else if (!isSchool) {
      setShowSchoolType(false);
    }
  }, [clickedNode, nodeTag, isSchool, setShowCluster, setShowCommunity, setShowHealthZone, setShowSchoolType]);

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
            <p><strong>Name:</strong> {graph.getNodeAttribute(clickedNode, "label") || clickedNode}</p>
            <p><strong>Provider Type:</strong> {graph.getNodeAttribute(clickedNode, "cluster")}</p>
            <p><strong>Community:</strong> {graph.getNodeAttribute(clickedNode, "community")}</p>
            <p><strong>Network:</strong> {nodeTag}</p>
            <p><strong>Number of Connections:</strong> {firstDegreeConnections.length}</p>
            <p><strong>Linchpin Score:</strong> {graph.getNodeAttribute(clickedNode, "linchpinScore").toFixed(2)}</p>
            {healthZone && <p><strong>Health Zone:</strong> {healthZone}</p>}
            {isSchool && schoolType && <p><strong>School Type:</strong> {schoolType}</p>}
          </>
        ) : (
          <p>No node selected</p>
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
            {firstDegreeConnections.length > 5 && (
              <button 
                className={styles.showAllButton}
                onClick={() => setShowAllFirstDegree(!showAllFirstDegree)}
              >
                {showAllFirstDegree ? "Show Less" : `Show All (${firstDegreeConnections.length - 5})`}
              </button>
            )}
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
            {secondDegreeConnections.length > 5 && (
              <button 
                className={styles.showAllButton}
                onClick={() => setShowAllSecondDegree(!showAllSecondDegree)}
              >
                {showAllSecondDegree ? "Show Less" : `Show All (${secondDegreeConnections.length - 5})`}
              </button>
            )}
          </div>
        )}

        {/* Controls for second-degree connections, cluster, community, health zone, and school type */}
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
            {clusterButtonText}
          </button>
          {showCommunityButton && (
            <button
              className={`${styles.button} ${styles.communityButton}`}
              onClick={() => setShowCommunity(!showCommunity)}
            >
              {communityButtonText}
            </button>
          )}
          {showHealthZoneButton && (
            <button
              className={`${styles.button} ${styles.healthZoneButton}`}
              onClick={handleHealthZoneToggle}
            >
              {healthZoneButtonText}
            </button>
          )}
          {showSchoolTypeButton && (
            <button
              className={`${styles.button} ${styles.schoolTypeButton}`}
              onClick={handleSchoolTypeToggle}
            >
              {schoolTypeButtonText}
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
};

export default SecondDescriptionPanel;
