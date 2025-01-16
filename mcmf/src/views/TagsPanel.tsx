import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { useSigma } from "react-sigma-v2";
import { MdCategory, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaTag } from "react-icons/fa";
import { keyBy, mapValues, sortBy, values, groupBy } from "lodash";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Tag, FiltersState } from "../types";
import Panel from "./Panel";
import { applyFilters } from "../utils/filterUtils";

const TagsPanel: FC<{
  tags: Tag[];
  filters: FiltersState;
  toggleTag: (tag: string) => void;
  setTags: (tags: Record<string, boolean>) => void;
}> = ({ tags, filters, toggleTag, setTags }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

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
    applyFilters(graph, filters);
  }, [graph, filters]);

  useEffect(() => {
    const initialTags = mapValues(keyBy(tags, "key"), () => true);
    setTags(initialTags);
  }, []);

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

  return (
    <Panel title={<><MdCategory className="text-muted" /> Tags</>}>
      <p><i className="text-muted">Click tags to show/hide related pages from the network.</i></p>
      <p className="buttons">
        <button className="btn" onClick={() => setTags(mapValues(keyBy(tags, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setTags(mapValues(keyBy(tags, "key"), () => false))}>
          <AiOutlineCloseCircle /> Uncheck All
        </button>
      </p>
      <ul>
        {tags.map(renderTag)}
      </ul>
    </Panel>
  );
};

export default TagsPanel;
