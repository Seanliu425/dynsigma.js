import Graph from "graphology";

export const checkSecondDegreeConnections = (graph: Graph) => {
  const nodeEdgeColors = new Map();

  graph.forEachNode((nodeKey) => {
    const nodeTag = graph.getNodeAttribute(nodeKey, "tag");
    const connectedNodes = graph.neighbors(nodeKey);
    let redEdges = 0;
    let totalEdges = connectedNodes.length;
    
    const nodeColors = new Map();

    connectedNodes.forEach(connectedNodeKey => {
      const secondDegreeNodes = graph.neighbors(connectedNodeKey);
      const hasMatchingSecondDegreeNode = secondDegreeNodes.some(secondDegreeNodeKey => 
        secondDegreeNodeKey !== nodeKey && 
        graph.getNodeAttribute(secondDegreeNodeKey, "tag") === nodeTag
      );
      
      const color = hasMatchingSecondDegreeNode ? "#66BB6A" : "#FF0000";
      nodeColors.set(connectedNodeKey, color);
      
      if (!hasMatchingSecondDegreeNode) {
        redEdges++;
      }
    });

    nodeEdgeColors.set(nodeKey, nodeColors);

    const linchpinScore = totalEdges > 0 ? redEdges / totalEdges : 0;
    graph.setNodeAttribute(nodeKey, "linchpinScore", linchpinScore);
  });

  return nodeEdgeColors;
};