import { LandingPage } from "@/pages/landing/LandingPage";
import type { RouteObject } from "./types";

export const landingRoutes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
];
