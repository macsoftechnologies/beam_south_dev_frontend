const iconMenu = [
    {
        name: "Dashboard",
        type: "dropDown",
        tooltip: "Dashboard",
        icon: "dashboard",
        state: "",
        sub: [
            { name: "Operations Dashboard", state: "user/dashboard" },
            { name: "Executive Dashboard", state: "user/executive-dashboard" },
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
            { name: "Floors", state: "location/floors", icon: "add_box" },
            { name: "Zones", state: "location/zones", icon: "add_box" },
            { name: "Rooms", state: "location/rooms", icon: "add_box" },
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
            { name: "New Request", state: "user/new-request", icon: "add_box" },
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
            { name: "Executive Dashboard", state: "user/executive-dashboard" },
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
            { name: "Floors", state: "location/floors", icon: "add_box" },
            { name: "Zones", state: "location/zones", icon: "add_box" },
            { name: "Rooms", state: "location/rooms", icon: "add_box" },
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
            { name: "New Request", state: "user/new-request", icon: "add_box" },
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
            { name: "Activity", state: "admin/activity-list", icon: "list" },
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
            { name: "New Request", state: "user/new-request", icon: "add_box" },
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
            { name: "New Request", state: "user/new-request", icon: "add_box" },
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
            { name: "New Request", state: "user/new-request", icon: "add_box" },
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

export function getMenuByRole(role) {
    const activeType = localStorage.getItem("UserType");
    const targetRole = activeType || role;
    let roles = [];
    if (typeof targetRole === 'string') {
        roles = targetRole.split(',').map(r => r.trim());
    } else if (Array.isArray(targetRole)) {
        roles = targetRole;
    } else if (targetRole) {
        roles = [targetRole];
    }
    const has = (r) => roles.some(x => String(x).toLowerCase() === String(r).toLowerCase());

    if (has("Observer")) return ObservericonMenu;
    if (has("Admin") || has("SuperAdmin")) return AdminiconMenu;
    if (has("Department1") || has("Operator1") || has("C&Q") || has("COMM")) return Operator1iconMenu;
    if (has("Department") || has("Operator") || has("ConM") || has("HSE")) return OperatoriconMenu;
    if (has("Subcontractor") || has("Contractor")) return UsericonMenu;

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