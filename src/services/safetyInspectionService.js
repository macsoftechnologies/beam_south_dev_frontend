import api from "./api";

/**
 * Service for Safety Inspections (SI) module API integrations.
 * Targets: /safety-inspections endpoints
 */
export const safetyInspectionService = {
  /**
   * List all safety inspections with filters, search, and pagination
   * @param {Object} params - { page, limit, status, search, building, contractor, dateFrom, dateTo }
   */
  async getInspections(params = {}) {
    const response = await api.get("safety-inspections", { params });
    return response.data; // { inspections, total, page, limit, totalPages, hasNextPage, hasPrevPage }
  },

  /**
   * Get single safety inspection details by ID or reference number
   * @param {string|number} id
   */
  async getInspectionDetails(id) {
    const response = await api.get(`safety-inspections/${id}`);
    return response.data;
  },

  /**
   * Create a new Safety Inspection record with all 21 checklist items
   * @param {Object} data
   */
  async createInspection(data) {
    const response = await api.post("safety-inspections", data);
    return response.data;
  },

  /**
   * Update an existing safety inspection
   * @param {string|number} id
   * @param {Object} data
   */
  async updateInspection(id, data) {
    const response = await api.put(`safety-inspections/${id}`, data);
    return response.data;
  },

  /**
   * Delete a safety inspection (Admin/SuperAdmin only)
   * @param {string|number} id
   * @param {Object} params - { userId, userRole }
   */
  async deleteInspection(id, params = {}) {
    const response = await api.delete(`safety-inspections/${id}`, { params });
    return response.data;
  },

  /**
   * Get aggregated dashboard statistics and KPIs
   */
  async getInspectionStats() {
    const response = await api.get("safety-inspections/stats");
    return response.data;
  },

  /**
   * Upload photos/attachments for safety inspection checklist items
   * @param {File|File[]} files
   */
  async uploadPhotos(files) {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => formData.append("files", f));
    } else {
      formData.append("files", files);
    }
    const response = await api.post("safety-inspections/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { urls: [...] }
  },

  /**
   * Get official PDF stream endpoint URL for Safety Inspection
   * @param {string|number} id
   */
  getPdfUrl(id) {
    const base = (api.defaults?.baseURL || "").replace(/\/+$/, "");
    return `${base}/safety-inspections/${id}/export-pdf`;
  },

  /**
   * Download Safety Inspection official PDF directly
   * @param {string|number} id
   * @param {string} fileName
   */
  async downloadInspectionPdf(id, fileName = "Safety_Inspection.pdf") {
    const response = await api.get(`safety-inspections/${id}/download-pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  },
};

export default safetyInspectionService;
