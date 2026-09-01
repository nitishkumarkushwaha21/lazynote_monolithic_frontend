export function findTreeNode(nodes, targetId) {
  for (const node of nodes) {
    if (String(node.id) === String(targetId)) {
      return node;
    }

    if (node.children?.length) {
      const found = findTreeNode(node.children, targetId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function updateTreeNode(nodes, targetId, updater) {
  return nodes.map((node) => {
    if (String(node.id) === String(targetId)) {
      return updater(node);
    }

    if (node.children?.length) {
      return {
        ...node,
        children: updateTreeNode(node.children, targetId, updater),
      };
    }

    return node;
  });
}

export function removeTreeNode(nodes, targetId) {
  return nodes
    .filter((node) => String(node.id) !== String(targetId))
    .map((node) => {
      if (!node.children?.length) {
        return node;
      }

      return {
        ...node,
        children: removeTreeNode(node.children, targetId),
      };
    });
}
