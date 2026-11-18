import api from "./api";
import { downloadPdfFromApi } from "../utils/pdfDownload";

/**
 * Service for Spot Checks (SC) module API integrations.
 * Targets: /spot-checks endpoints
 */
export const spotCheckService = {
  /**
   * List all spot checks with filters, search, and pagination
   * @param {Object} params - { page, limit, status, search, building, contractor, compliance, dateFrom, dateTo }
   */
  async getSpotChecks(params = {}) {
    const response = await api.get("spot-checks", { params });
    return response.data; // { spotChecks, total, page, limit, totalPages }
  },

  /**
   * Get single spot check details by ID
   * @param {string|number} id
   */
  async getSpotCheckById(id) {
    const response = await api.get(`spot-checks/${id}`);
    return response.data;
  },

  /**
   * Create a new Spot Check entry
   * @param {Object} data
   */
  async createSpotCheck(data) {
    const response = await api.post("spot-checks", data);
    return response.data;
  },

  /**
   * Update an existing spot check
   * @param {string|number} id
   * @param {Object} data
   */
  async updateSpotCheck(id, data) {
    const response = await api.put(`spot-checks/${id}`, data);
    return response.data;
  },

  /**
   * Delete a spot check
   * @param {string|number} id
   */
  async deleteSpotCheck(id) {
    const response = await api.delete(`spot-checks/${id}`);
    return response.data;
  },

  /**
   * Get aggregated dashboard statistics for Spot Checks
   */
  async getSpotCheckStats() {
    const response = await api.get("spot-checks/stats");
    return response.data;
  },

  /**
   * Get direct PDF export URL
   * @param {string|number} id
   * @param {boolean} includeAttachments
   */
  getPdfUrl(id, includeAttachments = true) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5200';
    const baseUrlClean = base.replace(/\/development\/m3south\/?$/, '');
    const query = includeAttachments !== undefined ? `?includeAttachments=${includeAttachments}` : '';
    return `${baseUrlClean}/spot-checks/${id}/export-pdf${query}`;
  },

  /**
   * Trigger backend PDF download
   * @param {string|number} id
   * @param {string} fileName
   * @param {boolean} includeAttachments
   * @param {Function} [onProgress]
   */
  async downloadSpotCheckPdf(id, fileName = 'HSE_Spot_Check.pdf', includeAttachments = true, onProgress = null) {
    return await downloadPdfFromApi(`spot-checks/${id}/download-pdf`, fileName, {
      params: { includeAttachments },
      onProgress,
      initialTimeoutMs: 90000,
      stallTimeoutMs: 30000,
    });
  },
};
