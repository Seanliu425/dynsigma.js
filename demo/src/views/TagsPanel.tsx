import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { useSigma } from "react-sigma-v2";
import { MdCategory, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaTag } from "react-icons/fa";
import { keyBy, mapValues, sortBy, values, groupBy } from "lodash";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Tag, FiltersState } from "../types";
import Panel from "./Panel";

type GroupedTags = {
  [key: string]: Tag[];
};

const TagsPanel: FC<{
  tags: Tag[];
  filters: FiltersState;
  toggleTag: (tag: string) => void;
  setTags: (tags: Record<string, boolean>) => void;
}> = ({ tags, filters, toggleTag, setTags }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const [expandedSchoolTypes, setExpandedSchoolTypes] = useState<Record<string, boolean>>({});

  const nodesPerTag = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, attrs) => {
      if (attrs.tag) {
        index[attrs.tag] = (index[attrs.tag] || 0) + 1;
      }
    });
    return index;
  }, [graph]);

  const maxNodesPerTag = useMemo(() => Math.max(...values(nodesPerTag)), [nodesPerTag]);

  const [visibleNodesPerTag, setVisibleNodesPerTag] = useState<Record<string, number>>({});

  useEffect(() => {
    const updateVisibleNodes = () => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, attrs) => {
        if (!attrs.hidden && attrs.tag) {
          index[attrs.tag] = (index[attrs.tag] || 0) + 1;
        }
      });
      setVisibleNodesPerTag(index);
    };

    updateVisibleNodes();
    const intervalId = setInterval(updateVisibleNodes, 1000);
    return () => clearInterval(intervalId);
  }, [graph, filters]);

  const groupedTags = useMemo<GroupedTags>(() => {
    return groupBy(tags, 'schooltype');
  }, [tags]);

  const schoolTypes = useMemo(() => sortBy(Object.keys(groupedTags)), [groupedTags]);

  const toggleSchoolTypeExpansion = useCallback((schoolType: string) => {
    setExpandedSchoolTypes(prev => ({ ...prev, [schoolType]: !prev[schoolType] }));
  }, []);

  const isSchoolTypeVisible = useCallback((schoolType: string) => {
    const tagsInSchoolType = groupedTags[schoolType] || [];
    return tagsInSchoolType.some(tag => filters.tags[tag.key]);
  }, [groupedTags, filters.tags]);

  const toggleSchoolType = useCallback((schoolType: string) => {
    const tagsInSchoolType = groupedTags[schoolType] || [];
    const allVisible = tagsInSchoolType.every(tag => filters.tags[tag.key]);
    const newState = !allVisible;
    
    const updatedTags = { ...filters.tags };
    tagsInSchoolType.forEach(tag => {
      updatedTags[tag.key] = newState;
    });
    
    setTags(updatedTags);
  }, [groupedTags, filters.tags, setTags]);

  const hideAllSchoolTypes = useCallback(() => {
    const updatedTags = { ...filters.tags };
    Object.values(groupedTags).flat().forEach(tag => {
      updatedTags[tag.key] = false;
    });
    setTags(updatedTags);
  }, [groupedTags, filters.tags, setTags]);

  const renderTag = useCallback((tag: Tag) => {
    const nodesCount = nodesPerTag[tag.key] || 0;
    const isVisible = filters.tags[tag.key] || false;
    const visibleNodesCount = isVisible ? (visibleNodesPerTag[tag.key] || 0) : 0;

    return (
      <li
        className="caption-row"
        key={tag.key}
        title={`${nodesCount} node${nodesCount > 1 ? "s" : ""}${
          !isVisible ? " (currently hidden)" : visibleNodesCount !== nodesCount ? ` (only ${visibleNodesCount} visible)` : ""
        }`}
      >
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => toggleTag(tag.key)}
          id={`tag-${tag.key}`}
        />
        <label htmlFor={`tag-${tag.key}`}>
          <div className="node-label">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FaTag style={{ marginRight: '8px', fontSize: '0.9em' }} />
              <span>{tag.key}</span>
              <span className="text-muted text-small" style={{ marginLeft: 'auto' }}>
                ({visibleNodesCount}/{nodesCount})
              </span>
            </div>
            <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerTag + "%" }}>
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
  }, [nodesPerTag, visibleNodesPerTag, maxNodesPerTag, filters.tags, toggleTag]);

  const renderSchoolTypeToggleButton = useCallback((schoolType: string) => {
    const isVisible = isSchoolTypeVisible(schoolType);
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
          onClick={() => toggleSchoolType(schoolType)}
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
  }, [isSchoolTypeVisible, toggleSchoolType]);

  return (
    <Panel title={<><MdCategory className="text-muted" /> School Type</>}>
      <p><i className="text-muted">Click a school type to show/hide related pages from the network.</i></p>
      <p className="buttons">
        <button className="btn" onClick={() => setTags(mapValues(keyBy(tags, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={hideAllSchoolTypes}>
          <AiOutlineCloseCircle /> Hide all types
        </button>
      </p>
      {schoolTypes.map((schoolType) => (
        <div key={schoolType}>
          <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span 
              style={{ fontWeight: 'bold', cursor: 'pointer' }} 
              onClick={() => toggleSchoolTypeExpansion(schoolType)}
            >
              {expandedSchoolTypes[schoolType] ? <MdExpandLess /> : <MdExpandMore />} {schoolType}
            </span>
            {renderSchoolTypeToggleButton(schoolType)}
          </h3>
          {expandedSchoolTypes[schoolType] && (
            <ul>
              {(groupedTags[schoolType] || []).map(renderTag)}
            </ul>
          )}
        </div>
      ))}
    </Panel>
  );
};

export default TagsPanel;
