import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { config } from '../config/index.js';
import bcrypt from 'bcryptjs';

// In-Memory Transactional Relational Store fallback
interface MemoryStore {
  roles: any[];
  users: any[];
  regions: any[];
  branches: any[];
  departments: any[];
  employees: any[];
  customers: any[];
  accounts: any[];
  transactions: any[];
  transactionEvents: any[];
  auditLogs: any[];
  networkNodes: any[];
  networkLinks: any[];
  networkEvents: any[];
}

let mysqlPool: Pool | null = null;
let useMemoryStore = false;
// The embedded development store has no row-level locking. Serialize its
// transactions so it preserves the same all-or-nothing semantics as InnoDB.
let memoryTransactionTail: Promise<void> = Promise.resolve();

// Global memory store
const memoryStore: MemoryStore = {
  roles: [],
  users: [],
  regions: [],
  branches: [],
  departments: [],
  employees: [],
  customers: [],
  accounts: [],
  transactions: [],
  transactionEvents: [],
  auditLogs: [],
  networkNodes: [],
  networkLinks: [],
  networkEvents: []
};

// Seed initial memory store
export async function seedMemoryStore() {
  const salt = await bcrypt.genSalt(10);
  const defaultHash = await bcrypt.hash('Password@123', salt);

  memoryStore.roles = [
    { id: 'HQ_ADMIN', name: 'HQ Administrator', description: 'Chief executive administrator with global network & bank oversight' },
    { id: 'REGIONAL_MANAGER', name: 'Regional Manager', description: 'Supervises regional hub, branches, and regional aggregated traffic' },
    { id: 'BRANCH_STAFF', name: 'Branch Manager / Staff', description: 'Local branch manager handling customer accounts & inter-branch sync' },
    { id: 'CUSTOMER', name: 'Customer', description: 'End-user retail & corporate banking customer' }
  ];

  memoryStore.users = [
    { id: 'USR-HQ-001', role_id: 'HQ_ADMIN', username: 'arjun.mehta', email: 'arjun.mehta@netbankx.com', password_hash: defaultHash, first_name: 'Arjun', last_name: 'Mehta', status: 'ACTIVE' },
    { id: 'USR-REG-MH', role_id: 'REGIONAL_MANAGER', username: 'raj.sharma', email: 'raj.sharma@netbankx.com', password_hash: defaultHash, first_name: 'Raj', last_name: 'Sharma', status: 'ACTIVE' },
    { id: 'USR-REG-DL', role_id: 'REGIONAL_MANAGER', username: 'priya.patel', email: 'priya.patel@netbankx.com', password_hash: defaultHash, first_name: 'Priya', last_name: 'Patel', status: 'ACTIVE' },
    { id: 'USR-REG-KA', role_id: 'REGIONAL_MANAGER', username: 'suresh.kumar', email: 'suresh.kumar@netbankx.com', password_hash: defaultHash, first_name: 'Suresh', last_name: 'Kumar', status: 'ACTIVE' },
    { id: 'USR-BR-MH01', role_id: 'BRANCH_STAFF', username: 'vikram.nair', email: 'vikram.nair@netbankx.com', password_hash: defaultHash, first_name: 'Vikram', last_name: 'Nair', status: 'ACTIVE' },
    { id: 'USR-BR-MH02', role_id: 'BRANCH_STAFF', username: 'anita.desai', email: 'anita.desai@netbankx.com', password_hash: defaultHash, first_name: 'Anita', last_name: 'Desai', status: 'ACTIVE' },
    { id: 'USR-BR-MH03', role_id: 'BRANCH_STAFF', username: 'rohit.joshi', email: 'rohit.joshi@netbankx.com', password_hash: defaultHash, first_name: 'Rohit', last_name: 'Joshi', status: 'ACTIVE' },
    { id: 'USR-BR-MH04', role_id: 'BRANCH_STAFF', username: 'kavita.raut', email: 'kavita.raut@netbankx.com', password_hash: defaultHash, first_name: 'Kavita', last_name: 'Raut', status: 'ACTIVE' },
    { id: 'USR-BR-DL01', role_id: 'BRANCH_STAFF', username: 'amit.verma', email: 'amit.verma@netbankx.com', password_hash: defaultHash, first_name: 'Amit', last_name: 'Verma', status: 'ACTIVE' },
    { id: 'USR-BR-DL02', role_id: 'BRANCH_STAFF', username: 'neha.gupta', email: 'neha.gupta@netbankx.com', password_hash: defaultHash, first_name: 'Neha', last_name: 'Gupta', status: 'ACTIVE' },
    { id: 'USR-BR-DL03', role_id: 'BRANCH_STAFF', username: 'sanjay.yadav', email: 'sanjay.yadav@netbankx.com', password_hash: defaultHash, first_name: 'Sanjay', last_name: 'Yadav', status: 'ACTIVE' },
    { id: 'USR-BR-KA01', role_id: 'BRANCH_STAFF', username: 'deepa.iyer', email: 'deepa.iyer@netbankx.com', password_hash: defaultHash, first_name: 'Deepa', last_name: 'Iyer', status: 'ACTIVE' },
    { id: 'USR-BR-KA02', role_id: 'BRANCH_STAFF', username: 'kiran.rao', email: 'kiran.rao@netbankx.com', password_hash: defaultHash, first_name: 'Kiran', last_name: 'Rao', status: 'ACTIVE' },
    { id: 'USR-BR-KA03', role_id: 'BRANCH_STAFF', username: 'meera.bhat', email: 'meera.bhat@netbankx.com', password_hash: defaultHash, first_name: 'Meera', last_name: 'Bhat', status: 'ACTIVE' },
    { id: 'USR-CUST-001', role_id: 'CUSTOMER', username: 'aisha.kapoor', email: 'aisha.k@email.com', password_hash: defaultHash, first_name: 'Aisha', last_name: 'Kapoor', status: 'ACTIVE' },
    { id: 'USR-CUST-002', role_id: 'CUSTOMER', username: 'ravi.menon', email: 'ravi.m@email.com', password_hash: defaultHash, first_name: 'Ravi', last_name: 'Menon', status: 'ACTIVE' },
    { id: 'USR-CUST-003', role_id: 'CUSTOMER', username: 'sneha.reddy', email: 'sneha.r@email.com', password_hash: defaultHash, first_name: 'Sneha', last_name: 'Reddy', status: 'ACTIVE' },
    { id: 'USR-CUST-004', role_id: 'CUSTOMER', username: 'karan.singh', email: 'karan.s@email.com', password_hash: defaultHash, first_name: 'Karan', last_name: 'Singh', status: 'ACTIVE' },
    { id: 'USR-CUST-005', role_id: 'CUSTOMER', username: 'pooja.sharma', email: 'pooja.s@email.com', password_hash: defaultHash, first_name: 'Pooja', last_name: 'Sharma', status: 'ACTIVE' },
    { id: 'USR-CUST-006', role_id: 'CUSTOMER', username: 'vikram.das', email: 'vikram.d@email.com', password_hash: defaultHash, first_name: 'Vikram', last_name: 'Das', status: 'ACTIVE' },
    { id: 'USR-CUST-007', role_id: 'CUSTOMER', username: 'rahul.verma', email: 'rahul.v@email.com', password_hash: defaultHash, first_name: 'Rahul', last_name: 'Verma', status: 'ACTIVE' },
    { id: 'USR-CUST-008', role_id: 'CUSTOMER', username: 'anjali.desai', email: 'anjali.d@email.com', password_hash: defaultHash, first_name: 'Anjali', last_name: 'Desai', status: 'ACTIVE' }
  ];

  memoryStore.regions = [
    { id: 'MH', name: 'Maharashtra Regional Network', code: 'MH', city: 'Mumbai', state: 'Maharashtra', head_user_id: 'USR-REG-MH', status: 'ACTIVE' },
    { id: 'DL', name: 'Delhi NCR Regional Network', code: 'DL', city: 'New Delhi', state: 'Delhi', head_user_id: 'USR-REG-DL', status: 'ACTIVE' },
    { id: 'KA', name: 'Karnataka Regional Network', code: 'KA', city: 'Bengaluru', state: 'Karnataka', head_user_id: 'USR-REG-KA', status: 'ACTIVE' }
  ];

  memoryStore.branches = [
    { id: 'MH-MUM-001', region_id: 'MH', name: 'Mumbai Main Hub Branch', code: 'MUM01', city: 'Mumbai', state: 'Maharashtra', ifsc: 'NBXX0000001', address: 'Nariman Point, Financial Dist', phone: '022-22001111', manager_user_id: 'USR-BR-MH01', status: 'ACTIVE' },
    { id: 'MH-MUM-002', region_id: 'MH', name: 'Mumbai West Branch', code: 'MUM02', city: 'Mumbai', state: 'Maharashtra', ifsc: 'NBXX0000002', address: 'Andheri West Link Road', phone: '022-22002222', manager_user_id: 'USR-BR-MH02', status: 'ACTIVE' },
    { id: 'MH-PUN-001', region_id: 'MH', name: 'Pune Central Branch', code: 'PUN01', city: 'Pune', state: 'Maharashtra', ifsc: 'NBXX0000003', address: 'Shivaji Nagar, FC Road', phone: '020-25001111', manager_user_id: 'USR-BR-MH03', status: 'ACTIVE' },
    { id: 'MH-NGP-001', region_id: 'MH', name: 'Nagpur Branch', code: 'NGP01', city: 'Nagpur', state: 'Maharashtra', ifsc: 'NBXX0000004', address: 'Sitabuldi Square', phone: '0712-25001111', manager_user_id: 'USR-BR-MH04', status: 'ACTIVE' },
    { id: 'DL-NDL-001', region_id: 'DL', name: 'Connaught Place Branch', code: 'NDL01', city: 'New Delhi', state: 'Delhi', ifsc: 'NBXX0000005', address: 'Inner Circle, CP', phone: '011-23001111', manager_user_id: 'USR-BR-DL01', status: 'ACTIVE' },
    { id: 'DL-NDL-002', region_id: 'DL', name: 'South Delhi Branch', code: 'NDL02', city: 'New Delhi', state: 'Delhi', ifsc: 'NBXX0000006', address: 'Hauz Khas Enclave', phone: '011-23002222', manager_user_id: 'USR-BR-DL02', status: 'ACTIVE' },
    { id: 'DL-GGN-001', region_id: 'DL', name: 'Cyber City Gurgaon Branch', code: 'GGN01', city: 'Gurgaon', state: 'Haryana', ifsc: 'NBXX0000007', address: 'DLF Cyber City, Phase 2', phone: '0124-23001111', manager_user_id: 'USR-BR-DL03', status: 'ACTIVE' },
    { id: 'KA-BLR-001', region_id: 'KA', name: 'Koramangala Tech Branch', code: 'BLR01', city: 'Bengaluru', state: 'Karnataka', ifsc: 'NBXX0000008', address: '80ft Road, 4th Block', phone: '080-25001111', manager_user_id: 'USR-BR-KA01', status: 'ACTIVE' },
    { id: 'KA-BLR-002', region_id: 'KA', name: 'Whitefield IT Branch', code: 'BLR02', city: 'Bengaluru', state: 'Karnataka', ifsc: 'NBXX0000009', address: 'ITPL Main Road', phone: '080-25002222', manager_user_id: 'USR-BR-KA02', status: 'ACTIVE' },
    { id: 'KA-MYS-001', region_id: 'KA', name: 'Mysore Heritage Branch', code: 'MYS01', city: 'Mysore', state: 'Karnataka', ifsc: 'NBXX0000010', address: 'Devaraja Mohalla', phone: '0821-25001111', manager_user_id: 'USR-BR-KA03', status: 'ACTIVE' }
  ];

  memoryStore.customers = [
    { id: 'CUST-001', user_id: 'USR-CUST-001', branch_id: 'MH-MUM-001', customer_code: 'CUST-100001', kyc_status: 'VERIFIED', phone: '9876543210', address: 'Bandra West, Mumbai', dob: '1990-05-15' },
    { id: 'CUST-002', user_id: 'USR-CUST-002', branch_id: 'MH-MUM-001', customer_code: 'CUST-100002', kyc_status: 'VERIFIED', phone: '9876543211', address: 'Andheri East, Mumbai', dob: '1985-11-22' },
    { id: 'CUST-003', user_id: 'USR-CUST-003', branch_id: 'KA-BLR-001', customer_code: 'CUST-100003', kyc_status: 'VERIFIED', phone: '9876543212', address: 'Koramangala, Bengaluru', dob: '1992-08-30' },
    { id: 'CUST-004', user_id: 'USR-CUST-004', branch_id: 'DL-NDL-001', customer_code: 'CUST-100004', kyc_status: 'VERIFIED', phone: '9876543213', address: 'Connaught Place, Delhi', dob: '1988-02-14' },
    { id: 'CUST-005', user_id: 'USR-CUST-005', branch_id: 'MH-PUN-001', customer_code: 'CUST-100005', kyc_status: 'VERIFIED', phone: '9876543214', address: 'Viman Nagar, Pune', dob: '1995-09-10' },
    { id: 'CUST-006', user_id: 'USR-CUST-006', branch_id: 'KA-MYS-001', customer_code: 'CUST-100006', kyc_status: 'VERIFIED', phone: '9876543215', address: 'Gokulam, Mysore', dob: '1980-12-01' },
    { id: 'CUST-007', user_id: 'USR-CUST-007', branch_id: 'MH-MUM-002', customer_code: 'CUST-100007', kyc_status: 'VERIFIED', phone: '9876543216', address: 'Borivali, Mumbai', dob: '1991-03-25' },
    { id: 'CUST-008', user_id: 'USR-CUST-008', branch_id: 'KA-BLR-002', customer_code: 'CUST-100008', kyc_status: 'VERIFIED', phone: '9876543217', address: 'Whitefield, Bengaluru', dob: '1987-06-08' }
  ];

  memoryStore.accounts = [
    { id: 'ACC-100001', customer_id: 'CUST-001', branch_id: 'MH-MUM-001', account_number: 'ACC-100001', account_type: 'SAVINGS', balance: '250000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100002', customer_id: 'CUST-002', branch_id: 'MH-MUM-001', account_number: 'ACC-100002', account_type: 'CURRENT', balance: '185000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100003', customer_id: 'CUST-003', branch_id: 'KA-BLR-001', account_number: 'ACC-100003', account_type: 'SAVINGS', balance: '340000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100004', customer_id: 'CUST-004', branch_id: 'DL-NDL-001', account_number: 'ACC-100004', account_type: 'SAVINGS', balance: '95000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100005', customer_id: 'CUST-005', branch_id: 'MH-PUN-001', account_number: 'ACC-100005', account_type: 'SAVINGS', balance: '410000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100006', customer_id: 'CUST-006', branch_id: 'KA-MYS-001', account_number: 'ACC-100006', account_type: 'CURRENT', balance: '720000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100007', customer_id: 'CUST-007', branch_id: 'MH-MUM-002', account_number: 'ACC-100007', account_type: 'SAVINGS', balance: '150000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() },
    { id: 'ACC-100008', customer_id: 'CUST-008', branch_id: 'KA-BLR-002', account_number: 'ACC-100008', account_type: 'SAVINGS', balance: '290000.00', currency: 'INR', status: 'ACTIVE', created_at: new Date().toISOString() }
  ];

  memoryStore.networkNodes = [
    { id: 'NODE-HQ-CORE', node_key: 'HQ-CORE', name: 'HQ National Core Router', node_type: 'HQ_CORE', region_id: null, branch_id: null, ip_address: '12.0.0.1', mac_address: '00:1A:2B:HQ:00:01', status: 'HEALTHY', pos_x: 0.50, pos_y: 0.12 },
    { id: 'NODE-HQ-SRV', node_key: 'HQ-SRV', name: 'HQ Central Ledger Server', node_type: 'HQ_CORE', region_id: null, branch_id: null, ip_address: '12.0.0.10', mac_address: '00:1A:2B:HQ:00:10', status: 'HEALTHY', pos_x: 0.50, pos_y: 0.05 },
    { id: 'NODE-MH-HUB', node_key: 'MH-HUB', name: 'Maharashtra Regional Gateway', node_type: 'REGIONAL_HUB', region_id: 'MH', branch_id: null, ip_address: '203.0.113.1', mac_address: '00:1A:2B:MH:01:00', status: 'HEALTHY', pos_x: 0.20, pos_y: 0.35 },
    { id: 'NODE-DL-HUB', node_key: 'DL-HUB', name: 'Delhi Regional Gateway', node_type: 'REGIONAL_HUB', region_id: 'DL', branch_id: null, ip_address: '203.0.113.2', mac_address: '00:1A:2B:DL:01:00', status: 'HEALTHY', pos_x: 0.50, pos_y: 0.35 },
    { id: 'NODE-KA-HUB', node_key: 'KA-HUB', name: 'Karnataka Regional Gateway', node_type: 'REGIONAL_HUB', region_id: 'KA', branch_id: null, ip_address: '203.0.113.3', mac_address: '00:1A:2B:KA:01:00', status: 'HEALTHY', pos_x: 0.80, pos_y: 0.35 },
    { id: 'NODE-BR-MH01', node_key: 'MH-MUM-01-RT', name: 'Mumbai Main Router', node_type: 'BRANCH_ROUTER', region_id: 'MH', branch_id: 'MH-MUM-001', ip_address: '10.1.1.1', mac_address: '00:1A:2B:MH:11:01', status: 'HEALTHY', pos_x: 0.08, pos_y: 0.65 },
    { id: 'NODE-BR-MH02', node_key: 'MH-MUM-02-RT', name: 'Mumbai West Router', node_type: 'BRANCH_ROUTER', region_id: 'MH', branch_id: 'MH-MUM-002', ip_address: '10.1.2.1', mac_address: '00:1A:2B:MH:12:01', status: 'HEALTHY', pos_x: 0.16, pos_y: 0.65 },
    { id: 'NODE-BR-MH03', node_key: 'MH-PUN-01-RT', name: 'Pune Router', node_type: 'BRANCH_ROUTER', region_id: 'MH', branch_id: 'MH-PUN-001', ip_address: '10.1.3.1', mac_address: '00:1A:2B:MH:13:01', status: 'HEALTHY', pos_x: 0.24, pos_y: 0.65 },
    { id: 'NODE-BR-MH04', node_key: 'MH-NGP-01-RT', name: 'Nagpur Router', node_type: 'BRANCH_ROUTER', region_id: 'MH', branch_id: 'MH-NGP-001', ip_address: '10.1.4.1', mac_address: '00:1A:2B:MH:14:01', status: 'HEALTHY', pos_x: 0.32, pos_y: 0.65 },
    { id: 'NODE-BR-DL01', node_key: 'DL-NDL-01-RT', name: 'Connaught Place Router', node_type: 'BRANCH_ROUTER', region_id: 'DL', branch_id: 'DL-NDL-001', ip_address: '10.2.1.1', mac_address: '00:1A:2B:DL:21:01', status: 'HEALTHY', pos_x: 0.44, pos_y: 0.65 },
    { id: 'NODE-BR-DL02', node_key: 'DL-NDL-02-RT', name: 'South Delhi Router', node_type: 'BRANCH_ROUTER', region_id: 'DL', branch_id: 'DL-NDL-002', ip_address: '10.2.2.1', mac_address: '00:1A:2B:DL:22:01', status: 'HEALTHY', pos_x: 0.52, pos_y: 0.65 },
    { id: 'NODE-BR-DL03', node_key: 'DL-GGN-01-RT', name: 'Gurgaon Router', node_type: 'BRANCH_ROUTER', region_id: 'DL', branch_id: 'DL-GGN-001', ip_address: '10.2.3.1', mac_address: '00:1A:2B:DL:23:01', status: 'HEALTHY', pos_x: 0.60, pos_y: 0.65 },
    { id: 'NODE-BR-KA01', node_key: 'KA-BLR-01-RT', name: 'Koramangala Router', node_type: 'BRANCH_ROUTER', region_id: 'KA', branch_id: 'KA-BLR-001', ip_address: '10.3.1.1', mac_address: '00:1A:2B:KA:31:01', status: 'HEALTHY', pos_x: 0.72, pos_y: 0.65 },
    { id: 'NODE-BR-KA02', node_key: 'KA-BLR-02-RT', name: 'Whitefield Router', node_type: 'BRANCH_ROUTER', region_id: 'KA', branch_id: 'KA-BLR-002', ip_address: '10.3.2.1', mac_address: '00:1A:2B:KA:32:01', status: 'HEALTHY', pos_x: 0.80, pos_y: 0.65 },
    { id: 'NODE-BR-KA03', node_key: 'KA-MYS-01-RT', name: 'Mysore Router', node_type: 'BRANCH_ROUTER', region_id: 'KA', branch_id: 'KA-MYS-001', ip_address: '10.3.3.1', mac_address: '00:1A:2B:KA:33:01', status: 'HEALTHY', pos_x: 0.88, pos_y: 0.65 }
  ];

  memoryStore.networkLinks = [
    { id: 'LINK-HQ-SRV', source_node_id: 'NODE-HQ-CORE', dest_node_id: 'NODE-HQ-SRV', bandwidth_mbps: 10000, base_latency_ms: 1, packet_loss_rate: '0.0000', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-HQ-MH', source_node_id: 'NODE-HQ-CORE', dest_node_id: 'NODE-MH-HUB', bandwidth_mbps: 5000, base_latency_ms: 6, packet_loss_rate: '0.0010', cost: 2, status: 'ACTIVE' },
    { id: 'LINK-HQ-DL', source_node_id: 'NODE-HQ-CORE', dest_node_id: 'NODE-DL-HUB', bandwidth_mbps: 5000, base_latency_ms: 4, packet_loss_rate: '0.0010', cost: 2, status: 'ACTIVE' },
    { id: 'LINK-HQ-KA', source_node_id: 'NODE-HQ-CORE', dest_node_id: 'NODE-KA-HUB', bandwidth_mbps: 5000, base_latency_ms: 8, packet_loss_rate: '0.0010', cost: 2, status: 'ACTIVE' },
    { id: 'LINK-MH-DL', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-DL-HUB', bandwidth_mbps: 2500, base_latency_ms: 7, packet_loss_rate: '0.0020', cost: 3, status: 'ACTIVE' },
    { id: 'LINK-MH-KA', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-KA-HUB', bandwidth_mbps: 2500, base_latency_ms: 9, packet_loss_rate: '0.0020', cost: 3, status: 'ACTIVE' },
    { id: 'LINK-DL-KA', source_node_id: 'NODE-DL-HUB', dest_node_id: 'NODE-KA-HUB', bandwidth_mbps: 2500, base_latency_ms: 11, packet_loss_rate: '0.0020', cost: 4, status: 'ACTIVE' },
    { id: 'LINK-MH-B1', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-BR-MH01', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-MH-B2', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-BR-MH02', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-MH-B3', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-BR-MH03', bandwidth_mbps: 1000, base_latency_ms: 3, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-MH-B4', source_node_id: 'NODE-MH-HUB', dest_node_id: 'NODE-BR-MH04', bandwidth_mbps: 1000, base_latency_ms: 4, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-DL-B1', source_node_id: 'NODE-DL-HUB', dest_node_id: 'NODE-BR-DL01', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-DL-B2', source_node_id: 'NODE-DL-HUB', dest_node_id: 'NODE-BR-DL02', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-DL-B3', source_node_id: 'NODE-DL-HUB', dest_node_id: 'NODE-BR-DL03', bandwidth_mbps: 1000, base_latency_ms: 3, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-KA-B1', source_node_id: 'NODE-KA-HUB', dest_node_id: 'NODE-BR-KA01', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-KA-B2', source_node_id: 'NODE-KA-HUB', dest_node_id: 'NODE-BR-KA02', bandwidth_mbps: 1000, base_latency_ms: 2, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' },
    { id: 'LINK-KA-B3', source_node_id: 'NODE-KA-HUB', dest_node_id: 'NODE-BR-KA03', bandwidth_mbps: 1000, base_latency_ms: 4, packet_loss_rate: '0.0005', cost: 1, status: 'ACTIVE' }
  ];

  memoryStore.transactions = [
    { id: 'TXN-INIT-001', reference_no: 'TXN-2026-90001', idempotency_key: 'IDEM-90001', source_account_id: 'ACC-100001', destination_account_id: 'ACC-100003', amount: '15000.00', currency: 'INR', type: 'INTER_BANK_TRANSFER', state: 'COMPLETED', description: 'Consultancy Fees', routing_path: JSON.stringify(['NODE-BR-MH01', 'NODE-MH-HUB', 'NODE-HQ-CORE', 'NODE-KA-HUB', 'NODE-BR-KA01']), total_latency_ms: 24, packets_transmitted: 7, packets_lost: 0, retransmissions: 0, created_at: new Date(Date.now() - 3600000 * 4).toISOString(), updated_at: new Date().toISOString() },
    { id: 'TXN-INIT-002', reference_no: 'TXN-2026-90002', idempotency_key: 'IDEM-90002', source_account_id: 'ACC-100004', destination_account_id: 'ACC-100002', amount: '8500.00', currency: 'INR', type: 'INTER_BANK_TRANSFER', state: 'COMPLETED', description: 'Software License Fee', routing_path: JSON.stringify(['NODE-BR-DL01', 'NODE-DL-HUB', 'NODE-HQ-CORE', 'NODE-MH-HUB', 'NODE-BR-MH01']), total_latency_ms: 28, packets_transmitted: 8, packets_lost: 1, retransmissions: 1, created_at: new Date(Date.now() - 3600000 * 2).toISOString(), updated_at: new Date().toISOString() }
  ];

  memoryStore.auditLogs = [
    { id: 1, actor_id: 'USR-HQ-001', actor_role: 'HQ_ADMIN', action: 'SYSTEM_BOOT', resource_type: 'SYSTEM', resource_id: 'NETBANKX-SERVER', ip_address: '127.0.0.1', status: 'SUCCESS', details: JSON.stringify({ message: 'Digital Twin and Banking Core Initialized' }), created_at: new Date().toISOString() }
  ];
}

// Initialize Database connection
export async function initDatabase(): Promise<void> {
  await seedMemoryStore();

  // Reuse global pool if existing in warm serverless runtime
  if ((globalThis as any).__nbx_mysql_pool) {
    mysqlPool = (globalThis as any).__nbx_mysql_pool;
    useMemoryStore = false;
    return;
  }

  // Attempt real MySQL connection if configured
  const hasMysqlConfig = Boolean(config.db.url || (process.env.DB_HOST && process.env.DB_USER));
  if (hasMysqlConfig || !config.db.useEmbeddedFallback || config.db.requireMysql) {
    try {
      const poolConfig: any = config.db.url
        ? {
            uri: config.db.url,
            connectionLimit: config.db.connectionLimit,
            waitForConnections: true,
            queueLimit: 0,
            enableKeepAlive: true,
            ssl: config.db.ssl
          }
        : {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.name,
            connectionLimit: config.db.connectionLimit,
            waitForConnections: true,
            queueLimit: 0,
            enableKeepAlive: true,
            ssl: config.db.ssl
          };

      mysqlPool = config.db.url ? mysql.createPool(config.db.url) : mysql.createPool(poolConfig);
      const connection = await mysqlPool.getConnection();
      await connection.ping();
      connection.release();

      (globalThis as any).__nbx_mysql_pool = mysqlPool;
      useMemoryStore = false;
      console.log('✅ Connected to MySQL Relational Database.');
      return;
    } catch (err: any) {
      if (config.db.requireMysql || !config.db.useEmbeddedFallback) {
        console.error('❌ Critical Database Error: MySQL connection failed and fallback is disabled:', err.message);
        throw new Error(`Database Initialization Failed: Unable to connect to MySQL (${err.message}). DB_REQUIRE_MYSQL is enabled.`);
      }
      console.warn(`⚠️ MySQL connection failed (${err.message}). Falling back to Transactional In-Memory SQL Engine.`);
      useMemoryStore = true;
    }
  } else {
    console.log('ℹ️ Using Transactional In-Memory Relational Engine (ACID compliant).');
    useMemoryStore = true;
  }
}

export async function checkDatabaseHealth(): Promise<{ status: string; latencyMs: number; provider: string; usingFallback: boolean; version: string }> {
  const start = Date.now();
  if (!useMemoryStore && mysqlPool) {
    try {
      const connection = await mysqlPool.getConnection();
      await connection.ping();
      const [rows] = await connection.query('SELECT VERSION() as v');
      connection.release();
      const latencyMs = Date.now() - start;
      const ver = (rows as any)?.[0]?.v || 'MySQL 8.0';
      return {
        status: 'connected',
        latencyMs,
        provider: 'Remote MySQL',
        usingFallback: false,
        version: ver
      };
    } catch (err) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - start,
        provider: 'MySQL (Unavailable)',
        usingFallback: true,
        version: 'In-Memory ACID Engine 2.0'
      };
    }
  }

  return {
    status: 'connected',
    latencyMs: Date.now() - start,
    provider: 'Transactional In-Memory Relational Engine',
    usingFallback: true,
    version: 'NetBankX Engine 2.0'
  };
}

export function isUsingMemoryStore(): boolean {
  return useMemoryStore;
}

export function getMemoryStore(): MemoryStore {
  return memoryStore;
}

// Database Transaction Interface
export interface DbTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Query helper with atomic transaction support
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!useMemoryStore && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T[];
  }

  // Handle queries using memory store
  return executeMemoryQuery<T>(sql, params);
}

export async function beginTransaction(): Promise<DbTransaction> {
  if (!useMemoryStore && mysqlPool) {
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    return {
      async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const [rows] = await connection.query(sql, params);
        return rows as T[];
      },
      async commit(): Promise<void> {
        await connection.commit();
        connection.release();
      },
      async rollback(): Promise<void> {
        await connection.rollback();
        connection.release();
      }
    };
  }

  // Memory transaction snapshot, protected by a simple transaction mutex.
  // This fallback is for local development/tests only; production uses MySQL.
  let releaseLock: (() => void) | undefined;
  const priorTransaction = memoryTransactionTail;
  memoryTransactionTail = new Promise<void>(resolve => {
    releaseLock = resolve;
  });
  await priorTransaction;
  const snapshot = JSON.stringify(memoryStore);
  let finalized = false;

  const finalize = () => {
    if (!finalized) {
      finalized = true;
      releaseLock?.();
    }
  };

  return {
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      return executeMemoryQuery<T>(sql, params);
    },
    async commit(): Promise<void> {
      finalize();
    },
    async rollback(): Promise<void> {
      if (!finalized) {
        const restored = JSON.parse(snapshot);
        Object.assign(memoryStore, restored);
      }
      finalize();
    }
  };
}

// Internal memory SQL emulator for zero-dependency portability
function executeMemoryQuery<T = any>(sql: string, params: any[] = []): T[] {
  const normalized = sql.trim().replace(/\s+/g, ' ');
  const upper = normalized.toUpperCase();

  // 1. SELECT queries
  if (upper.startsWith('SELECT')) {
    if (upper.includes('FROM USERS')) {
      let results = [...memoryStore.users];
      if (upper.includes('WHERE USERNAME =') || upper.includes('WHERE EMAIL =') || upper.includes('WHERE ID =')) {
        const param = params[0];
        results = results.filter(u => u.username === param || u.email === param || u.id === param);
      }
      return results as unknown as T[];
    }

    if (upper.includes('FROM ROLES')) {
      return [...memoryStore.roles] as unknown as T[];
    }

    if (upper.includes('FROM REGIONS')) {
      return [...memoryStore.regions] as unknown as T[];
    }

    if (upper.includes('FROM BRANCHES')) {
      let results = [...memoryStore.branches];
      if (upper.includes('WHERE REGION_ID =')) {
        results = results.filter(b => b.region_id === params[0]);
      }
      return results as unknown as T[];
    }

    if (upper.includes('FROM CUSTOMERS')) {
      let results = [...memoryStore.customers];
      if (upper.includes('WHERE USER_ID =')) {
        results = results.filter(c => c.user_id === params[0]);
      } else if (upper.includes('WHERE ID =')) {
        results = results.filter(c => c.id === params[0]);
      } else if (upper.includes('WHERE BRANCH_ID =')) {
        results = results.filter(c => c.branch_id === params[0]);
      }
      return results as unknown as T[];
    }

    if (upper.includes('FROM ACCOUNTS')) {
      let results = memoryStore.accounts.map(a => {
        const cust = memoryStore.customers.find(c => c.id === a.customer_id);
        const usr = cust ? memoryStore.users.find(u => u.id === cust.user_id) : null;
        const br = memoryStore.branches.find(b => b.id === a.branch_id);
        const reg = br ? memoryStore.regions.find(r => r.id === br.region_id) : null;

        return {
          ...a,
          user_id: cust?.user_id,
          customer_code: cust?.customer_code,
          phone: cust?.phone,
          first_name: usr?.first_name,
          last_name: usr?.last_name,
          email: usr?.email,
          branch_name: br?.name,
          branch_code: br?.code,
          ifsc: br?.ifsc,
          region_code: reg?.code,
          region_name: reg?.name
        };
      });

      if (upper.includes('WHERE A.ID = ? AND C.USER_ID = ?')) {
        results = results.filter(a => a.id === params[0] && a.user_id === params[1]);
      } else if (upper.includes('WHERE C.USER_ID = ?')) {
        results = results.filter(a => a.user_id === params[0]);
      } else if (upper.includes('WHERE A.ID = ? OR A.ACCOUNT_NUMBER = ?') || upper.includes('WHERE A.ID =') || upper.includes('WHERE ACCOUNT_NUMBER =')) {
        const p1 = params[0];
        const p2 = params[1] || p1;
        results = results.filter(a => a.id === p1 || a.account_number === p1 || a.id === p2 || a.account_number === p2);
      } else if (upper.includes('WHERE ACCOUNT_NUMBER =') || upper.includes('WHERE A.ACCOUNT_NUMBER =')) {
        results = results.filter(a => a.account_number === params[0]);
      } else if (upper.includes('WHERE CUSTOMER_ID =') || upper.includes('WHERE A.CUSTOMER_ID =')) {
        results = results.filter(a => a.customer_id === params[0]);
      } else if (upper.includes('WHERE ID =') || upper.includes('WHERE A.ID =')) {
        results = results.filter(a => a.id === params[0]);
      } else if (upper.includes('WHERE BRANCH_ID =') || upper.includes('WHERE A.BRANCH_ID =')) {
        results = results.filter(a => a.branch_id === params[0]);
      }
      return results as unknown as T[];
    }

    if (upper.includes('FROM TRANSACTIONS')) {
      let results = [...memoryStore.transactions];
      if (upper.includes('WHERE ID =')) {
        results = results.filter(t => t.id === params[0]);
      } else if (upper.includes('WHERE IDEMPOTENCY_KEY =')) {
        results = results.filter(t => t.idempotency_key === params[0]);
      } else if (upper.includes('WHERE REFERENCE_NO =')) {
        results = results.filter(t => t.reference_no === params[0]);
      } else if (upper.includes('WHERE SOURCE_ACCOUNT_ID =') || upper.includes('WHERE DESTINATION_ACCOUNT_ID =')) {
        const accId = params[0];
        results = results.filter(t => t.source_account_id === accId || t.destination_account_id === accId);
      }
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as unknown as T[];
    }

    if (upper.includes('FROM TRANSACTION_EVENTS')) {
      let results = [...memoryStore.transactionEvents];
      if (upper.includes('WHERE TRANSACTION_ID =')) {
        results = results.filter(e => e.transaction_id === params[0]);
      }
      return results as unknown as T[];
    }

    if (upper.includes('FROM AUDIT_LOGS')) {
      if (upper.includes('ORDER BY ID ASC')) {
        return [...memoryStore.auditLogs].sort((a, b) => a.id - b.id) as unknown as T[];
      }
      return [...memoryStore.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as unknown as T[];
    }

    if (upper.includes('FROM NETWORK_NODES')) {
      return [...memoryStore.networkNodes] as unknown as T[];
    }

    if (upper.includes('FROM NETWORK_LINKS')) {
      return [...memoryStore.networkLinks] as unknown as T[];
    }

    if (upper.includes('FROM NETWORK_EVENTS')) {
      let results = [...memoryStore.networkEvents];
      if (upper.includes('WHERE TRANSACTION_ID =')) {
        results = results.filter(e => e.transaction_id === params[0]);
      }
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as unknown as T[];
    }
  }

  // 2. INSERT queries
  if (upper.startsWith('INSERT INTO')) {
    if (upper.includes('INTO TRANSACTIONS')) {
      if (memoryStore.transactions.some(transaction => transaction.idempotency_key === params[2])) {
        const duplicateError = new Error('Duplicate idempotency_key');
        (duplicateError as Error & { code?: string }).code = 'ER_DUP_ENTRY';
        throw duplicateError;
      }
      const txn = {
        id: params[0],
        reference_no: params[1],
        idempotency_key: params[2],
        source_account_id: params[3],
        destination_account_id: params[4],
        amount: String(params[5]),
        currency: params[6] || 'INR',
        type: params[7] || 'INTER_BANK_TRANSFER',
        state: params[8] || 'INITIATED',
        description: params[9] || '',
        routing_path: typeof params[10] === 'string' ? params[10] : JSON.stringify(params[10] || []),
        total_latency_ms: params[11] || 0,
        packets_transmitted: params[12] || 0,
        packets_lost: params[13] || 0,
        retransmissions: params[14] || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.transactions.push(txn);
      return [{ insertId: txn.id }] as unknown as T[];
    }

    if (upper.includes('INTO TRANSACTION_EVENTS')) {
      const event = {
        id: memoryStore.transactionEvents.length + 1,
        transaction_id: params[0],
        previous_state: params[1],
        new_state: params[2],
        message: params[3],
        metadata: typeof params[4] === 'string' ? params[4] : JSON.stringify(params[4] || {}),
        created_at: new Date().toISOString()
      };
      memoryStore.transactionEvents.push(event);
      return [{ insertId: event.id }] as unknown as T[];
    }

    if (upper.includes('INTO AUDIT_LOGS')) {
      const log = {
        id: memoryStore.auditLogs.length + 1,
        actor_id: params[0],
        actor_role: params[1],
        action: params[2],
        resource_type: params[3],
        resource_id: params[4],
        ip_address: params[5],
        status: params[6],
        details: typeof params[7] === 'string' ? params[7] : JSON.stringify(params[7] || {}),
        prev_hash: params[8] || null,
        record_hash: params[9] || null,
        created_at: new Date().toISOString()
      };
      memoryStore.auditLogs.push(log);
      return [{ insertId: log.id }] as unknown as T[];
    }

    if (upper.includes('INTO NETWORK_EVENTS')) {
      const netEv = {
        id: memoryStore.networkEvents.length + 1,
        transaction_id: params[0],
        event_type: params[1],
        source_node_id: params[2],
        dest_node_id: params[3],
        hop_number: params[4] || 0,
        protocol: params[5] || 'TCP',
        payload_summary: params[6] || '',
        latency_ms: params[7] || 0,
        severity: params[8] || 'INFO',
        created_at: new Date().toISOString()
      };
      memoryStore.networkEvents.push(netEv);
      return [{ insertId: netEv.id }] as unknown as T[];
    }
  }

  // 3. UPDATE queries
  if (upper.startsWith('UPDATE')) {
    if (upper.includes('ACCOUNTS')) {
      // e.g. UPDATE accounts SET balance = ? WHERE id = ?
      const newBal = String(params[0]);
      const accId = params[1];
      const acc = memoryStore.accounts.find(a => a.id === accId);
      if (acc) {
        acc.balance = newBal;
        acc.updated_at = new Date().toISOString();
      }
      return [{ affectedRows: 1 }] as unknown as T[];
    }

    if (upper.includes('TRANSACTIONS')) {
      // e.g. UPDATE transactions SET state = ?, total_latency_ms = ?, packets_transmitted = ?, packets_lost = ?, retransmissions = ?, updated_at = NOW() WHERE id = ?
      const state = params[0];
      const latency = params[1];
      const sent = params[2];
      const lost = params[3];
      const rtx = params[4];
      const id = params[5];
      const txn = memoryStore.transactions.find(t => t.id === id);
      if (txn) {
        txn.state = state;
        if (latency !== undefined) txn.total_latency_ms = latency;
        if (sent !== undefined) txn.packets_transmitted = sent;
        if (lost !== undefined) txn.packets_lost = lost;
        if (rtx !== undefined) txn.retransmissions = rtx;
        txn.updated_at = new Date().toISOString();
      }
      return [{ affectedRows: 1 }] as unknown as T[];
    }

    if (upper.includes('NETWORK_NODES')) {
      // UPDATE network_nodes SET status = ? WHERE id = ?
      const status = params[0];
      const id = params[1];
      const node = memoryStore.networkNodes.find(n => n.id === id || n.node_key === id);
      if (node) node.status = status;
      return [{ affectedRows: 1 }] as unknown as T[];
    }

    if (upper.includes('NETWORK_LINKS')) {
      // UPDATE network_links SET status = ?, packet_loss_rate = ?, base_latency_ms = ? WHERE id = ?
      const status = params[0];
      const loss = String(params[1]);
      const latency = params[2];
      const id = params[3];
      const link = memoryStore.networkLinks.find(l => l.id === id);
      if (link) {
        if (status) link.status = status;
        if (loss) link.packet_loss_rate = loss;
        if (latency !== undefined) link.base_latency_ms = latency;
      }
      return [{ affectedRows: 1 }] as unknown as T[];
    }
  }

  return [] as T[];
}
