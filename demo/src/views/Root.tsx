import React, { FC, useEffect, useState } from "react";
import { SigmaContainer, ZoomControl, FullScreenControl } from "react-sigma-v2";
import { omit, mapValues, keyBy, constant } from "lodash";
import { useSearchParams } from 'react-router-dom';

import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";

import GraphSettingsController from "./GraphSettingsController";
import GraphEventsController from "./GraphEventsController";
import GraphDataController from "./GraphDataController";
import DescriptionPanel from "./DescriptionPanel";
import SecondDescriptionPanel from "./SecondDescriptionPanel";
import { Dataset, FiltersState } from "../types";
import ClustersPanel from "./ClustersPanel";
import SearchField from "./SearchField";
import drawLabel from "../canvas-utils";
import GraphTitle from "./GraphTitle";
import TagsPanel from "./TagsPanel";
import HowTo from "./HowTo";
import CommunitiesPanel from "./CommunitiesPanel";
import YearFilter from "./YearFilter";

import "react-sigma-v2/lib/react-sigma-v2.css";
import { GrClose } from "react-icons/gr";
import { BiRadioCircleMarked, BiBookContent } from "react-icons/bi";
import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from "react-icons/bs";

type NodeSizingMode = 'linchpin' | 'score';

const Root: FC = () => {
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    clusters: {},
    tags: {},
    communities: {},
    networkAttribute: "tag"
  });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [clickedNode, setClickedNode] = useState<string | null>(null);
  const [showSecondDegree, setShowSecondDegree] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [showCluster, setShowCluster] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showHealthZone, setShowHealthZone] = useState(false);
  const [showSchoolType, setShowSchoolType] = useState(false);
  const [nodeSizingMode, setNodeSizingMode] = useState<NodeSizingMode>('linchpin');

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [selectedYears, setSelectedYears] = useState<string[]>(["2024", "2023", "2022", "2021"]);

  // Load data on mount:
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/dataset.json`)
      .then((res) => res.json())
      .then((dataset: Dataset) => {
        setDataset(dataset);
        setFiltersState({
          clusters: mapValues(keyBy(dataset.clusters, "key"), constant(true)),
          tags: mapValues(keyBy(dataset.tags, "key"), constant(true)),
          communities: mapValues(keyBy(dataset.communities, "key"), constant(true)),
          networkAttribute: "tag"
        });
        
        // Handle URL parameters after data is loaded
        const nodeId = searchParams.get("node");
        const view = searchParams.get("view");
        
        // Set overlay visibility based on URL parameters
        if (nodeId || view) {
          setOverlayVisible(false);
        }
        
        if (nodeId) {
          setClickedNode(nodeId);
        }
        
        if (view) {
          setShowSecondDegree(false);
          setShowCluster(false);
          setShowCommunity(false);
          setShowHealthZone(false);
          setShowSchoolType(false);

          switch (view) {
            case "secondDegree":
              setShowSecondDegree(true);
              break;
            case "cluster":
              setShowCluster(true);
              break;
            case "community":
              setShowCommunity(true);
              break;
            case "healthZone":
              setShowHealthZone(true);
              break;
            case "schoolType":
              setShowSchoolType(true);
              break;
          }
        }

        requestAnimationFrame(() => setDataReady(true));
      });
  }, []);

  useEffect(() => {
    // Reset showSecondDegree, showCluster, and showCommunity when a new node is clicked
    if (clickedNode !== null) {
      setShowSecondDegree(false);
      setShowCluster(false);
      setShowCommunity(false);
    }
  }, [clickedNode]);

  // Effect for updating URL when node is clicked
  useEffect(() => {
    if (clickedNode) {
      setSearchParams({ node: clickedNode });
    } else {
      setSearchParams({});
    }
  }, [clickedNode, setSearchParams]);

  // Effect for updating URL when visualization changes
  useEffect(() => {
    if (!clickedNode) return;

    const params: { node: string; view?: string } = { node: clickedNode };
    
    if (showSecondDegree) params.view = "secondDegree";
    else if (showCluster) params.view = "cluster";
    else if (showCommunity) params.view = "community";
    else if (showHealthZone) params.view = "healthZone";
    else if (showSchoolType) params.view = "schoolType";

    setSearchParams(params);
  }, [
    clickedNode,
    showSecondDegree,
    showCluster,
    showCommunity,
    showHealthZone,
    showSchoolType,
    setSearchParams
  ]);

  if (!dataset) return null;

  return (
    <div id="app-root" className={showContents ? "show-contents" : ""}>
      {overlayVisible && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
          onClick={() => setOverlayVisible(false)}
        >
          <div style={{
            color: 'white',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '2.5em', marginBottom: '0.5em' }}>Visualizing Your Social Network</h2>
            <p style={{ fontSize: '1.2em' }}>Please start by exploring the "How To" Panel</p>
          </div>
        </div>
      )}
      <SigmaContainer
        graphOptions={{ type: "directed" }}
        initialSettings={{
          nodeProgramClasses: { image: getNodeProgramImage() },
          labelRenderer: drawLabel,
          defaultNodeType: "image",
          defaultEdgeType: "arrow",
          labelDensity: 0.07,
          labelGridCellSize: 60,
          labelRenderedSizeThreshold: 15,
          labelFont: "Lato, sans-serif",
          zIndex: true,
        }}
        className="react-sigma"
      >
        <GraphSettingsController 
          hoveredNode={hoveredNode} 
          clickedNode={clickedNode}
          showSecondDegree={showSecondDegree}
          showCluster={showCluster}
          showCommunity={showCommunity}  // Add this line
        />
        <GraphEventsController 
          setHoveredNode={setHoveredNode}
          setClickedNode={setClickedNode}
          interactionsEnabled={!overlayVisible}
        />
        <GraphDataController 
          dataset={dataset} 
          filters={filtersState}
          nodeSizingMode={nodeSizingMode}
          selectedYear={selectedYear}
          selectedYears={selectedYears}
        />

        {dataReady && (
          <>
            <div className="controls">
              <div className="ico">
                <button
                  type="button"
                  className="show-contents"
                  onClick={() => setShowContents(true)}
                  title="Show caption and description"
                >
                  <BiBookContent />
                </button>
              </div>
              <FullScreenControl
                className="ico"
                customEnterFullScreen={<BsArrowsFullscreen />}
                customExitFullScreen={<BsFullscreenExit />}
              />
              <ZoomControl
                className="ico"
                customZoomIn={<BsZoomIn />}
                customZoomOut={<BsZoomOut />}
                customZoomCenter={<BiRadioCircleMarked />}
              />
            </div>
            <div className="contents">
              <div className="ico">
                <button
                  type="button"
                  className="ico hide-contents"
                  onClick={() => setShowContents(false)}
                  title="Show caption and description"
                >
                  <GrClose />
                </button>
              </div>
              <GraphTitle filters={filtersState} />
              <div className="panels">
                <SearchField 
                  filters={filtersState}
                  setClickedNode={setClickedNode}
                />
                <SecondDescriptionPanel 
                  clickedNode={clickedNode}
                  showSecondDegree={showSecondDegree}
                  setShowSecondDegree={setShowSecondDegree}
                  showCluster={showCluster}
                  setShowCluster={setShowCluster}
                  showCommunity={showCommunity}  // Add this line
                  setShowCommunity={setShowCommunity}  // Add this line
                  showHealthZone={showHealthZone}
                  setShowHealthZone={setShowHealthZone}
                  showSchoolType={showSchoolType}
                  setShowSchoolType={setShowSchoolType}
                  nodeSizingMode={nodeSizingMode}
                  setNodeSizingMode={setNodeSizingMode}
                />
                <YearFilter 
                  selectedYears={selectedYears}
                  setSelectedYears={setSelectedYears}
                />
                <ClustersPanel
                  clusters={dataset.clusters}
                  filters={filtersState}
                  setClusters={(clusters) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters,
                    }))
                  }
                  toggleCluster={(cluster) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters: filters.clusters[cluster]
                        ? omit(filters.clusters, cluster)
                        : { ...filters.clusters, [cluster]: true },
                    }));
                  }}
                />
                <TagsPanel
                  tags={dataset.tags}
                  filters={filtersState}
                  setTags={(tags) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      tags,
                    }))
                  }
                  toggleTag={(tag) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      tags: filters.tags[tag] ? omit(filters.tags, tag) : { ...filters.tags, [tag]: true },
                    }));
                  }}
                />
                <CommunitiesPanel
                  communities={dataset?.communities || []}
                  filters={filtersState}
                  setCommunities={(communities) =>
                    setFiltersState((prev) => ({ ...prev, communities }))
                  }
                  toggleCommunity={(community) =>
                    setFiltersState((prev) => ({
                      ...prev,
                      communities: {
                        ...prev.communities,
                        [community]: !prev.communities[community],
                      },
                    }))
                  }
                />

                <HowTo />
                <DescriptionPanel />
              </div>
            </div>
          </>
        )}
      </SigmaContainer>
    </div>
  );
};

export default Root;
