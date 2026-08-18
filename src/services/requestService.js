import api from "./api";

// Create a new permit request (multipart/form-data)
export const createRequest = async (formData) => {
  const res = await api.post("/requests", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Update an existing permit request (multipart/form-data)
export const updateRequest = async (id, formData) => {
  const res = await api.put(`/requests/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Search/retrieve filtered requests
export const searchRequests = async (payload) => {
  const res = await api.post("/requests/search", payload);
  return res.data;
};

export const planRequests = async (payload) => {
  const res = await api.post("/requests/plans", payload);
  return res.data;
};

// Get a single permit request by ID (for edit mode)
export const getRequestById = async (id) => {
  const res = await api.get(`/requests/${id}`);
  return res.data;
};

// Delete a permit request (soft-delete)
export const deleteRequest = async (id) => {
  const res = await api.delete(`/requests/${id}`);
  return res.data;
};

// Delete selected permit requests in bulk
export const deleteSelectedRequests = async (payload) => {
  const res = await api.delete("/requests", { data: payload });
  return res.data;
};

// Update the status of requests in bulk
export const updateListStatusRequest = async (payload) => {
  const res = await api.put("/requests/status/change", payload);
  return res.data;
};

// Update safety precautions in bulk
export const updateListReqstSafety = async (payload) => {
  const res = await api.put("/requests/safety/change", payload);
  return res.data;
};

// Update working times/shifts in bulk
export const updateListReqstTime = async (payload) => {
  const res = await api.put("/requests/status/change", payload);
  return res.data;
};

// Upload RAMS file attachments (multipart/form-data)
export const addRamsFiles = async (formData) => {
  const res = await api.post("/requests/files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Delete a RAMS file attachment
export const deleteRamsFile = async (fileId) => {
  const res = await api.delete(`/requests/files/${fileId}`);
  return res.data;
};

// Get requests logs history for a permit
export const getRequestsLogs = async (id) => {
  const res = await api.get(`/requests/logs/user/${id}`);
  return res.data;
};

// Add note to requests
export const addListReqstNote = async (payload) => {
  const res = await api.post("/requests/notes", payload);
  return res.data;
};

// Delete a single note by ID
export const deleteListReqstNote = async (noteId) => {
  const res = await api.delete(`/requests/notes/${noteId}`);
  return res.data;
};

// Get request counts (dashboard / list helper)
export const getRequestCounts = async () => {
  const res = await api.get("/requests/counts");
  return res.data;
};

// Copy permit requests for consecutive dates
// export const createByCount = async (payload) => {
//   const res = await api.post("/requests/createbycount", payload);
//   return res.data;
// };

// Copy permit requests for consecutive dates
export const createByCount = async (payload) => {
  const res = await api.post("/requests/createbycount", payload);
  const data = res.data;

  // Backend returns HTTP 200 even on failure, embedding the real status
  // and message inside the JSON body — normalize that into a thrown error
  // so callers' try/catch and error toasts work correctly.
  if (data && typeof data === "object" && data.status && Number(data.status) >= 400) {
    const err = new Error(data.message || "Request failed");
    err.response = { data, status: data.status };
    throw err;
  }

  return data;
};

// Executive Dashboard Overview API
export const getDashboardOverview = async (buildingParam, fromDate, toDate) => {
  const params = {};
  if (buildingParam) {
    if (typeof buildingParam === "object" && buildingParam !== null) {
      if (buildingParam.buildingId || buildingParam.id) params.buildingId = buildingParam.buildingId || buildingParam.id;
      if (buildingParam.building || buildingParam.name || buildingParam.building_name) {
        params.building = buildingParam.building || buildingParam.name || buildingParam.building_name;
      }
      if (buildingParam.fromDate) params.fromDate = buildingParam.fromDate;
      if (buildingParam.toDate) params.toDate = buildingParam.toDate;
    } else if (typeof buildingParam === "number" || (!isNaN(Number(buildingParam)) && String(buildingParam).trim() !== "")) {
      params.buildingId = buildingParam;
      params.building = buildingParam;
    } else {
      params.building = buildingParam;
    }
  }
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  const res = await api.get("/requests/dashboard/overview", { params });
  return res.data;
};

// Executive Dashboard Building & Floor Metrics API
export const getDashboardBuildingMetrics = async (payload, floor) => {
  if (typeof payload === "object" && payload !== null) {
    try {
      const res = await api.post("/requests/dashboard/building", payload);
      return res.data;
    } catch (err) {
      if (err?.response?.status === 404) {
        const res = await api.get("/requests/dashboard/building", { params: payload });
        return res.data;
      }
      throw err;
    }
  }
  const params = {};
  if (payload) params.building = payload;
  if (floor) params.floor = floor;
  const res = await api.get("/requests/dashboard/building", { params });
  return res.data;
};
