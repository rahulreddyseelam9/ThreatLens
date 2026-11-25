import client from "./client";

const unwrapPayload = (response) => {
  const payload = response && response.data !== undefined ? response.data : response;
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data") && !Object.prototype.hasOwnProperty.call(payload, "items")) {
    return payload.data;
  }
  return payload;
};

export const authApi = {
  register: (data) => client.post("/auth/register", data).then((r) => r.data),
  login: (data) => client.post("/auth/login", data).then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
  logout: () => client.post("/auth/logout").then((r) => r.data),
};

export const scanApi = {
  scan: async (ioc, ioc_type) => {
    const payload = await client.post("/scan", { ioc, ioc_type });
    return unwrapPayload(payload);
  },
  batch: async (iocs) => {
    const payload = await client.post("/scan/batch", { iocs });
    return unwrapPayload(payload);
  },
  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const payload = await client.post("/scan/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return unwrapPayload(payload);
  },
  list: async () => {
    const payload = await client.get("/scans");
    const data = unwrapPayload(payload);
    return Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
  },
  get: async (id) => {
    const payload = await client.get(`/scans/${id}`);
    return unwrapPayload(payload);
  },
};

export const dashboardApi = {
  get: async () => {
    const payload = await client.get("/dashboard");
    const data = unwrapPayload(payload) || {};
    const total = Number(data.total_scans || 0);
    const high = Number(data.high_risk || 0);
    const critical = Number(data.critical_risk || 0);
    const emergingList = Array.isArray(data.emerging_threats) ? data.emerging_threats : [];
    const emerging = Number(data.emerging_threats_count || emergingList.length || 0);
    const metrics = {
      total_scans: total,
      threats_detected: total ? Math.max(total - (data.safe_scans || 0), 0) : 0,
      high: high,
      critical: critical,
      emerging: emerging,
    };
    const risk_distribution = [
      { level: "SAFE", count: Number(data.safe_scans || 0) },
      { level: "LOW", count: Number(data.low_risk || 0) },
      { level: "MEDIUM", count: Number(data.medium_risk || 0) },
      { level: "HIGH", count: high },
      { level: "CRITICAL", count: critical },
    ];
    return {
      metrics,
      risk_distribution,
      activity: Array.isArray(data.activity) ? data.activity : [],
      recent_scans: Array.isArray(data.recent_scans) ? data.recent_scans : [],
      providers: Object.entries(data.provider_activity || {}).map(([name, count], index) => ({
        id: `${name}-${index}`,
        name,
        configured: true,
        status: count > 0 ? "AVAILABLE" : "UNAVAILABLE",
        evidence: `${count} request(s) logged`,
      })),
      emerging_threats: emergingList,
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    };
  },
};

export const intelApi = {
  get: async () => {
    const payload = await client.get("/intelligence");
    return unwrapPayload(payload);
  },
};

export const emergingApi = {
  list: async () => {
    const payload = await client.get("/emerging");
    return unwrapPayload(payload);
  },
  detail: async (id) => {
    const payload = await client.get(`/emerging/${id}`);
    return unwrapPayload(payload);
  },
};

export const recApi = {
  list: async () => {
    const payload = await client.get("/recommendations");
    return unwrapPayload(payload);
  },
};

export const alertsApi = {
  list: async () => {
    const payload = await client.get("/alerts");
    return unwrapPayload(payload);
  },
};

export const reportsApi = {
  generate: async (format, scope, scanId) => {
    const payload = await client.post("/reports/generate", { format, scope, scan_id: scanId });
    return unwrapPayload(payload);
  },
  list: async () => {
    const payload = await client.get("/reports");
    const data = unwrapPayload(payload);
    return Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
  },
  downloadUrl: (id) => `${client.defaults.baseURL}/reports/${id}/download`,
};
