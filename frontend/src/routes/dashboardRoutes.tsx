import { LoginPage } from "@/pages/dashboard/LoginPage";
import { ForgotPasswordPage } from "@/pages/dashboard/ForgotPasswordPage";
import type { RouteObject } from "./types";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { UsersManagementPage } from "@/pages/dashboard/UsersManagementPage";
import { PatientsManagementPage } from "@/pages/dashboard/PatientsManagementPage";
import { ReadingsManagementPage } from "@/pages/dashboard/ReadingsManagementPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { AuditLogPage } from "@/pages/dashboard/AuditLogPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { StatisticsPage } from "@/pages/dashboard/StatisticsPage";
import { NotificationsPage } from "@/pages/dashboard/NotificationsPage";
import { SupportPage } from "@/pages/dashboard/SupportPage";
import { AdvancedSearchPage } from "@/pages/dashboard/AdvancedSearchPage";
import { TwoFactorSetupPage } from "@/pages/dashboard/TwoFactorSetupPage";
import { UserDetailView } from "@/components/dashboard/views/UserDetailView";
import { PatientDetailView } from "@/components/dashboard/views/PatientDetailView";
import { ScheduledReadingsPage } from "@/pages/dashboard/ScheduledReadingsPage";

export const dashboardRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/dashboard/users",
    element: <UsersManagementPage />,
  },
  {
    path: "/dashboard/users/:id",
    element: <UserDetailView />,
  },
  {
    path: "/dashboard/patients",
    element: <PatientsManagementPage />,
  },
  {
    path: "/dashboard/patients/:id",
    element: <PatientDetailView />,
  },
  {
    path: "/dashboard/readings",
    element: <ReadingsManagementPage />,
  },
  {
    path: "/dashboard/reports",
    element: <ReportsPage />,
  },
  {
    path: "/dashboard/statistics",
    element: <StatisticsPage />,
  },
  {
    path: "/dashboard/audit-log",
    element: <AuditLogPage />,
  },
  {
    path: "/dashboard/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "/dashboard/settings",
    element: <SettingsPage />,
  },
  {
    path: "/dashboard/support",
    element: <SupportPage />,
  },
  {
    path: "/dashboard/search",
    element: <AdvancedSearchPage />,
  },
  {
    path: "/dashboard/scheduled-readings",
    element: <ScheduledReadingsPage />,
  },
  {
    path: "/dashboard/settings/two-factor",
    element: <TwoFactorSetupPage />,
  },
];
