import React from "react";
import { BsInfoCircle } from "react-icons/bs";
import Panel from "./Panel";

const HowTo: React.FC = () => {
  const infoIconStyle = {
    marginRight: '8px',
    verticalAlign: 'middle',
  };

  return (
    <Panel
      title={
        <>
          <BsInfoCircle className="text-muted" /> How To Use This App
        </>
      }
      initiallyDeployed={false}
    >
      <div>
        <p>
        The goal of this app is to explore <strong>network vulnerabities</strong> within the CPS Out-of-School (OST) Provider Ecosystem.
        </p>

        <p>
          For any given provider type, the network checks to see if the corresponding school is connected to any other providers of that type. 

        </p>
        <p>
        If it is, it is given a green link, meaning that if the provider were to dissolve, the school would still have access to that type of provider.
        </p>
        <p>
        If there is no such connection, a red link is given, indicating a network vulnerability

        </p>

        <p>
          To see what other providers each school is connected to, you can click the <strong> Show Second-Degree Connections </strong> button.
        </p>
        <p>
          To see why an edge is green, you can click <strong> Show Similar Providers </strong> to see the providers that also provide the same attribute to that school.
        </p>
        <p>
          The resulting <strong>"Linchpin Score"</strong> represents the ratio of non-fortified (red) edges compared to the total number of edges for a given provider
        </p>
      </div>
    </Panel>
  );
};

export default HowTo;