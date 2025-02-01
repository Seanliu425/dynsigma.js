import React from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";

const DescriptionPanel: React.FC = () => {
  const infoIconStyle = {
    marginRight: '8px',
    verticalAlign: 'middle',
  };

  return (
    <Panel
      title={
        <>
          <BsInfoCircle className="text-muted" /> About This App
        </>
      }
      initiallyDeployed={false}
    >
      <div>

        <p>
         This Network represents school and provider collaboration data from Chicago Public Schools.
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

      </div>
    </Panel>
  );
};

export default DescriptionPanel;