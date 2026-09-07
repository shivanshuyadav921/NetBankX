import { PacketSimulator } from '../modules/network/packet.simulator.js';
import { NetworkService } from '../modules/network/network.service.js';
import { initDatabase } from '../database/index.js';

describe('PacketSimulator & Educational TCP Reliability Suite', () => {
  beforeAll(async () => {
    await initDatabase();
    await NetworkService.initializeTopology();
  });

  it('should compute real simulation metrics after transaction packet flow', async () => {
    const route = await NetworkService.calculateRoute('NODE-BR-MH01', 'NODE-BR-KA01');
    const nodeMap = await NetworkService.getNodeMap();
    const linkMap = await NetworkService.getLinkMap();

    const simResult = await PacketSimulator.simulateTransactionFlow(
      'TEST-TXN-001',
      route,
      nodeMap,
      linkMap,
      'Test Payload',
      10.0 // Fast execution for tests
    );

    expect(simResult.success).toBe(true);
    expect(simResult.packetsTransmitted).toBeGreaterThan(0);

    const metrics = PacketSimulator.getMetrics();
    expect(metrics.packetsSent).toBeGreaterThan(0);
    expect(metrics.packetsDelivered).toBeGreaterThan(0);
    expect(metrics.successfulTransactions).toBeGreaterThan(0);
  });

  it('should trigger retransmissions when packet loss rate is high', async () => {
    // Override fault parameters to simulate high loss
    PacketSimulator.setFaultParams({ globalLossRateOverride: 0.99 });

    const route = await NetworkService.calculateRoute('NODE-BR-MH01', 'NODE-BR-DL01');
    const nodeMap = await NetworkService.getNodeMap();
    const linkMap = await NetworkService.getLinkMap();

    const simResult = await PacketSimulator.simulateTransactionFlow(
      'TEST-TXN-LOSS',
      route,
      nodeMap,
      linkMap,
      'Loss Test Payload',
      20.0
    );

    expect(simResult.packetsLost).toBeGreaterThan(0);
    expect(simResult.retransmissions).toBeGreaterThan(0);

    // Reset fault params
    PacketSimulator.setFaultParams({ globalLossRateOverride: 0.0 });
  });
});
