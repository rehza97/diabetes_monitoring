import { createBrowserRouter } from "react-router-dom";
import { landingRoutes } from "./landingRoutes";
import { dashboardRoutes } from "./dashboardRoutes";

export const router = createBrowserRouter([
  ...landingRoutes,
  ...dashboardRoutes,
]);
