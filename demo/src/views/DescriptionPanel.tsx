import React from "react";
import Panel from "./Panel";

const DescriptionPanel: React.FC = () => {
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
        Node sizes are related to their{" "}
        <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Betweenness_centrality">
          betweenness centrality
        </a>
        . Larger nodes indicate higher scores and are important crossing points in the network, potentially representing more significant entities in the STEM ecosystem. You can click a node to see the organization's website.
      </p>
    </Panel>
  );
};

export default DescriptionPanel;