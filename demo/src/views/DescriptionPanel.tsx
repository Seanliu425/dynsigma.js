import React, { FC } from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";
import { useSigma } from "react-sigma-v2";

interface DescriptionPanelProps {
  selectedNode: string | null;
  showSecondDegree: boolean;
  setShowSecondDegree: React.Dispatch<React.SetStateAction<boolean>>;
}

const DescriptionPanel: FC<DescriptionPanelProps> = ({ 
  selectedNode, 
  showSecondDegree, 
  setShowSecondDegree 
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  // Get the attributes of the selected node, if any
  const selectedNodeAttributes = selectedNode 
    ? graph.getNodeAttributes(selectedNode)
    : null;

  // Get first-degree connections
  const firstDegreeConnections = selectedNode
    ? graph.neighbors(selectedNode).map(nodeId => ({
        id: nodeId,
        label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      }))
    : [];

  // Get second-degree connections
  const secondDegreeConnections = selectedNode
    ? Array.from(new Set(
        firstDegreeConnections.flatMap(node => 
          graph.neighbors(node.id).filter(n => n !== selectedNode && !firstDegreeConnections.some(fdc => fdc.id === n))
        )
      )).map(nodeId => ({
        id: nodeId,
        label: graph.getNodeAttribute(nodeId, "label") || nodeId,
      }))
    : [];

  const toggleSecondDegree = () => {
    setShowSecondDegree(!showSecondDegree);
  };

  return (
    <Panel
      title="About This App"
      initiallyDeployed={false}
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
