import api from "./api";

// Create Heads-Up Notification (Stage 1)
export const createHeadsUp = async (data) => {
  const response = await api.post("/incidents/headsup/", data);
  return response.data;
};

// Approve Heads-Up Notification (Stage 1)
export const approveHeadsUp = async (incidentId, data) => {
  const response = await api.post(`/incidents/${incidentId}/headsup/approve/`, data);
  return response.data;
};

// Submit Initial Report (Stage 2)
export const submitInitialReport = async (incidentId, formData) => {
  const response = await api.post(`/incidents/${incidentId}/initial-report/`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// Approve Initial Report (Stage 2)
export const approveInitialReport = async (incidentId, data) => {
  const response = await api.post(`/incidents/${incidentId}/initial-report/approve/`, data);
  return response.data;
};

// Save Investigation Report (Stage 3)
export const saveInvestigation = async (incidentId, data) => {
  const response = await api.put(`/incidents/${incidentId}/investigation/`, data);
  return response.data;
};

// Review Investigation Report (Stage 3)
export const reviewInvestigation = async (incidentId, data) => {
  const response = await api.post(`/incidents/${incidentId}/investigation/review/`, data);
  return response.data;
};

// Close Incident (Stage 3)
export const closeIncident = async (incidentId, data) => {
  const response = await api.put(`/incidents/${incidentId}/close/`, data);
  return response.data;
};

// Get Single Incident Report
export const getIncidentById = async (incidentId) => {
  const response = await api.get(`/incidents/${incidentId}/`);
  return response.data;
};

// Upload multiple photos
export const uploadImages = async (formData) => {
  const response = await api.post("/incidents/upload-images/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// Upload a single photo
export const uploadImage = async (formData) => {
  const response = await api.post("/incidents/upload-image/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// Get all Action Items for an incident
export const getActionItems = async (incidentId) => {
  const response = await api.get(`/incidents/${incidentId}/action-items/`);
  return response.data;
};

// Add Action Item to Incident
export const addActionItem = async (incidentId, data) => {
  const response = await api.post(`/incidents/${incidentId}/action-items/`, data);
  return response.data;
};

// Update Action Item
export const updateActionItem = async (incidentId, itemId, data) => {
  const response = await api.put(`/incidents/${incidentId}/action-items/${itemId}/`, data);
  return response.data;
};

// Delete Action Item
export const deleteActionItem = async (incidentId, itemId) => {
  const response = await api.delete(`/incidents/${incidentId}/action-items/${itemId}/`);
  return response.data;
};

// Get All Incidents with Filters
export const getIncidents = async (filters = {}) => {
  const query = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      query.append(key, filters[key]);
    }
  });
  const response = await api.get(`/incidents/?${query.toString()}`);
  return response.data;
};

// Get Incident Dashboard Aggregated Stats (Optimized for lakhs of records)
export const getIncidentStats = async (filters = {}) => {
  const query = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      query.append(key, filters[key]);
    }
  });
  const response = await api.get(`/incidents/stats?${query.toString()}`);
  return response.data;
};

// Export / Download Incident PDF from backend
export const exportIncidentPdf = async (incidentId) => {
  try {
    const response = await api.get(`/incidents/${incidentId}/export-pdf/`, {
      responseType: "blob"
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const response = await api.get(`/incidents/${incidentId}/export-pdf`, {
        responseType: "blob"
      });
      return response.data;
    }
    throw err;
  }
};

