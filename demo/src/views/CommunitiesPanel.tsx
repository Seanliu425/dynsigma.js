import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { useSigma } from "react-sigma-v2";
import { MdCategory, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaUsers } from "react-icons/fa";  // Import community icon
import { keyBy, mapValues, sortBy, values, groupBy } from "lodash";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Community, FiltersState } from "../types";
import Panel from "./Panel";

type GroupedCommunities = {
  [key: string]: Community[];
};

const CommunitiesPanel: FC<{
  communities: Community[];
  filters: FiltersState;
  toggleCommunity: (community: string) => void;
  setCommunities: (communities: Record<string, boolean>) => void;
}> = ({ communities, filters, toggleCommunity, setCommunities }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});

  const nodesPerCommunity = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((node, attrs) => {
      if (attrs.community) {
        const visibleEdgeCount = graph.getNodeAttribute(node, "visibleEdgeCount") || 0;
        if (visibleEdgeCount > 0) {
          index[attrs.community] = (index[attrs.community] || 0) + 1;
        }
      }
    });
    return index;
  }, [graph]);

  const maxNodesPerCommunity = useMemo(() => Math.max(...values(nodesPerCommunity)), [nodesPerCommunity]);

  const [visibleNodesPerCommunity, setVisibleNodesPerCommunity] = useState<Record<string, number>>({});

  useEffect(() => {
    const updateVisibleNodes = () => {
      const index: Record<string, number> = {};
      graph.forEachNode((node, attrs) => {
        if (!attrs.hidden && attrs.community) {
          const visibleEdgeCount = graph.getNodeAttribute(node, "visibleEdgeCount") || 0;
          if (visibleEdgeCount > 0) {
            index[attrs.community] = (index[attrs.community] || 0) + 1;
          }
        }
      });
      setVisibleNodesPerCommunity(index);
    };

    updateVisibleNodes();
    const intervalId = setInterval(updateVisibleNodes, 1000);
    return () => clearInterval(intervalId);
  }, [graph, filters]);

  const groupedCommunities = useMemo<GroupedCommunities>(() => {
    const grouped = groupBy(communities, 'healthzone');
    delete grouped['Provider'];
    return grouped;
  }, [communities]);

  const healthZones = useMemo(() => sortBy(Object.keys(groupedCommunities)), [groupedCommunities]);

  const toggleZoneExpansion = useCallback((healthZone: string) => {
    setExpandedZones(prev => ({ ...prev, [healthZone]: !prev[healthZone] }));
  }, []);

  const isZoneVisible = useCallback((healthZone: string) => {
    const communitiesInZone = groupedCommunities[healthZone] || [];
    return communitiesInZone.some(community => filters.communities[community.key]);
  }, [groupedCommunities, filters.communities]);

  const toggleHealthZone = useCallback((healthZone: string) => {
    const communitiesInZone = groupedCommunities[healthZone] || [];
    const allVisible = communitiesInZone.every(community => filters.communities[community.key]);
    const newState = !allVisible;
    
    const updatedCommunities = { ...filters.communities };
    communitiesInZone.forEach(community => {
      updatedCommunities[community.key] = newState;
    });
    
    setCommunities(updatedCommunities);
  }, [groupedCommunities, filters.communities, setCommunities]);

  const hideAllZones = useCallback(() => {
    const updatedCommunities = { ...filters.communities };
    Object.values(groupedCommunities).flat().forEach(community => {
      updatedCommunities[community.key] = false;
    });
    setCommunities(updatedCommunities);
  }, [groupedCommunities, filters.communities, setCommunities]);

  const renderCommunity = useCallback((community: Community) => {
    const nodesCount = nodesPerCommunity[community.key] || 0;
    const isVisible = filters.communities[community.key] || false;
    const visibleNodesCount = isVisible ? (visibleNodesPerCommunity[community.key] || 0) : 0;

    return (
      <li
        className="caption-row"
        key={community.key}
        title={`${nodesCount} node${nodesCount > 1 ? "s" : ""}${
          !isVisible ? " (currently hidden)" : visibleNodesCount !== nodesCount ? ` (only ${visibleNodesCount} visible)` : ""
        }`}
      >
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => toggleCommunity(community.key)}
          id={`community-${community.key}`}
        />
        <label htmlFor={`community-${community.key}`}>
          <div className="node-label">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FaUsers style={{ marginRight: '8px', fontSize: '0.9em' }} />
              <span>{community.key}</span>
              <span className="text-muted text-small" style={{ marginLeft: 'auto' }}>
                ({visibleNodesCount}/{nodesCount})
              </span>
            </div>
            <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerCommunity + "%" }}>
              <div
                className="inside-bar"
                style={{
                  width: isVisible ? (100 * visibleNodesCount) / nodesCount + "%" : "0%",
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
          </div>
        </label>
      </li>
    );
  }, [nodesPerCommunity, visibleNodesPerCommunity, maxNodesPerCommunity, filters.communities, toggleCommunity]);

  const renderHealthZoneToggleButton = useCallback((healthZone: string) => {
    const isVisible = isZoneVisible(healthZone);
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isVisible ? '#28a745' : '#dc3545',
            marginRight: '5px'
          }}
        />
        <button 
          onClick={() => toggleHealthZone(healthZone)}
          style={{
            fontSize: '0.8em',
            padding: '2px 5px',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    );
  }, [isZoneVisible, toggleHealthZone]);

  useEffect(() => {
    // First check year filter, then apply community filtering
    graph.forEachNode((node) => {
      const yearFiltered = graph.getNodeAttribute(node, "yearFiltered");
      const community = graph.getNodeAttribute(node, "community");
      const shouldBeVisible = filters.communities[community];
      
      // If yearFiltered is true, node stays filtered out regardless of community filter
      graph.setNodeAttribute(node, "filteredOut", yearFiltered || !shouldBeVisible);
    });

    // Then update visible edge counts
    graph.forEachNode(node => {
      let visibleEdges = 0;
      graph.forEachEdge(node, (edge, attrs, source, target) => {
        const sourceFiltered = graph.getNodeAttribute(source, "filteredOut");
        const targetFiltered = graph.getNodeAttribute(target, "filteredOut");
        if (!sourceFiltered && !targetFiltered) {
          visibleEdges++;
        }
      });
      graph.setNodeAttribute(node, "visibleEdgeCount", visibleEdges);
    });
  }, [graph, filters.communities]);

  // Modify the check all button handler
  const handleCheckAll = () => {
    // Set all communities to visible in the filters
    setCommunities(mapValues(keyBy(communities, "key"), () => true));
  };

  return (
    <Panel title={<><MdCategory className="text-muted" /> School Community</>}>
      <p><i className="text-muted">Click a category to show/hide related pages from the network.</i></p>
      <p className="buttons">
        <button className="btn" onClick={handleCheckAll}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={hideAllZones}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      {healthZones.map((healthZone) => (
        <div key={healthZone}>
          <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span 
              style={{ fontWeight: 'bold', cursor: 'pointer' }} 
              onClick={() => toggleZoneExpansion(healthZone)}
            >
              {expandedZones[healthZone] ? <MdExpandLess /> : <MdExpandMore />} {healthZone}
            </span>
            {renderHealthZoneToggleButton(healthZone)}
          </h3>
          {expandedZones[healthZone] && (
            <ul>
              {(groupedCommunities[healthZone] || []).map(renderCommunity)}
            </ul>
          )}
        </div>
      ))}
    </Panel>
  );
};

export default CommunitiesPanel;
