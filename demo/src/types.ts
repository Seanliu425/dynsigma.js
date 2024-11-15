export interface NodeData {
  key: string;
  label: string;
  cluster: string;
  tag: string;
  community: string;
  score: number;
  // Add these new properties:
  healthzone?: string;
  schooltype?: string;
}

export interface Cluster {
  key: string;
  color: string;
  clusterLabel: string;
}

export interface Tag {
  key: string;
  image: string;
}

// Add a new interface for Community
export interface Community {
  key: string;
  image?: string;  // Make this optional if communities don't always have images
}

export interface Dataset {
  nodes: NodeData[];
  edges: [string, string][];
  clusters: Cluster[];
  tags: Tag[];
  communities?: Community[];  // Add this optional field for communities
}

export interface FiltersState {
  clusters: Record<string, boolean>;
  tags: Record<string, boolean>;
  communities: Record<string, boolean>;
  networkAttribute: "tag" | "community";
}

export interface Node extends NodeData {
  secondDegreeConnections: Array<{
    connectedNode: string;
    matchingSecondDegreeNodes: string[];
  }>;
}

// Add this type
export type NodeSizingMode = 'linchpin' | 'score';
