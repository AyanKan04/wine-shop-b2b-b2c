// Centralized API Service Client for RuuBusiness Frontend
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch Helper with Default Request Configuration
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
    console.error(`API Request Failed [${endpoint}]:`, error);
    throw error;
  }
}

export const apiService = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),

  // Companies & Licenses
  registerCompany: (companyData) => request('/companies/register', { method: 'POST', body: JSON.stringify(companyData) }),
  getAdminLicenses: () => request('/admin/licenses'),
  approveLicense: (id) => request(`/admin/licenses/${id}/approve`, { method: 'POST' }),

  // RFQs & Quotations
  getRFQs: () => request('/rfqs'),
  createRFQ: (rfqData) => request('/rfqs', { method: 'POST', body: JSON.stringify(rfqData) }),
  getQuotations: () => request('/sales/quotations'),
  createQuotation: (quotationData) => request('/sales/quotations', { method: 'POST', body: JSON.stringify(quotationData) }),

  // Finance & Orders
  getOrders: () => request('/orders'),
  getCreditLimit: () => request('/finance/credit-limit'),
  payInvoice: (id) => request(`/finance/pay-invoice/${id}`, { method: 'POST' }),

  // Warehouse
  getInventory: () => request('/warehouse/inventory')
};

export default apiService;
