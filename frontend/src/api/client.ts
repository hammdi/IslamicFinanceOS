const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<{ access_token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<any>("/auth/me"),

  // Qard Hasan
  requestQard: (data: { amount: number; purpose: string }) =>
    request<any>("/qard/request", { method: "POST", body: JSON.stringify(data) }),

  listQards: () => request<any[]>("/qard/available"),
  myQards: () => request<any[]>("/qard/my"),

  fundQard: (id: string, data: { amount: number }) =>
    request<any>(`/qard/${id}/fund`, { method: "POST", body: JSON.stringify(data) }),

  repayQard: (id: string, data: { amount: number }) =>
    request<any>(`/qard/${id}/repay`, { method: "POST", body: JSON.stringify(data) }),

  // Musharaka
  createMusharaka: (data: {
    project_name: string;
    description: string;
    target_amount: number;
    expected_profit_percent: number;
    duration_months: number;
  }) =>
    request<any>("/musharaka/create", { method: "POST", body: JSON.stringify(data) }),

  listMusharaka: () => request<any[]>("/musharaka/available"),
  myMusharaka: () => request<any[]>("/musharaka/my"),

  investMusharaka: (id: string, data: { amount: number }) =>
    request<any>(`/musharaka/${id}/invest`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  distributeProfit: (id: string, data: { total_profit: number }) =>
    request<any>(`/musharaka/${id}/profit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Tontine
  createTontine: (data: { name: string; monthly_amount: number; members_count: number }) =>
    request<any>("/tontine/create", { method: "POST", body: JSON.stringify(data) }),

  listTontines: () => request<any[]>("/tontine/available"),
  myTontines: () => request<any[]>("/tontine/my"),

  joinTontine: (id: string) =>
    request<any>(`/tontine/${id}/join`, { method: "POST" }),

  payTontine: (id: string, data: { amount: number }) =>
    request<any>(`/tontine/${id}/pay`, { method: "POST", body: JSON.stringify(data) }),

  tontineStatus: (id: string) => request<any>(`/tontine/${id}/status`),

  // Murabaha
  requestMurabaha: (data: any) =>
    request<any>("/murabaha/request", { method: "POST", body: JSON.stringify(data) }),
  listMurabaha: () => request<any[]>("/murabaha/available"),
  myMurabaha: () => request<any[]>("/murabaha/my"),
  approveMurabaha: (id: string) =>
    request<any>(`/murabaha/${id}/approve`, { method: "POST" }),
  payMurabaha: (id: string) =>
    request<any>(`/murabaha/${id}/pay`, { method: "POST" }),
  murabahaSchedule: (id: string) => request<any[]>(`/murabaha/${id}/schedule`),

  // Ijara
  requestIjara: (data: any) =>
    request<any>("/ijara/request", { method: "POST", body: JSON.stringify(data) }),
  listIjara: () => request<any[]>("/ijara/available"),
  myIjara: () => request<any[]>("/ijara/my"),
  approveIjara: (id: string) =>
    request<any>(`/ijara/${id}/approve`, { method: "POST" }),
  payIjara: (id: string) =>
    request<any>(`/ijara/${id}/pay`, { method: "POST" }),
  purchaseIjara: (id: string) =>
    request<any>(`/ijara/${id}/purchase`, { method: "POST" }),

  // Sadaqa
  createCampaign: (data: any) =>
    request<any>("/sadaqa/campaigns", { method: "POST", body: JSON.stringify(data) }),
  listCampaigns: () => request<any[]>("/sadaqa/campaigns"),
  myCampaigns: () => request<any[]>("/sadaqa/campaigns/my"),
  donateCampaign: (id: string, data: any) =>
    request<any>(`/sadaqa/campaigns/${id}/donate`, { method: "POST", body: JSON.stringify(data) }),
  postCampaignUpdate: (id: string, data: any) =>
    request<any>(`/sadaqa/campaigns/${id}/update`, { method: "POST", body: JSON.stringify(data) }),
  campaignTransparency: (id: string) => request<any>(`/sadaqa/campaigns/${id}/transparency`),

  // Halal Screener
  screenCompany: (data: any) =>
    request<any>("/screener/check", { method: "POST", body: JSON.stringify(data) }),
  halalList: () => request<any[]>("/screener/halal-list"),
  allCompanies: () => request<any[]>("/screener/all"),

  // Wallet
  getWallet: () => request<any>("/wallet/"),
  deposit: (data: { amount: number }) =>
    request<any>("/wallet/deposit", { method: "POST", body: JSON.stringify(data) }),
  withdraw: (data: { amount: number }) =>
    request<any>("/wallet/withdraw", { method: "POST", body: JSON.stringify(data) }),
  transfer: (data: { to_email: string; amount: number; note?: string }) =>
    request<any>("/wallet/transfer", { method: "POST", body: JSON.stringify(data) }),

  // Zakat
  calculateZakat: (data: any) =>
    request<any>("/zakat/calculate", { method: "POST", body: JSON.stringify(data) }),
  zakatHistory: () => request<any[]>("/zakat/history"),
  distributeZakat: (data: any) =>
    request<any>("/zakat/distribute", { method: "POST", body: JSON.stringify(data) }),
  zakatDistributions: () => request<any[]>("/zakat/distributions"),

  // Waqf
  createWaqf: (data: { name: string; description: string; category: string; target_amount: number }) =>
    request<any>("/waqf/create", { method: "POST", body: JSON.stringify(data) }),
  listWaqf: () => request<any[]>("/waqf/available"),
  myWaqf: () => request<any[]>("/waqf/my"),
  donateWaqf: (id: string, data: { amount: number }) =>
    request<any>(`/waqf/${id}/donate`, { method: "POST", body: JSON.stringify(data) }),

  // Notifications
  listNotifications: () => request<any[]>("/notifications/"),
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<any>("/notifications/read-all", { method: "POST" }),

  // Dashboard
  dashboardStats: () => request<any>("/dashboard/stats"),

  // Admin
  adminStats: () => request<any>("/admin/stats"),
  adminUsers: () => request<any[]>("/admin/users"),
  adminVerifyUser: (id: string) =>
    request<any>(`/admin/users/${id}/verify`, { method: "POST" }),
  adminTransactions: () => request<any[]>("/admin/transactions"),
  adminPendingApprovals: () => request<any>("/admin/pending-approvals"),

  // Transactions
  listTransactions: (productType?: string) =>
    request<any[]>(
      `/transactions/${productType ? `?product_type=${productType}` : ""}`
    ),
};
