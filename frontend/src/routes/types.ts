import type { ReactNode } from "react";

export type RouteObject = {
  path: string;
  element: ReactNode;
  children?: RouteObject[];
};
