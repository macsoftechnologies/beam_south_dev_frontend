// ════════════════════════════════════════════════════════
//  navigation.service.js
//  Role-based PTW menus + standalone IM & SO module menus
// ════════════════════════════════════════════════════════

// ── PERMIT TO WORK: role-based menus ────────────────────

const iconMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
            { name: "Executive Dashboard",  state: "user/executive-dashboard" },
        ],
    },
    {
        name: "Departments",
        type: "link",
        tooltip: "Departments",
        icon: "event",
        state: "admin/listdepartment",
    },
    {
        name: "Subcontractors",
        type: "link",
        tooltip: "Subcontractors",
        icon: "event",
        state: "admin/subcontractors-list",
    },
    {
        name: "Employees",
        type: "link",
        tooltip: "Employees",
        icon: "event",
        state: "admin/listemployee",
    },
    {
        name: "Location",
        type: "dropDown",
        tooltip: "Location",
        icon: "event",
        state: "",
        sub: [
            { name: "Buildings", state: "location/buildings", icon: "add_box" },
            { name: "Floors",    state: "location/floors",    icon: "add_box" },
            { name: "Zones",     state: "location/zones",     icon: "add_box" },
            { name: "Rooms",     state: "location/rooms",     icon: "add_box" },
        ],
    },
    {
        name: "Electrical Works",
        type: "link",
        tooltip: "Electrical Works",
        icon: "event",
        state: "admin/list-electricalworks",
    },
    {
        name: "Mechanical Works",
        type: "link",
        tooltip: "Mechanical Works",
        icon: "event",
        state: "admin/list-mechanicalworks",
    },
    {
        name: "Teams",
        type: "dropDown",
        tooltip: "Team",
        icon: "event",
        state: "",
        sub: [
            { name: "List Teams", state: "admin/list-team", icon: "list" },
        ],
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "New Request",  state: "user/new-request", icon: "add_box" },
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
];

const AdminiconMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
            { name: "Executive Dashboard",  state: "user/executive-dashboard" },
        ],
    },
    {
        name: "Departments",
        type: "link",
        tooltip: "Departments",
        icon: "event",
        state: "admin/listdepartment",
    },
    {
        name: "Contractors",
        type: "link",
        tooltip: "Contractors",
        icon: "event",
        state: "admin/subcontractors-list",
    },
    {
        name: "Employees",
        type: "link",
        tooltip: "Employees",
        icon: "event",
        state: "admin/listemployee",
    },
    {
        name: "Location",
        type: "dropDown",
        tooltip: "Location",
        icon: "event",
        state: "",
        sub: [
            { name: "Buildings", state: "location/buildings", icon: "add_box" },
            { name: "Floors",    state: "location/floors",    icon: "add_box" },
            { name: "Zones",     state: "location/zones",     icon: "add_box" },
            { name: "Rooms",     state: "location/rooms",     icon: "add_box" },
        ],
    },
    {
        name: "Electrical Works",
        type: "link",
        tooltip: "Electrical Works",
        icon: "event",
        state: "user/list-electricalworks",
    },
    {
        name: "Mechanical Works",
        type: "link",
        tooltip: "Mechanical Works",
        icon: "event",
        state: "user/list-mechanicalworks",
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "New Request",  state: "user/new-request", icon: "add_box" },
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
    {
        name: "Settings",
        type: "dropDown",
        tooltip: "Settings",
        icon: "settings",
        state: "",
        sub: [
            { name: "Activity",          state: "admin/activity-list",           icon: "list" },
            { name: "Safety Precaution", state: "admin/safety-precautions-list", icon: "list" },
        ],
    },
    {
        name: "Log-History",
        type: "link",
        tooltip: "Log History",
        icon: "history",
        state: "user/log-history",
    },
    {
        name: "Logs-Reports",
        type: "link",
        tooltip: "Logs Reports",
        icon: "assignment",
        state: "user/log-reports",
    },
];

const UsericonMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
        ],
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "New Request",  state: "user/new-request", icon: "add_box" },
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
];

const OperatoriconMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
        ],
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "New Request",  state: "user/new-request", icon: "add_box" },
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
    {
        name: "Log-History",
        type: "link",
        tooltip: "Log History",
        icon: "history",
        state: "user/log-history",
    },
];

const Operator1iconMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
        ],
    },
    {
        name: "Electrical Works",
        type: "link",
        tooltip: "Electrical Works",
        icon: "event",
        state: "user/list-electricalworks",
    },
    {
        name: "Mechanical Works",
        type: "link",
        tooltip: "Mechanical Works",
        icon: "event",
        state: "user/list-mechanicalworks",
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "New Request",  state: "user/new-request", icon: "add_box" },
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
    {
        name: "Log-History",
        type: "link",
        tooltip: "Log History",
        icon: "history",
        state: "user/log-history",
    },
];

const ObservericonMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
        ],
    },
    {
        name: "Request",
        type: "dropDown",
        tooltip: "Request",
        icon: "person",
        state: "",
        sub: [
            { name: "List Request", state: "user/list-request", icon: "list" },
        ],
    },
    {
        name: "Reports",
        type: "link",
        tooltip: "Reports",
        icon: "event",
        state: "user/plans",
    },
];

// ── INCIDENT MANAGEMENT: standalone sidebar menu ─────────
export const imNavigationMenu = [
    {
        name: "Dashboard",
        type: "link",
        tooltip: "IM Dashboard",
        icon: "ti-layout-dashboard",
        state: "incident-management/dashboard",
    },
    {
        name: "Incidents",
        type: "link",
        tooltip: "All Incidents",
        icon: "ti-list",
        state: "incident-management/list",
    },
];

export const soNavigationMenu = [
    {
        name: "Dashboard",
        type: "link",
        tooltip: "SO Dashboard",
        icon: "ti-layout-dashboard",
        state: "safety-observations/dashboard",
    },
    {
        name: "Observations",
        type: "link",
        tooltip: "All Observations",
        icon: "ti-list",
        state: "safety-observations/list",
    },
    {
        name: "Corrective Actions",
        type: "link",
        tooltip: "Corrective Actions",
        icon: "ti-checkbox",
        state: "safety-observations/corrective-actions",
    },
];

// ── Role resolver ────────────────────────────────────────
export function getMenuByRole(role) {
    let roles = [];
    if (typeof role === 'string') {
        roles = role.split(',').map(r => r.trim());
    } else if (Array.isArray(role)) {
        roles = role;
    } else if (role) {
        roles = [role];
    }
    const has = (r) => roles.includes(r);

    if (has("Subcontractor")) return UsericonMenu;
    if (has("Admin"))         return AdminiconMenu;
    if (has("Department1"))   return Operator1iconMenu;
    if (has("Department"))    return OperatoriconMenu;
    if (has("Observer"))      return ObservericonMenu;

    return [];
}

export {
    iconMenu,
    AdminiconMenu,
    UsericonMenu,
    OperatoriconMenu,
    Operator1iconMenu,
    ObservericonMenu,
};