const API_BASE = '/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('nbx_token');
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
    } catch (networkErr: any) {
      throw new Error(`Network Error: Unable to reach backend server (${networkErr.message || 'Connection refused'}).`);
    }

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = null;
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        const err: any = new Error(`Server Error (${response.status}): ${text || response.statusText}`);
        err.code = `HTTP_${response.status}`;
        err.status = response.status;
        throw err;
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: true, data: text };
      }
    }

    if (!response.ok || (data && data.success === false)) {
      const errorMsg = data?.error?.message || (typeof data === 'string' ? data : response.statusText) || 'API request failed';
      const code = data?.error?.code || `HTTP_${response.status}`;
      const err: any = new Error(errorMsg);
      err.code = code;
      err.status = response.status;
      err.details = data?.error?.details;
      throw err;
    }

    return (data && data.data !== undefined) ? data.data : data;
  }

  // Auth endpoints
  public static async login(credentials: { username: string; password: string; expectedRole?: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  public static async getProfile() {
    return this.request('/auth/profile');
  }

  public static async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('nbx_token');
      localStorage.removeItem('nbx_user');
    }
  }

  // Banking & Accounts
  public static async getMyAccounts() {
    return this.request('/accounts/my-accounts');
  }

  public static async lookupAccount(accNumber: string) {
    return this.request(`/accounts/lookup/${accNumber}`);
  }

  public static async transferFunds(payload: {
    sourceAccountId: string;
    destinationAccountNumber: string;
    amount: number;
    description?: string;
    speedMultiplier?: number;
    idempotencyKey?: string;
  }) {
    const idempotencyKey = payload.idempotencyKey || crypto.randomUUID();
    return this.request('/transactions/transfer', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ ...payload, idempotencyKey })
    });
  }

  public static async getAccountTransactions(accountId: string) {
    return this.request(`/transactions/account/${accountId}`);
  }

  public static async getAllTransactions(limit = 50) {
    return this.request(`/transactions/all?limit=${limit}`);
  }

  public static async getTransaction(id: string) {
    return this.request(`/transactions/${id}`);
  }

  // Directory & Roles
  public static async getCustomerProfile() {
    return this.request('/users/customer-profile');
  }

  public static async getCustomers() {
    return this.request('/users/customers');
  }

  public static async getBranches() {
    return this.request('/users/branches');
  }

  public static async getRegions() {
    return this.request('/users/regions');
  }

  public static async getServiceRequests() {
    return this.request('/users/service-requests');
  }

  public static async createServiceRequest(payload: {
    category: string;
    title?: string;
    description: string;
    priority?: string;
  }) {
    return this.request('/users/service-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Network Simulation & Lab
  public static async getTopology() {
    return this.request('/network/topology');
  }

  public static async calculateRoute(sourceId: string, destId: string) {
    return this.request(`/network/route?sourceId=${encodeURIComponent(sourceId)}&destId=${encodeURIComponent(destId)}`);
  }

  public static async simulateTraffic(config: any) {
    return this.request('/network/simulate-traffic', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  public static async startTrafficSimulation(config: any) {
    return this.simulateTraffic(config);
  }

  public static async controlSimulation(simId: string, action: 'PAUSE' | 'RESUME' | 'STOP' | 'SPEED' | 'ABORT', speedMultiplier?: number) {
    return this.request(`/network/simulation/${encodeURIComponent(simId)}/control`, {
      method: 'POST',
      body: JSON.stringify({ action, speedMultiplier })
    });
  }

  public static async getSimulation(simId: string) {
    return this.request(`/network/simulation/${encodeURIComponent(simId)}`);
  }

  public static async getSimulationSession(simId: string) {
    return this.getSimulation(simId);
  }

  public static async getActiveSimulations() {
    return this.request('/network/simulation/active');
  }

  public static async getActiveSimulationSessions() {
    return this.getActiveSimulations();
  }

  public static async getTransactionJourney(transactionId: string) {
    return this.request(`/network/transaction-journey/${encodeURIComponent(transactionId)}`);
  }

  public static async setNodeStatus(nodeId: string, status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE') {
    return this.request('/network/node-status', {
      method: 'POST',
      body: JSON.stringify({ nodeId, status })
    });
  }

  public static async setLinkStatus(linkId: string, status: 'ACTIVE' | 'CONGESTED' | 'SEVERED', loss?: number, latency?: number) {
    return this.request('/network/link-status', {
      method: 'POST',
      body: JSON.stringify({ linkId, status, packetLossRate: loss, baseLatencyMs: latency })
    });
  }

  public static async resetTopology() {
    return this.request('/network/reset-topology', { method: 'POST' });
  }

  public static async setFaultParams(params: any) {
    return this.request('/network/fault-params', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public static async getMetrics() {
    return this.request('/network/metrics');
  }

  public static async getEvents(limit = 50, transactionId?: string) {
    let url = `/network/events?limit=${limit}`;
    if (transactionId) url += `&transactionId=${encodeURIComponent(transactionId)}`;
    return this.request(url);
  }

  public static async getAuditLogs(limit = 50) {
    return this.request(`/audit/logs?limit=${limit}`);
  }

  public static async verifyAuditIntegrity() {
    return this.request('/audit/verify');
  }

  // Security Operations Center (SOC) & Telemetry
  public static async getSecurityOverview() {
    return this.request('/security/overview');
  }

  public static async getSecurityEvents(params: { severity?: string; category?: string; actor?: string; correlationId?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.severity) qs.append('severity', params.severity);
    if (params.category) qs.append('category', params.category);
    if (params.actor) qs.append('actor', params.actor);
    if (params.correlationId) qs.append('correlationId', params.correlationId);
    if (params.limit) qs.append('limit', params.limit.toString());
    const query = qs.toString();
    return this.request(`/security/events${query ? '?' + query : ''}`);
  }

  public static async getSecurityIncidents(status?: string) {
    const url = status && status !== 'ALL' ? `/security/incidents?status=${encodeURIComponent(status)}` : '/security/incidents';
    return this.request(url);
  }

  public static async updateIncidentStatus(id: string, payload: { status: string; resolution?: string; assignedTo?: string }) {
    return this.request(`/security/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public static async getSecuritySessions() {
    return this.request('/security/sessions');
  }

  public static async revokeSecuritySession(id: string) {
    return this.request(`/security/sessions/${id}/revoke`, {
      method: 'POST'
    });
  }

  public static async setupMfa() {
    return this.request('/security/mfa/setup', {
      method: 'POST'
    });
  }

  public static async verifyMfa(token: string, secret?: string) {
    return this.request('/security/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token, secret })
    });
  }

  public static async runCyberLabScenario(scenario: string) {
    return this.request('/security/lab/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario })
    });
  }

  public static async getSecurityDevices() {
    return this.request('/security/devices');
  }

  public static async executeIncidentAction(id: string, action: string, targetResource?: string, note?: string) {
    return this.request(`/security/incidents/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, targetResource, note })
    });
  }

  public static async triggerDecoyResource(path: string = '/security/decoy/diagnostics') {
    try {
      return await this.request(path);
    } catch (err) {
      // Decoy endpoint intentionally returns 403 Forbidden
      return { triggered: true, path };
    }
  }

  public static async searchForensics(params: { q?: string; correlationId?: string; userId?: string; transactionId?: string }) {
    const qs = new URLSearchParams();
    if (params.q) qs.append('q', params.q);
    if (params.correlationId) qs.append('correlationId', params.correlationId);
    if (params.userId) qs.append('userId', params.userId);
    if (params.transactionId) qs.append('transactionId', params.transactionId);
    const query = qs.toString();
    return this.request(`/security/forensics${query ? '?' + query : ''}`);
  }
}
