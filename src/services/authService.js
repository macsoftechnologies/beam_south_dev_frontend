import api from "./api";

// ---------------- Admin APIs ----------------
export const login = async (loginData) => {
    const response = await api.post("/auth/login", loginData);
    return response.data;
};

export const verifyOtp = async (payload) => {
    const response = await api.post("/auth/verify-otp", payload);
    return response.data;
};

export const forgotPassword = async (data) => {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
};

export const resetPassword = async (data) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
};

export const sendChangePasswordOtp = async () => {
    const response = await api.post("/auth/send-change-password-otp");
    return response.data;
};

export const verifyAndChangePassword = async (data) => {
    const response = await api.post("/auth/change-password", data);
    return response.data;
};



export const getLocalData = (userType, secretkey) => {
    localStorage.setItem("UserType", userType);
    localStorage.setItem("secretkey", secretkey);
};

export const getUser = () => {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "guest", role: "" };
    } catch {
        return { username: "guest", role: "" };
    }
};

export const logout = async () => {
    try {
        await api.post("/auth/logout");
    } catch (err) {
        console.error("Failed to notify backend of logout:", err);
    } finally {
        localStorage.removeItem("user");
        localStorage.removeItem("UserType");
        localStorage.removeItem("token");
        localStorage.removeItem("tempUser");
        localStorage.removeItem("secretkey");
    }
};

export const addDepartments = async (data) => {
    const response = await api.post("/departments", data);
    return response.data;
};
export const getDepartments = async (page = 1, limit = 10, isExport = false) => {
    const res = await api.get(`/departments/?page=${page}&limit=${limit}&isExport=${isExport}`);
    return res.data;
};
export const getDepartmentsById = async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
};
export const updateDepartment = async ({ id, ...data }) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
};

export const deleteDepartment = async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
};

// ---------------- Contractors (Subcontractors) APIs ----------------
export const getContractors = async (page = 1, limit = 100000, isExport = false, search = "") => {
    let url = `/subcontractors/?page=${page}&limit=${limit}&isExport=${isExport}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await api.get(url);
    return res.data;
};

export const addContractor = async (formData) => {
    const res = await api.post("/subcontractors/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
};

export const updateContractor = async (id, formData) => {
    const res = await api.put(`/subcontractors/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
};

export const deleteContractor = async (id) => {
    const res = await api.delete(`/subcontractors/${id}`);
    return res.data;
};

// ---------------- Employees APIs ----------------
export const getEmployees = async (page = 1, limit = 10, isExport = false) => {
    const res = await api.get(`/employee?page=${page}&limit=${limit}&isExport=${isExport}`);
    return res.data;
};

export const addEmployee = async (data) => {
    const res = await api.post("/employee", data);
    return res.data;
};
export const addRole = async (data) => {
    const res = await api.post("/roles", data);
    return res.data;
};

export const getRoles = async (page = 1, limit = 100) => {
    const res = await api.get(`/roles/?page=${page}&limit=${limit}`);
    return res.data;
};

export const updateEmployee = async (data) => {
    const res = await api.put("/employee", data);
    return res.data;
};

export const deleteEmployee = async (id) => {
    const res = await api.delete("/employee", { data: { id: Number(id) } });
    return res.data;
};

export const searchEmployees = async (searchQuery = "", page = 1, limit = 10, isExport = false, companyName = "") => {
    const res = await api.post("/employee/search", { search: searchQuery, page, limit, isExport, companyName });
    return res.data;
};

// ---------------- Zone Status (Zones) APIs ----------------
export const getZones = async (page = 1, limit = 10, zone = "", level = "", building_id = "", isExport = false, status = "") => {
    let url = `/zones?page=${page}&limit=${limit}`;
    if (zone) url += `&zone=${encodeURIComponent(zone)}`;
    if (level) url += `&level=${encodeURIComponent(level)}`;
    if (building_id) url += `&building_id=${encodeURIComponent(building_id)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (isExport) url += `&isExport=${isExport}`;
    const res = await api.get(url);
    return res.data;
};

export const addZone = async (data) => {
    const res = await api.post("/zones", data);
    return res.data;
};

export const updateZone = async (id, { id: _id, ...data }) => {
    const res = await api.put(`/zones/${id}`, data);
    return res.data;
};

export const deleteZone = async (id) => {
    const res = await api.delete(`/zones/${id}`);
    return res.data;
};

export const getBuildings = async (page = 1, limit = 100) => {
    const res = await api.get(`/buildings?page=${page}&limit=${limit}`);
    if (res?.data) {
        const sortFn = (a, b) => {
            const nameA = a?.building_name || a?.name || '';
            const nameB = b?.building_name || b?.name || '';
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        };
        if (Array.isArray(res.data.data)) {
            res.data.data.sort(sortFn);
        } else if (Array.isArray(res.data.data?.rows)) {
            res.data.data.rows.sort(sortFn);
        } else if (Array.isArray(res.data?.rows)) {
            res.data.rows.sort(sortFn);
        } else if (Array.isArray(res.data)) {
            res.data.sort(sortFn);
        }
    }
    return res.data;
};

export const getFloors = async (page = 1, limit = 100, bid = "", search = "") => {
    let url = `/floors?page=${page}&limit=${limit}`;
    if (bid) url += `&bid=${bid}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data;
};

// ---------------- Electrical Works APIs ----------------
export const getElectricalWorks = async (page = 1, limit = 10, search = "", module = "") => {
    let url = `/electrical?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (module) url += `&module=${encodeURIComponent(module)}`;
    const res = await api.get(url);
    return res.data;
};

export const addElectricalWork = async (data) => {
    const res = await api.post("/electrical", data);
    return res.data;
};

export const updateElectricalWork = async (id, { id: _id, ...data }) => {
    const res = await api.put(`/electrical/${id}`, data);
    return res.data;
};

export const deleteElectricalWork = async (id) => {
    const res = await api.delete(`/electrical/${id}`);
    return res.data;
};

// ---------------- Mechanical Works APIs ----------------
export const getMechanicalWorks = async (page = 1, limit = 10, search = "") => {
    let url = `/mechanical?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data;
};

export const addMechanicalWork = async (data) => {
    const res = await api.post("/mechanical", data);
    return res.data;
};

export const updateMechanicalWork = async (id, { id: _id, ...data }) => {
    const res = await api.put(`/mechanical/${id}`, data);
    return res.data;
};

export const deleteMechanicalWork = async (id) => {
    const res = await api.delete(`/mechanical/${id}`);
    return res.data;
};

// ---------------- Activities APIs ----------------
export const getActivities = async (page = 1, limit = 10, search = "") => {
    let url = `/activities?page=${page}&limit=${limit}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await api.get(url);
    return res.data;
};

export const addActivity = async (data) => {
    const res = await api.post("/activities", data);
    return res.data;
};

export const updateActivity = async (id, data) => {
    const res = await api.put(`/activities/${id}`, data);
    return res.data;
};

export const deleteActivity = async (id) => {
    const res = await api.delete(`/activities/${id}`);
    return res.data;
};

// ---------------- Precautions APIs ----------------
export const getPrecautions = async (page = 1, limit = 10) => {
    const res = await api.get(`/precautions?page=${page}&limit=${limit}`);
    return res.data;
};

export const addPrecaution = async (data) => {
    const res = await api.post("/precautions", data);
    return res.data;
};

export const updatePrecaution = async (id, data) => {
    const res = await api.put(`/precautions/${id}`, data);
    return res.data;
};

export const deletePrecaution = async (id) => {
    const res = await api.delete(`/precautions/${id}`);
    return res.data;
};

// ---------------- Locations Sub-API ----------------

// Buildings CRUD (getBuildings is already defined above)
export const addBuilding = async (data) => {
    const res = await api.post("/buildings", data);
    return res.data;
};

export const updateBuilding = async (id, data) => {
    const res = await api.put(`/buildings/${id}`, data);
    return res.data;
};

export const deleteBuilding = async (id) => {
    const res = await api.delete(`/buildings/${id}`);
    return res.data;
};

// Floors CRUD (getFloors is already defined above)
export const addFloor = async (data) => {
    const res = await api.post("/floors", data);
    return res.data;
};

export const updateFloor = async (id, data) => {
    const res = await api.put(`/floors/${id}`, data);
    return res.data;
};

export const deleteFloor = async (id) => {
    const res = await api.delete(`/floors/${id}`);
    return res.data;
};

// Rooms CRUD
export const getRooms = async (page = 1, limit = 10, flid = "", search = "") => {
    let url = `/rooms?page=${page}&limit=${limit}`;
    if (flid) url += `&flid=${flid}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data;
};

export const addRoom = async (data) => {
    const res = await api.post("/rooms", data);
    return res.data;
};

export const updateRoom = async (id, data) => {
    const res = await api.put(`/rooms/${id}`, data);
    return res.data;
};

export const deleteRoom = async (id) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
};

// ---------------- Analytics & Dashboard APIs ----------------
export const getRequestCounts = async () => {
    const res = await api.get("/requests/counts");
    return res.data;
};

export const getRequestCountByStatus = async (status) => {
    const res = await api.post("/requests/counts/status", { Request_status: status });
    return res.data;
};

export const getPlans = async (payload) => {
    const body = typeof payload === "object" ? payload : {};
    const res = await api.post("/requests/plans", body);
    return res.data;
};

export const getGraphCountsPerDay = (firstDay, lastDay) => {
    return api.post('/requests/analytics/graph', {
        WeekFirstday: firstDay,
        WeekLastday: lastDay,
    });
};

export const getGraphSummary = async () => {
    const res = await api.get("/requests/analytics/graph/counts");
    return res.data;
};

export const getZoneStatusCounts = async () => {
    const res = await api.get("/zones/status/counts");
    return res.data;
};

export const getEmployeeAnalyticsCounts = async () => {
    const res = await api.get("/employee/analytics/counts");
    return res.data;
};

// Search/retrieve filtered requests
export const searchDashboardRequests = async (payload) => {
    const res = await api.post("/requests/search", payload);
    return res.data;
};

// ---------------- Logs Reports ----------------
export const getUserLogs = async (page = 1, limit = 20, username = "", date = "") => {
    let url = `/employee/logs-reports?page=${page}&limit=${limit}`;
    if (username) {
        url += `&username=${encodeURIComponent(username)}`;
    }
    if (date) {
        url += `&date=${encodeURIComponent(date)}`;
    }
    const res = await api.get(url);
    return res.data;
};
