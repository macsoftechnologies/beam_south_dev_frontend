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
   * Update core observation record details (Department/Admin only)
   * PUT /observations/:id
   */
  async updateObservation(id, data) {
    let headers = {};
    if (data instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    }
    const response = await api.put(`observations/${id}`, data, { headers });
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

  /**
   * Get aggregated Safety Observations statistics (KPIs, weekly trends, contractor compliance, categories, risk distribution, body parts)
   */
  async getObservationStats(params = {}) {
    const response = await api.get("observations/stats", { params });
    return response.data;
  },

  /**
   * Delete an observation record (Admin/SuperAdmin only)
   */
  async deleteObservation(id, params = {}) {
    const response = await api.delete(`observations/${id}`, { params });
    return response.data;
  },

  /**
   * Download Observation Official PDF
   * Tries backend PDF stream first; seamlessly falls back to client-side HTML2PDF generator
   * @param {string|number} id
   * @param {string} fileName
   * @param {Object} [obsData]
   */
  async downloadObservationPdf(id, fileName = "Safety_Observation.pdf", obsData = null) {
    try {
      const response = await api.get(`observations/${id}/download-pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.warn("Backend PDF download failed, using client-side generator fallback:", err);
      const details = obsData || (await this.getObservationDetails(id));
      const { generateObservationClientPdf } = await import("../modules/safety-observations/utils/observationPdfGenerator");
      return await generateObservationClientPdf(details, fileName);
    }
  },
};

export default observationService;
