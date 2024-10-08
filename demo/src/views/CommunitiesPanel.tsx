import React, { FC, useEffect, useMemo, useState } from "react";
import { useSigma } from "react-sigma-v2";
import { MdCategory } from "react-icons/md";
import { keyBy, mapValues, sortBy, values } from "lodash";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Community, FiltersState } from "../types";
import Panel from "./Panel";

const CommunitiesPanel: FC<{
  communities: Community[];
  filters: FiltersState;
  toggleCommunity: (community: string) => void;
  setCommunities: (communities: Record<string, boolean>) => void;
}> = ({ communities, filters, toggleCommunity, setCommunities }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const nodesPerCommunity = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, { tag }) => (index[tag] = (index[tag] || 0) + 1));
    return index;
  }, []);

  const maxNodesPerCommunity = useMemo(() => Math.max(...values(nodesPerCommunity)), [nodesPerCommunity]);
  const visibleCommunitiesCount = useMemo(() => Object.keys(filters.communities).length, [filters]);

  const [visibleNodesPerCommunity, setVisibleNodesPerCommunity] = useState<Record<string, number>>(nodesPerCommunity);
  useEffect(() => {
    // To ensure the graphology instance has up to data "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, { community, hidden }) => !hidden && (index[community] = (index[community] || 0) + 1));
      setVisibleNodesPerCommunity(index);
    });
  }, [filters]);

  const sortedCommunities = useMemo(
    () => sortBy(communities, (community) => (community.key === "unknown" ? Infinity : -nodesPerCommunity[community.key])),
    [communities, nodesPerCommunity],
  );

  return (
    <Panel
      title={
        <>
          <MdCategory className="text-muted" /> School Community
          {visibleCommunitiesCount < communities.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleCommunitiesCount} / {communities.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a category to show/hide related pages from the network.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setCommunities(mapValues(keyBy(communities, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setCommunities({})}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedCommunities.map((community: Community) => {
          const nodesCount = nodesPerCommunity[community.key];
          const visibleNodesCount = visibleNodesPerCommunity[community.key] || 0;
          return (
            <li
              className="caption-row"
              key={community.key}
              title={`${nodesCount} page${nodesCount > 1 ? "s" : ""}${
                visibleNodesCount !== nodesCount ? ` (only ${visibleNodesCount} visible)` : ""
              }`}
            >
              <input
                type="checkbox"
                checked={filters.communities[community.key] || false}
                onChange={() => toggleCommunity(community.key)}
                id={`community-${community.key}`}
              />
              <label htmlFor={`community-${community.key}`}>
                <span
                  className="circle"
                  style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/${community.image})` }}
                />{" "}
                <div className="node-label">
                  <span>{community.key}</span>
                  <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerCommunity + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: (100 * visibleNodesCount) / nodesCount + "%",
                      }}
                    />
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

export default CommunitiesPanel;
