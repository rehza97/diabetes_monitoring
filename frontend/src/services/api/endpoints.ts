// API endpoints configuration

export const endpoints = {
  // Auth
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // Users
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
    create: "/users",
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  // Patients
  patients: {
    list: "/patients",
    detail: (id: string) => `/patients/${id}`,
    create: "/patients",
    update: (id: string) => `/patients/${id}`,
    delete: (id: string) => `/patients/${id}`,
    export: "/patients/export",
    import: "/patients/import",
  },

  // Readings
  readings: {
    list: "/readings",
    detail: (id: string) => `/readings/${id}`,
    create: "/readings",
    update: (id: string) => `/readings/${id}`,
    delete: (id: string) => `/readings/${id}`,
    byPatient: (patientId: string) => `/readings/patient/${patientId}`,
  },

  // Reports
  reports: {
    list: "/reports",
    detail: (id: string) => `/reports/${id}`,
    create: "/reports",
    update: (id: string) => `/reports/${id}`,
    delete: (id: string) => `/reports/${id}`,
    generate: (id: string) => `/reports/${id}/generate`,
    export: (id: string, format: string) => `/reports/${id}/export?format=${format}`,
  },

  // Statistics
  statistics: {
    dashboard: "/statistics/dashboard",
    patients: "/statistics/patients",
    readings: "/statistics/readings",
    users: "/statistics/users",
  },

  // Audit
  audit: {
    list: "/audit-logs",
    detail: (id: string) => `/audit-logs/${id}`,
  },

  // Settings
  settings: {
    get: "/settings",
    update: "/settings",
  },
} as const;
