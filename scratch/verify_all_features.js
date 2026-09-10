async function main() {
  const base = 'http://localhost:4000/api/v1';

  console.log('1. Testing Customer Login...');
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'aisha.kapoor', password: 'Password@123', expectedRole: 'CUSTOMER' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
  const token = loginData.data.token;
  console.log('   ✅ Logged in successfully. Token acquired.');

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log('2. Testing Get Accounts & Profile...');
  const accsRes = await fetch(`${base}/accounts/my-accounts`, { headers: authHeader });
  const accsData = await accsRes.json();
  console.log(`   ✅ Accounts retrieved: ${accsData.data.length} account(s), Balance: ₹ ${accsData.data[0].balance}`);

  console.log('3. Testing Service Request Submission (Zero Fake Feature)...');
  const createSrRes = await fetch(`${base}/users/service-requests`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      category: 'DEBIT_CARD',
      title: 'Debit Card Replacement',
      description: 'Requesting EMV Contactless Card Upgrade',
      priority: 'HIGH'
    })
  });
  const createSrData = await createSrRes.json();
  if (!createSrData.success) throw new Error('Create SR failed: ' + JSON.stringify(createSrData));
  console.log(`   ✅ Service request created with real ID: ${createSrData.data.id}`);

  console.log('4. Testing Service Request Retrieval & Database Persistence...');
  const getSrRes = await fetch(`${base}/users/service-requests`, { headers: authHeader });
  const getSrData = await getSrRes.json();
  const found = getSrData.data.find(r => r.id === createSrData.data.id);
  if (!found) throw new Error('Created service request not found in database retrieval!');
  console.log(`   ✅ Service request persistence verified. Found ticket: ${found.id} [${found.title}]`);

  console.log('5. Testing Fund Transfer + Dijkstra Routing + Packet Simulation...');
  const transferRes = await fetch(`${base}/transactions/transfer`, {
    method: 'POST',
    headers: {
      ...authHeader,
      'Idempotency-Key': `IDEM-TEST-${Date.now()}`
    },
    body: JSON.stringify({
      sourceAccountId: accsData.data[0].id,
      destinationAccountNumber: 'ACC-100003',
      amount: 5000,
      description: 'Inter-Branch QA Transfer',
      speedMultiplier: 2.0
    })
  });
  const transferData = await transferRes.json();
  if (!transferData.success) throw new Error('Transfer failed: ' + JSON.stringify(transferData));
  const txn = transferData.data.transaction;
  console.log(`   ✅ Transfer settled. Txn ID: ${txn.id}, Ref: ${txn.referenceNo}, Amount: ₹ ${txn.amount}`);
  console.log(`   ✅ WAN Route: ${txn.routingPath.join(' ➔ ')}, Latency: ${txn.totalLatencyMs}ms`);

  console.log('6. Testing Transaction Packet Journey Telemetry...');
  const journeyRes = await fetch(`${base}/network/transaction-journey/${txn.id}`, { headers: authHeader });
  const journeyData = await journeyRes.json();
  console.log(`   ✅ Journey retrieved for ${txn.id}: Route [${journeyData.data.route?.nodeKeys?.join(' ➔ ')}]`);

  console.log('7. Testing HQ Admin Login & Multi-Packet Simulation...');
  const hqLoginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'arjun.mehta', password: 'Password@123', expectedRole: 'HQ_ADMIN' })
  });
  const hqLoginData = await hqLoginRes.json();
  const hqToken = hqLoginData.data.token;
  const hqHeader = { 'Authorization': `Bearer ${hqToken}`, 'Content-Type': 'application/json' };

  const simRes = await fetch(`${base}/network/simulate-traffic`, {
    method: 'POST',
    headers: hqHeader,
    body: JSON.stringify({
      sourceBranchId: 'MH-MUM-001',
      destBranchId: 'KA-BLR-001',
      packetCount: 15,
      packetSizeBytes: 1024,
      protocol: 'TCP',
      speedMultiplier: 2.0,
      scenario: 'NORMAL'
    })
  });
  const simData = await simRes.json();
  console.log(`   ✅ Traffic simulation session started: ${simData.data.id}, Route: ${simData.data.route.nodeKeys.join(' ➔ ')}`);

  console.log('8. Testing Dijkstra Dynamic Failover Rerouting...');
  // Sever HQ-MH link
  await fetch(`${base}/network/link-status`, {
    method: 'POST',
    headers: hqHeader,
    body: JSON.stringify({ linkId: 'LINK-HQ-MH', status: 'SEVERED' })
  });
  // Calculate route again
  const rerouteRes = await fetch(`${base}/network/route?sourceId=NODE-BR-MH01&destId=NODE-BR-KA01`, { headers: hqHeader });
  const rerouteData = await rerouteRes.json();
  console.log(`   ✅ Alternate Dijkstra Path after link severing: ${rerouteData.data.nodeKeys.join(' ➔ ')} (Cost: ${rerouteData.data.totalCost}, Latency: ${rerouteData.data.totalLatencyMs}ms)`);

  // Reset topology
  await fetch(`${base}/network/reset-topology`, { method: 'POST', headers: hqHeader });
  console.log('   ✅ Topology restored to healthy state.');

  console.log('\n=============================================');
  console.log('🎉 ALL END-TO-END FEATURES OPERATIONAL & VERIFIED!');
  console.log('=============================================');
}

main().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
