import React, { FC, useEffect, useState } from "react";
import { SigmaContainer, ZoomControl, FullScreenControl } from "react-sigma-v2";
import { omit, mapValues, keyBy, constant } from "lodash";

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
import YearFilter from "./YearFilter";

import "react-sigma-v2/lib/react-sigma-v2.css";
import { GrClose } from "react-icons/gr";
import { BiRadioCircleMarked, BiBookContent } from "react-icons/bi";
import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from "react-icons/bs";

const GraphPage: FC = () => {
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    clusters: {
      "food.": true,
      "digital media": true,
      "building and fixing things": true,
      "learning as a lifestyle": true,
      "music & art.": true,
      "helping your community": true,
      "reading & writing": true,
      "performance": true,
      "science & math": true,
      "computers": true,
      "nature": true,
      "sports & wellness": true,
      "social studies": true,
      "managing money": true
    },
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
  const [nodeSizingMode, setNodeSizingMode] = useState<'linchpin' | 'score'>('linchpin');
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [selectedYears, setSelectedYears] = useState<string[]>(() => {
    const years = [
      "2024", "2023", "2022", "2021", "2020", "2019", 
      "2018", "2017", "2016", "2015", "2014"
    ];
    console.log("Initializing selectedYears:", years);
    return years;
  });

  // Load data on mount:
  useEffect(() => {
    console.log("Starting data fetch...");
    fetch("./data.json")
      .then((res) => res.json())
      .then((dataset: Dataset) => {
        console.log("Data loaded, setting years...");
        setDataset(dataset);
        setFiltersState({
          clusters: mapValues(keyBy(dataset.clusters, "key"), constant(true)),
          tags: mapValues(keyBy(dataset.tags, "key"), constant(true)),
          communities: mapValues(keyBy(dataset.communities, "key"), constant(true)),
          networkAttribute: "tag"
        });
        // Explicitly set all years when data loads
        const allYears = [
          "2024", "2023", "2022", "2021", "2020", "2019", 
          "2018", "2017", "2016", "2015", "2014"
        ];
        console.log("Setting selectedYears to:", allYears);
        setSelectedYears(allYears);
        requestAnimationFrame(() => setDataReady(true));
      });
  }, []);

  // Add effect to track selectedYears changes
  useEffect(() => {
    console.log("selectedYears changed to:", selectedYears);
  }, [selectedYears]);

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
            <p style={{ fontSize: '1.2em' }}>Please Start by Searching for Your Program</p>
          </div>
        </div>
      )}
      <SigmaContainer
        graphOptions={{ type: "undirected" }}
        initialSettings={{
          nodeProgramClasses: { image: getNodeProgramImage() },
          labelRenderer: drawLabel,
          defaultNodeType: "image",
          defaultEdgeType: "line",
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
          showCommunity={showCommunity}
          onLinchpinScoreCalculated={(score) => {/* Handle score if needed */}}
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
          selectedYears={selectedYears}
          showAllConnections={showAllConnections}
          selectedNode={selectedNode}
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
                <YearFilter 
                  selectedYears={selectedYears}
                  setSelectedYears={setSelectedYears}
                />
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
                  showCommunity={showCommunity}
                  setShowCommunity={setShowCommunity}
                  showHealthZone={showHealthZone}
                  setShowHealthZone={setShowHealthZone}
                  showSchoolType={showSchoolType}
                  setShowSchoolType={setShowSchoolType}
                  nodeSizingMode={nodeSizingMode}
                  setNodeSizingMode={setNodeSizingMode}
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
                
              </div>
            </div>
          </>
        )}
      </SigmaContainer>
    </div>
  );
};

export default GraphPage;
