import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { useSigma } from "react-sigma-v2";
import { MdCategory, MdExpandMore, MdExpandLess } from "react-icons/md";
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
    graph.forEachNode((_, attrs) => {
      if (attrs.tag) {
        index[attrs.tag] = (index[attrs.tag] || 0) + 1;
      }
    });
    return index;
  }, [graph]);

  const maxNodesPerCommunity = useMemo(() => Math.max(...values(nodesPerCommunity)), [nodesPerCommunity]);

  const [visibleNodesPerCommunity, setVisibleNodesPerCommunity] = useState<Record<string, number>>({});

  useEffect(() => {
    const updateVisibleNodes = () => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, attrs) => {
        if (!attrs.hidden && attrs.community) {
          index[attrs.community] = (index[attrs.community] || 0) + 1;
        }
      });
      setVisibleNodesPerCommunity(index);
    };

    // Initial update
    updateVisibleNodes();

    // Set up an interval to periodically update visible nodes
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
    const visibleNodesCount = visibleNodesPerCommunity[community.key] || 0;
    return (
      <li className="caption-row" key={community.key}>
        <input
          type="checkbox"
          checked={filters.communities[community.key] || false}
          onChange={() => toggleCommunity(community.key)}
          id={`community-${community.key}`}
        />
        <label htmlFor={`community-${community.key}`}>
          <span>{community.key}</span>
          <span className="text-muted text-small">
            ({visibleNodesCount}/{nodesCount})
          </span>
        </label>
      </li>
    );
  }, [nodesPerCommunity, visibleNodesPerCommunity, filters.communities, toggleCommunity]);

  return (
    <Panel title={<><MdCategory className="text-muted" /> School Community</>}>
      <p><i className="text-muted">Click a category to show/hide related pages from the network.</i></p>
      <p className="buttons">
        <button className="btn" onClick={() => setCommunities(mapValues(keyBy(communities, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={hideAllZones}>
          <AiOutlineCloseCircle /> Hide all zones
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
            <button 
              className="btn btn-small" 
              onClick={() => toggleHealthZone(healthZone)}
              style={{ fontSize: '0.8em', padding: '2px 5px', marginLeft: '10px' }}
            >
              {isZoneVisible(healthZone) ? "Hide" : "View"}
            </button>
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
