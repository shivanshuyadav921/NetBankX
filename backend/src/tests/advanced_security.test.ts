import { SecurityService } from '../modules/security/security.service.js';
import { TotpService } from '../modules/security/totp.service.js';
import { initDatabase } from '../database/index.js';

describe('Advanced Cybersecurity & SOC Intelligence Suite', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  describe('1. Session & Device Security Subsystem', () => {
    const testUser = { id: 'usr_test_001', username: 'alex.morgan', roleId: 'CUSTOMER' };
    const ipAddress = '203.0.113.19';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36';

    it('should recognize new client device and generate NEW_DEVICE security event', async () => {
      const { device, isNew } = SecurityService.registerOrVerifyDevice(testUser.id, testUser.username, ipAddress, userAgent);
      expect(isNew).toBe(true);
      expect(device.deviceId).toMatch(/^DEV-/);
      expect(device.status).toBe('NEW');

      // Subsequent check should recognize device as KNOWN
      const secondCheck = SecurityService.registerOrVerifyDevice(testUser.id, testUser.username, ipAddress, userAgent);
      expect(secondCheck.isNew).toBe(false);
      expect(secondCheck.device.deviceId).toBe(device.deviceId);
    });

    it('should register active session with 24-hour expiration', () => {
      const session = SecurityService.registerSession(testUser, ipAddress, userAgent);
      expect(session.sessionId).toMatch(/^SES-/);
      expect(session.status).toBe('ACTIVE');
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());

      const validated = SecurityService.validateSession(session.sessionId);
      expect(validated).not.toBeNull();
      expect(validated?.status).toBe('ACTIVE');
    });

    it('should immediately invalidate session on server-side revocation', () => {
      const session = SecurityService.registerSession(testUser, ipAddress, userAgent);
      const revoked = SecurityService.revokeSession(session.sessionId, 'SOC Admin');
      expect(revoked).toBe(true);

      const validated = SecurityService.validateSession(session.sessionId);
      expect(validated).toBeNull();
    });
  });

  describe('2. Security Event Correlation & Account Takeover (ATO) Detection', () => {
    const targetUser = 'rahul.sharma';
    const attackerIp = '198.51.100.99';

    it('should correlate failed login burst into Brute-Force incident', async () => {
      for (let i = 1; i <= 4; i++) {
        await SecurityService.recordEvent({
          severity: 'MEDIUM',
          category: 'AUTHENTICATION',
          eventType: 'LOGIN_FAILURE',
          actor: targetUser,
          source: 'Auth Gateway',
          action: 'LOGIN',
          resource: 'LOGIN_PORTAL',
          status: 'DENIED',
          ipAddress: attackerIp
        });
      }

      const incidents = SecurityService.getIncidents();
      const bfIncident = incidents.find(i => i.affectedUser === targetUser && i.title.includes('Brute Force'));
      expect(bfIncident).toBeDefined();
      expect(bfIncident?.severity).toBe('HIGH');
      expect(bfIncident?.riskScore).toBeGreaterThanOrEqual(70);
    });

    it('should trigger Account Takeover (ATO) correlation on credential failures followed by high-risk transfer', async () => {
      // Step 1: Login failures
      for (let i = 1; i <= 3; i++) {
        await SecurityService.recordEvent({
          severity: 'MEDIUM',
          category: 'AUTHENTICATION',
          eventType: 'LOGIN_FAILURE',
          actor: 'priya.singh',
          source: 'Web Login',
          action: 'LOGIN',
          resource: 'CUSTOMER_PORTAL',
          status: 'DENIED',
          ipAddress: '198.51.100.105'
        });
      }

      // Step 2: High value transaction attempt on flagged account
      await SecurityService.recordEvent({
        severity: 'CRITICAL',
        category: 'TRANSACTION',
        eventType: 'SUSPICIOUS_TRANSACTION',
        actor: 'priya.singh',
        source: 'Risk Engine',
        action: 'HIGH_VALUE_TRANSFER',
        resource: 'ACC-100002',
        riskScore: 94,
        status: 'HELD',
        ipAddress: '198.51.100.105'
      });

      const incidents = SecurityService.getIncidents();
      const atoIncident = incidents.find(i => i.affectedUser === 'priya.singh');
      expect(atoIncident).toBeDefined();
      expect(atoIncident?.riskScore).toBeGreaterThanOrEqual(90);
    });
  });

  describe('3. Privilege Escalation Pattern Detection', () => {
    it('should escalate single 403 attempt to CRITICAL incident on repeated pattern', async () => {
      const actor = 'retail.cust.01';

      // 3 consecutive 403 attempts in short window
      for (let i = 1; i <= 3; i++) {
        await SecurityService.recordEvent({
          severity: 'HIGH',
          category: 'AUTHORIZATION',
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          actor,
          actorRole: 'CUSTOMER',
          source: 'API RBAC Guard',
          action: 'INVOKE_ADMIN_API',
          resource: `/api/v1/network/reset-topology?try=${i}`,
          status: 'DENIED',
          ipAddress: '198.51.100.44'
        });
      }

      const incidents = SecurityService.getIncidents();
      const privIncident = incidents.find(i => i.affectedUser === actor);
      expect(privIncident).toBeDefined();
      expect(privIncident?.severity).toBe('CRITICAL');
      expect(privIncident?.riskScore).toBeGreaterThanOrEqual(90);
    });
  });

  describe('4. Educational Honeypot / Decoy Deception Engine', () => {
    it('should detect access to simulated decoy diagnostics and generate incident', async () => {
      const decoyEvent = await SecurityService.triggerDecoyAccess({
        path: '/api/v1/security/decoy/diagnostics',
        method: 'GET',
        actor: 'malicious.crawler',
        ipAddress: '198.51.100.77',
        userAgent: 'Nuclei/v3.0.0'
      });

      expect(decoyEvent.eventType).toBe('DECOY_RESOURCE_ACCESSED');
      expect(decoyEvent.status).toBe('BLOCKED');

      const incidents = SecurityService.getIncidents();
      const decoyIncident = incidents.find(i => i.affectedUser === 'malicious.crawler');
      expect(decoyIncident).toBeDefined();
      expect(decoyIncident?.title).toContain('Honeypot');
    });
  });

  describe('5. Incident Response Actions & Digital Forensics', () => {
    it('should update incident lifecycle and track resolution notes', () => {
      const incident = SecurityService.createIncident({
        title: 'Test Incident for Containment',
        description: 'Testing lifecycle transitions',
        severity: 'HIGH',
        correlationId: 'TEST-CORR-101',
        affectedUser: 'test.user',
        sourceEvents: ['EVT-001'],
        riskScore: 75
      });

      const updated = SecurityService.updateIncidentStatus(
        incident.incidentId,
        'CONTAINED',
        'Session revoked and step-up MFA required by SOC lead'
      );

      expect(updated?.status).toBe('CONTAINED');
      expect(updated?.resolution).toContain('step-up MFA');
    });

    it('should link correlationId across security events and incidents in forensic search', () => {
      const corrId = 'CORR-FORENSIC-888';
      SecurityService.createIncident({
        title: 'Correlated Forensic Incident',
        description: 'Linked with correlation ID',
        severity: 'MEDIUM',
        correlationId: corrId,
        sourceEvents: [],
        riskScore: 50
      });

      const results = SecurityService.searchForensics({ correlationId: corrId });
      expect(results.incidents.length).toBeGreaterThan(0);
      expect(results.incidents[0].correlationId).toBe(corrId);
    });
  });
});
