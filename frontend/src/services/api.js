// Centralized API Service Client for RuuBusiness Frontend with Resilient Offline Fallbacks
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Resilient Fetch Helper with Graceful Offline Fallback
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const apiService = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // IAM Users
  getUsers: (search = '') => request(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createUser: (userData) => request('/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  lockUser: (id) => request(`/users/${id}/lock`, { method: 'PUT' }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),

  // Companies & Licenses
  getCompanies: () => request('/companies'),
  registerCompany: (companyData) => request('/companies/register', { method: 'POST', body: JSON.stringify(companyData) }),
  getAdminLicenses: () => request('/admin/licenses'),
  approveLicense: (id) => request(`/admin/licenses/${id}/approve`, { method: 'POST' }),

  // RFQs & Quotations
  getRFQs: () => request('/rfqs'),
  createRFQ: (rfqData) => request('/rfqs', { method: 'POST', body: JSON.stringify(rfqData) }),
  getQuotations: () => request('/sales/quotations'),
  createQuotation: (quotationData) => request('/sales/quotations', { method: 'POST', body: JSON.stringify(quotationData) }),
  updateQuotationStatus: (id, status) => request(`/sales/quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Finance & Orders
  getOrders: () => request('/orders'),
  getCreditLimit: () => request('/finance/credit-limit'),
  payInvoice: (id) => request(`/finance/pay-invoice/${id}`, { method: 'POST' }),
  getLCDocuments: () => request('/finance/lc-documents'),
  submitLCDocument: (lcData) => request('/finance/lc-documents', { method: 'POST', body: JSON.stringify(lcData) }),
  verifyLCDocument: (id) => request(`/finance/lc-documents/${id}/verify`, { method: 'POST' }),
  rejectLCDocument: (id) => request(`/finance/lc-documents/${id}/reject`, { method: 'POST' }),

  // Warehouse
  getInventory: () => request('/warehouse/inventory'),
  getShipments: () => request('/warehouse/shipments'),
  createShipment: (shipmentData) => request('/warehouse/shipments', { method: 'POST', body: JSON.stringify(shipmentData) }),
  updateShipmentStatus: (id, status) => request(`/warehouse/shipments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Dashboard
  getDashboardRevenue: () => request('/dashboard/revenue'),
  getDashboardActivity: () => request('/dashboard/activity'),
  getNotifications: () => request('/dashboard/notifications'),

  // Negotiation & AI Sommelier Chat
  getChatMessages: (rfqId) => request(`/rfqs/${rfqId}/messages`),
  sendChatMessage: (rfqId, msgData) => request(`/rfqs/${rfqId}/messages`, { method: 'POST', body: JSON.stringify(msgData) })
};

export default apiService;
