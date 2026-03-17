import { useState, useCallback } from "react";
import type { HierarchyDatum, ZoomLevel, ZoomState } from "../types/bubble.js";

/**
 * Manages semantic zoom state: focus node, breadcrumb trail, and zoom level.
 *
 * Level 0 = modules, Level 1 = files, Level 2 = entities
 */
export function useSemanticZoom(root: HierarchyDatum) {
  const [state, setState] = useState<ZoomState>({
    level: 0,
    focusNode: null,
    breadcrumb: [],
  });

  const zoomIn = useCallback(
    (target: HierarchyDatum) => {
      // Only zoom if the target has children and we're not at max depth
      if (!target.children || target.children.length === 0) return;
      if (state.level >= 3) return;

      setState((prev) => ({
        level: Math.min(prev.level + 1, 3) as ZoomLevel,
        focusNode: target,
        breadcrumb: [...prev.breadcrumb, target],
      }));
    },
    [state.level],
  );

  const zoomOut = useCallback(() => {
    setState((prev) => {
      if (prev.breadcrumb.length === 0) return prev;

      const newBreadcrumb = prev.breadcrumb.slice(0, -1);
      return {
        level: Math.max(prev.level - 1, 0) as ZoomLevel,
        focusNode: newBreadcrumb[newBreadcrumb.length - 1] ?? null,
        breadcrumb: newBreadcrumb,
      };
    });
  }, []);

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0) {
        // Navigate to root
        setState({ level: 0, focusNode: null, breadcrumb: [] });
        return;
      }

      const newBreadcrumb = state.breadcrumb.slice(0, index + 1);
      setState({
        level: (index + 1) as ZoomLevel,
        focusNode: newBreadcrumb[newBreadcrumb.length - 1] ?? null,
        breadcrumb: newBreadcrumb,
      });
    },
    [state.breadcrumb],
  );

  /** Find the HierarchyDatum for a given bubble id by searching the tree */
  const findNode = useCallback(
    (id: string): HierarchyDatum | null => {
      function search(node: HierarchyDatum): HierarchyDatum | null {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = search(child);
            if (found) return found;
          }
        }
        return null;
      }
      return search(root);
    },
    [root],
  );

  return {
    ...state,
    zoomIn,
    zoomOut,
    navigateTo,
    findNode,
  };
}
