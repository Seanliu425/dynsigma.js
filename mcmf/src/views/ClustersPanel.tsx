import React, { FC, useEffect, useMemo } from "react";
import { useSigma } from "react-sigma-v2";
import { sortBy, values, keyBy, mapValues } from "lodash";
import { MdGroupWork } from "react-icons/md";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

import { Cluster, FiltersState } from "../types";
import Panel from "./Panel";
import { applyFilters } from "../utils/filterUtils";
import { NodeAttributes } from "./GraphDataController";

const ClustersPanel: FC<{
  clusters: Cluster[];
  filters: FiltersState;
  toggleCluster: (cluster: string) => void;
  setClusters: (clusters: Record<string, boolean>) => void;
}> = ({ clusters, filters, toggleCluster, setClusters }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const nodesPerCluster = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, attrs: Partial<NodeAttributes>) => {
      const clusters = Array.isArray(attrs.clusters) ? attrs.clusters : [attrs.cluster as string];
      clusters.forEach((cluster: string) => {
        index[cluster] = (index[cluster] || 0) + 1;
      });
    });
    return index;
  }, []);

  const maxNodesPerCluster = useMemo(() => Math.max(...values(nodesPerCluster)), [nodesPerCluster]);
  const visibleClustersCount = useMemo(() => Object.keys(filters.clusters).length, [filters]);

  const visibleNodesPerCluster = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, attrs: Partial<NodeAttributes>) => {
      const clusters = Array.isArray(attrs.clusters) ? attrs.clusters : [attrs.cluster as string];
      if (!attrs.hidden) {
        clusters.forEach((cluster: string) => {
          if (filters.clusters[cluster]) {
            index[cluster] = (index[cluster] || 0) + 1;
          }
        });
      }
    });
    return index;
  }, [filters.clusters, graph]);

  const sortedClusters = useMemo(
    () => sortBy(clusters, (cluster) => -nodesPerCluster[cluster.key])
      .filter(cluster => cluster.key !== "School"),
    [clusters, nodesPerCluster],
  );

  useEffect(() => {
    applyFilters(graph, filters);
  }, [graph, filters]);

  return (
    <Panel
      title={
        <>
          <MdGroupWork className="text-muted" /> Provider Type
          {visibleClustersCount < clusters.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleClustersCount} / {clusters.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a cluster to show/hide related pages from the network.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setClusters(mapValues(keyBy(clusters, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setClusters(mapValues(keyBy(clusters, "key"), (cluster) => cluster.key === "School"))}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedClusters.map((cluster) => {
          const nodesCount = nodesPerCluster[cluster.key];
          const isVisible = filters.clusters[cluster.key] || false;
          const visibleNodesCount = isVisible ? (visibleNodesPerCluster[cluster.key] || 0) : 0;
          return (
            <li
              className="caption-row"
              key={cluster.key}
              title={`${nodesCount} node${nodesCount > 1 ? "s" : ""}${
                !isVisible ? " (currently hidden)" : visibleNodesCount !== nodesCount ? ` (only ${visibleNodesCount} visible)` : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleCluster(cluster.key)}
                id={`cluster-${cluster.key}`}
              />
              <label htmlFor={`cluster-${cluster.key}`}>
                <span className="circle" style={{ background: cluster.color, borderColor: cluster.color }} />{" "}
                <div className="node-label">
                  <span>{cluster.clusterLabel}</span>
                  <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerCluster + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: isVisible ? (100 * visibleNodesCount) / nodesCount + "%" : "0%",
                        transition: "width 0.3s ease-out",
                      }}
                    />
                  </div>
                </div>
                <div className="text-muted text-small">
                  ({visibleNodesCount}/{nodesCount})
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

export default ClustersPanel;
