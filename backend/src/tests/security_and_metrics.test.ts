import { AuditService } from '../modules/audit/audit.service.js';
import { TransactionService } from '../modules/transactions/transaction.service.js';
import { PacketSimulator } from '../modules/network/packet.simulator.js';
import { NetworkService } from '../modules/network/network.service.js';
import { initDatabase, executeQuery } from '../database/index.js';

describe('Security Upgrades, Audit Integrity & Enhanced Network Suite', () => {
  beforeAll(async () => {
    await initDatabase();
    await NetworkService.initializeTopology();
  });

  describe('Cryptographic Audit Hash-Chain Integrity', () => {
    it('should calculate valid SHA-256 hash chains across consecutive audit events', async () => {
      await AuditService.log({
        actorId: 'USR-TEST-001',
        actorRole: 'HQ_ADMIN',
        action: 'SECURITY_TEST_EVENT_A',
        resourceType: 'TEST',
        ipAddress: '192.168.1.100',
        status: 'SUCCESS',
        details: { step: 1 }
      });

      await AuditService.log({
        actorId: 'USR-TEST-001',
        actorRole: 'HQ_ADMIN',
        action: 'SECURITY_TEST_EVENT_B',
        resourceType: 'TEST',
        ipAddress: '192.168.1.100',
        status: 'SUCCESS',
        details: { step: 2 }
      });

      const result = await AuditService.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.status).toBe('VERIFIED');
      expect(result.totalRecordsChecked).toBeGreaterThan(0);
      expect(result.latestHash).toBeDefined();
    });

    it('should detect simulated tampering in the audit log hash chain', async () => {
      // Intentionally insert a tampered record with broken prev_hash
      await executeQuery(
        `INSERT INTO audit_logs (actor_id, actor_role, action, resource_type, resource_id, ip_address, status, details, prev_hash, record_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'MALICIOUS-ACTOR',
          'ATTACKER',
          'UNAUTHORIZED_TAMPER',
          'AUDIT',
          'RES-999',
          '10.0.0.99',
          'DENIED',
          '{"tampered":true}',
          'CORRUPTED_PREV_HASH_12345',
          'INVALID_HASH_67890'
        ]
      );

      const result = await AuditService.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect(result.status).toBe('AUDIT INTEGRITY FAILURE');
      expect(result.details).toContain('AUDIT INTEGRITY FAILURE');
    });
  });

  describe('Educational Transaction Risk Scoring Engine', () => {
    it('should score normal low-value local transactions as LOW risk', () => {
      const assessment = TransactionService.assessRisk(5000, 'MH-MUM-001', 'MH-MUM-001', 2);
      expect(assessment.riskLevel).toBe('LOW');
      expect(assessment.requiredAction).toBe('ALLOW');
      expect(assessment.riskScore).toBeLessThan(35);
    });

    it('should score large inter-branch transactions as HIGH risk', () => {
      const assessment = TransactionService.assessRisk(150000, 'MH-MUM-001', 'KA-BLR-001', 5);
      expect(assessment.riskLevel).toBe('HIGH');
      expect(assessment.requiredAction).toBe('FLAG_FOR_REVIEW');
      expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Zero-Loss Simulation & Exact Packet Counting', () => {
    it('should not experience any packet loss when global loss rate is forced to 0.0', async () => {
      PacketSimulator.setFaultParams({ globalLossRateOverride: 0.0 });

      const route = await NetworkService.calculateRoute('NODE-BR-MH01', 'NODE-BR-MH02');
      const nodeMap = await NetworkService.getNodeMap();
      const linkMap = await NetworkService.getLinkMap();

      const simResult = await PacketSimulator.simulateTransactionFlow(
        'TEST-TXN-ZERO-LOSS',
        route,
        nodeMap,
        linkMap,
        'Zero Loss Payload',
        50.0
      );

      expect(simResult.success).toBe(true);
      expect(simResult.packetsLost).toBe(0);
      expect(simResult.retransmissions).toBe(0);
      expect(simResult.packetsTransmitted).toBe(route.hopCount + 2); // 2 handshakes + hops
    });
  });
});
