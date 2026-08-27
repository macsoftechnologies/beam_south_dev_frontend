import api from "./api";

/**
 * Service for Safety Observations (SO) module API integrations.
 * Endpoints target: https://api.beam.safesiteworks.com/development/m3south/observations
 */
export const observationService = {
  /**
   * List all observations with optional filters & RBAC scoping
   */
  async getObservations(params = {}) {
    const response = await api.get("observations", { params });
    return response.data;
  },

  /**
   * Get single observation details along with complete action logs history timeline
   */
  async getObservationDetails(id) {
    const response = await api.get(`observations/${id}`);
    return response.data; // { observation, history }
  },

  /**
   * Create a new Safety Observation (supports direct multipart/form-data for photos)
   */
  async createObservation(data) {
    let headers = {};
    if (data instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    }
    const response = await api.post("observations", data, { headers });
    return response.data;
  },

  /**
   * Upload photos via Multer into ./uploads/observations/
   */
  async uploadPhotos(files) {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => formData.append("files", f));
    } else {
      formData.append("files", files);
    }
    const response = await api.post("observations/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { urls: [...] }
  },

  /**
   * Contractor Review Action: ACCEPT or REJECT with mandatory remarks
   */
  async contractorReview(id, data) {
    let headers = {};
    if (data instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    }
    const response = await api.post(`observations/${id}/contractor-review`, data, { headers });
    return response.data;
  },

  /**
   * Department Action: Reassign Observation to a different contractor with remarks
   */
  async reassignContractor(id, payload) {
    const response = await api.post(`observations/${id}/reassign`, payload);
    return response.data;
  },

  /**
   * Contractor Action: Submit Resolution Notes & Proof Photos
   */
  async resolveObservation(id, data) {
    let headers = {};
    if (data instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    }
    const response = await api.post(`observations/${id}/resolve`, data, { headers });
    return response.data;
  },

  /**
   * Department Action: Close Observation (Sign-off)
   */
  async closeObservation(id, payload) {
    const response = await api.put(`observations/${id}/close`, payload);
    return response.data;
  },

  /**
   * Escalate Safety Observation to formal Stage 1 Incident
   */
  async escalateToIncident(id, payload) {
    const response = await api.post(`observations/${id}/escalate`, payload);
    return response.data;
  },
};

export default observationService;
