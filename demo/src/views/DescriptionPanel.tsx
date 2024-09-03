import React, { FC } from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";

interface DescriptionPanelProps {
  selectedNode: string | null;
}

const DescriptionPanel: FC<DescriptionPanelProps> = ({ selectedNode }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  // Get the attributes of the selected node, if any
  const selectedNodeAttributes = selectedNode 
    ? graph.getNodeAttributes(selectedNode)
    : null;

  // Get connected nodes
  const connectedNodes = selectedNode
    ? graph.neighbors(selectedNode).map(nodeId => ({
        id: nodeId,
        label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      }))
    : [];

  return (
    <Panel
      initiallyDeployed
      title={
        <>
          <BsInfoCircle className="text-muted" /> Description
        </>
      }
    >
      <p>
       This network represents reported connections between K-12 Schools and Community Providers in the South Side STEM Asset Survey
      </p>
      <p>
        The network is based on STEM Landscape Asset Surveys conducted by {" "}
        <a target="_blank" rel="noreferrer" href="https://www.anl.gov/education/stem-opportunity-landscape-project/">
          Argonne National Laboratories
        </a>{" "}
         and {" "}
        <a target="_blank" rel="noreferrer" href="https://projectexploration.org/">
          Project Exploration
        </a>
       .
      </p>
      <p>
        This web application has been developed by{" "}
        <a target="_blank" rel="noreferrer" href="https://www.ouestware.com/en/">
          OuestWare
        </a>
        , using{" "}
        <a target="_blank" rel="noreferrer" href="https://reactjs.org/">
          react
        </a>{" "}
        and{" "}
        <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org">
          sigma.js
        </a>
        . You can read the source code{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/jacomyal/sigma.js/tree/main/demo">
          on GitHub
        </a>
        .
      </p>
      <p>
        Node sizes are related to their importance in the network. 
        Larger nodes indicate higher scores and potentially more significant entities in the STEM network.
      </p>

      {selectedNode && selectedNodeAttributes && (
        <div>
          <h3>Selected Node Information</h3>
          <p>Name: {selectedNodeAttributes.label || selectedNode}</p>
          <p>Score: {selectedNodeAttributes.score !== undefined ? selectedNodeAttributes.score.toFixed(2) : "N/A"}</p>
          
          <h4>Connected Nodes:</h4>
          {connectedNodes.length > 0 ? (
            <ul>
              {connectedNodes.map(node => (
                <li key={node.id}>{node.label}</li>
              ))}
            </ul>
          ) : (
            <p>No connected nodes</p>
          )}
        </div>
      )}

      <p>
        Nodes sizes are related to their{" "}
        <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Betweenness_centrality">
          betweenness centrality
        </a>
        . More central nodes (ie. bigger nodes) are important crossing points in the network. Finally, You can click a
        node to see the organization's website.
      </p>
    </Panel>
  );
};

export default DescriptionPanel;
