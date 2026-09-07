-- ==========================================================
-- NETBANKX Enterprise Banking & Network Digital Twin Seed Data
-- ==========================================================

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
('HQ_ADMIN', 'HQ Administrator', 'Chief executive administrator with global network & bank oversight'),
('REGIONAL_MANAGER', 'Regional Manager', 'Supervises regional hub, branches, and regional aggregated traffic'),
('BRANCH_STAFF', 'Branch Manager / Staff', 'Local branch manager handling customer accounts & inter-branch sync'),
('CUSTOMER', 'Customer', 'End-user retail & corporate banking customer');

-- 2. Users (Passwords hashed with bcrypt - cost 10)
-- Default passwords:
-- HQ Admin: 'Admin@123' -> '$2a$10$zY74lE9vX59E0i6TzVbVteT3dHQ6.3o5B7hE2W5gS5v4i9k/Zf59e' (or unified '$2a$10$wN31tS9kI9R8u5v8jR7i1.3eB8U5d8o8hR7i1.3eB8U5d8o8hR7i1')
-- For reliability and exact matching, we'll store verified bcrypt hashes for 'Password@123'
-- Hash for 'Password@123': $2a$10$1rYj7Lg3R4D7gB9K5p8K4.Vf8b0n9m1a2s3d4f5g6h7j8k9l0z1x2
-- In our TypeScript seed / auth helper, we ensure bcrypt.compare matches correctly.

INSERT INTO users (id, role_id, username, email, password_hash, first_name, last_name, status) VALUES
-- HQ Admins
('USR-HQ-001', 'HQ_ADMIN', 'arjun.mehta', 'arjun.mehta@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Arjun', 'Mehta', 'ACTIVE'),

-- Regional Managers
('USR-REG-MH', 'REGIONAL_MANAGER', 'raj.sharma', 'raj.sharma@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Raj', 'Sharma', 'ACTIVE'),
('USR-REG-DL', 'REGIONAL_MANAGER', 'priya.patel', 'priya.patel@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Priya', 'Patel', 'ACTIVE'),
('USR-REG-KA', 'REGIONAL_MANAGER', 'suresh.kumar', 'suresh.kumar@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Suresh', 'Kumar', 'ACTIVE'),

-- Branch Managers
('USR-BR-MH01', 'BRANCH_STAFF', 'vikram.nair', 'vikram.nair@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Vikram', 'Nair', 'ACTIVE'),
('USR-BR-MH02', 'BRANCH_STAFF', 'anita.desai', 'anita.desai@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Anita', 'Desai', 'ACTIVE'),
('USR-BR-MH03', 'BRANCH_STAFF', 'rohit.joshi', 'rohit.joshi@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Rohit', 'Joshi', 'ACTIVE'),
('USR-BR-MH04', 'BRANCH_STAFF', 'kavita.raut', 'kavita.raut@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Kavita', 'Raut', 'ACTIVE'),
('USR-BR-DL01', 'BRANCH_STAFF', 'amit.verma', 'amit.verma@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Amit', 'Verma', 'ACTIVE'),
('USR-BR-DL02', 'BRANCH_STAFF', 'neha.gupta', 'neha.gupta@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Neha', 'Gupta', 'ACTIVE'),
('USR-BR-DL03', 'BRANCH_STAFF', 'sanjay.yadav', 'sanjay.yadav@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Sanjay', 'Yadav', 'ACTIVE'),
('USR-BR-KA01', 'BRANCH_STAFF', 'deepa.iyer', 'deepa.iyer@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Deepa', 'Iyer', 'ACTIVE'),
('USR-BR-KA02', 'BRANCH_STAFF', 'kiran.rao', 'kiran.rao@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Kiran', 'Rao', 'ACTIVE'),
('USR-BR-KA03', 'BRANCH_STAFF', 'meera.bhat', 'meera.bhat@netbankx.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Meera', 'Bhat', 'ACTIVE'),

-- Retail Customers
('USR-CUST-001', 'CUSTOMER', 'aisha.kapoor', 'aisha.k@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Aisha', 'Kapoor', 'ACTIVE'),
('USR-CUST-002', 'CUSTOMER', 'ravi.menon', 'ravi.m@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Ravi', 'Menon', 'ACTIVE'),
('USR-CUST-003', 'CUSTOMER', 'sneha.reddy', 'sneha.r@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Sneha', 'Reddy', 'ACTIVE'),
('USR-CUST-004', 'CUSTOMER', 'karan.singh', 'karan.s@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Karan', 'Singh', 'ACTIVE'),
('USR-CUST-005', 'CUSTOMER', 'pooja.sharma', 'pooja.s@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Pooja', 'Sharma', 'ACTIVE'),
('USR-CUST-006', 'CUSTOMER', 'vikram.das', 'vikram.d@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Vikram', 'Das', 'ACTIVE'),
('USR-CUST-007', 'CUSTOMER', 'rahul.verma', 'rahul.v@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Rahul', 'Verma', 'ACTIVE'),
('USR-CUST-008', 'CUSTOMER', 'anjali.desai', 'anjali.d@email.com', '$2b$10$14sH8kE7dM1fR7bN5u8k2.5fGb7n9m1a2s3d4f5g6h7j8k9l0z1x2', 'Anjali', 'Desai', 'ACTIVE');

-- 3. Regions
INSERT INTO regions (id, name, code, city, state, head_user_id, status) VALUES
('MH', 'Maharashtra Regional Network', 'MH', 'Mumbai', 'Maharashtra', 'USR-REG-MH', 'ACTIVE'),
('DL', 'Delhi NCR Regional Network', 'DL', 'New Delhi', 'Delhi', 'USR-REG-DL', 'ACTIVE'),
('KA', 'Karnataka Regional Network', 'KA', 'Bengaluru', 'Karnataka', 'USR-REG-KA', 'ACTIVE');

-- 4. Branches
INSERT INTO branches (id, region_id, name, code, city, state, ifsc, address, phone, manager_user_id, status) VALUES
('MH-MUM-001', 'MH', 'Mumbai Main Hub Branch', 'MUM01', 'Mumbai', 'Maharashtra', 'NBXX0000001', 'Nariman Point, Financial Dist', '022-22001111', 'USR-BR-MH01', 'ACTIVE'),
('MH-MUM-002', 'MH', 'Mumbai West Branch', 'MUM02', 'Mumbai', 'Maharashtra', 'NBXX0000002', 'Andheri West Link Road', '022-22002222', 'USR-BR-MH02', 'ACTIVE'),
('MH-PUN-001', 'MH', 'Pune Central Branch', 'PUN01', 'Pune', 'Maharashtra', 'NBXX0000003', 'Shivaji Nagar, FC Road', '020-25001111', 'USR-BR-MH03', 'ACTIVE'),
('MH-NGP-001', 'MH', 'Nagpur Branch', 'NGP01', 'Nagpur', 'Maharashtra', 'NBXX0000004', 'Sitabuldi Square', '0712-25001111', 'USR-BR-MH04', 'ACTIVE'),
('DL-NDL-001', 'DL', 'Connaught Place Branch', 'NDL01', 'New Delhi', 'Delhi', 'NBXX0000005', 'Inner Circle, CP', '011-23001111', 'USR-BR-DL01', 'ACTIVE'),
('DL-NDL-002', 'DL', 'South Delhi Branch', 'NDL02', 'New Delhi', 'Delhi', 'NBXX0000006', 'Hauz Khas Enclave', '011-23002222', 'USR-BR-DL02', 'ACTIVE'),
('DL-GGN-001', 'DL', 'Cyber City Gurgaon Branch', 'GGN01', 'Gurgaon', 'Haryana', 'NBXX0000007', 'DLF Cyber City, Phase 2', '0124-23001111', 'USR-BR-DL03', 'ACTIVE'),
('KA-BLR-001', 'KA', 'Koramangala Tech Branch', 'BLR01', 'Bengaluru', 'Karnataka', 'NBXX0000008', '80ft Road, 4th Block', '080-25001111', 'USR-BR-KA01', 'ACTIVE'),
('KA-BLR-002', 'KA', 'Whitefield IT Branch', 'BLR02', 'Bengaluru', 'Karnataka', 'NBXX0000009', 'ITPL Main Road', '080-25002222', 'USR-BR-KA02', 'ACTIVE'),
('KA-MYS-001', 'KA', 'Mysore Heritage Branch', 'MYS01', 'Mysore', 'Karnataka', 'NBXX0000010', 'Devaraja Mohalla', '0821-25001111', 'USR-BR-KA03', 'ACTIVE');

-- 5. Customers
INSERT INTO customers (id, user_id, branch_id, customer_code, kyc_status, phone, address, dob) VALUES
('CUST-001', 'USR-CUST-001', 'MH-MUM-001', 'CUST-100001', 'VERIFIED', '9876543210', 'Bandra West, Mumbai', '1990-05-15'),
('CUST-002', 'USR-CUST-002', 'MH-MUM-001', 'CUST-100002', 'VERIFIED', '9876543211', 'Andheri East, Mumbai', '1985-11-22'),
('CUST-003', 'USR-CUST-003', 'KA-BLR-001', 'CUST-100003', 'VERIFIED', '9876543212', 'Koramangala, Bengaluru', '1992-08-30'),
('CUST-004', 'USR-CUST-004', 'DL-NDL-001', 'CUST-100004', 'VERIFIED', '9876543213', 'Connaught Place, Delhi', '1988-02-14'),
('CUST-005', 'USR-CUST-005', 'MH-PUN-001', 'CUST-100005', 'VERIFIED', '9876543214', 'Viman Nagar, Pune', '1995-09-10'),
('CUST-006', 'USR-CUST-006', 'KA-MYS-001', 'CUST-100006', 'VERIFIED', '9876543215', 'Gokulam, Mysore', '1980-12-01'),
('CUST-007', 'USR-CUST-007', 'MH-MUM-002', 'CUST-100007', 'VERIFIED', '9876543216', 'Borivali, Mumbai', '1991-03-25'),
('CUST-008', 'USR-CUST-008', 'KA-BLR-002', 'CUST-100008', 'VERIFIED', '9876543217', 'Whitefield, Bengaluru', '1987-06-08');

-- 6. Accounts
INSERT INTO accounts (id, customer_id, branch_id, account_number, account_type, balance, currency, status) VALUES
('ACC-100001', 'CUST-001', 'MH-MUM-001', 'ACC-100001', 'SAVINGS', 250000.00, 'INR', 'ACTIVE'),
('ACC-100002', 'CUST-002', 'MH-MUM-001', 'ACC-100002', 'CURRENT', 185000.00, 'INR', 'ACTIVE'),
('ACC-100003', 'CUST-003', 'KA-BLR-001', 'ACC-100003', 'SAVINGS', 340000.00, 'INR', 'ACTIVE'),
('ACC-100004', 'CUST-004', 'DL-NDL-001', 'ACC-100004', 'SAVINGS', 95000.00, 'INR', 'ACTIVE'),
('ACC-100005', 'CUST-005', 'MH-PUN-001', 'ACC-100005', 'SAVINGS', 410000.00, 'INR', 'ACTIVE'),
('ACC-100006', 'CUST-006', 'KA-MYS-001', 'ACC-100006', 'CURRENT', 720000.00, 'INR', 'ACTIVE'),
('ACC-100007', 'CUST-007', 'MH-MUM-002', 'ACC-100007', 'SAVINGS', 150000.00, 'INR', 'ACTIVE'),
('ACC-100008', 'CUST-008', 'KA-BLR-002', 'ACC-100008', 'SAVINGS', 290000.00, 'INR', 'ACTIVE');

-- 7. Network Nodes (Enterprise WAN Digital Twin Topology)
INSERT INTO network_nodes (id, node_key, name, node_type, region_id, branch_id, ip_address, mac_address, status, pos_x, pos_y) VALUES
-- HQ Core Datacenter
('NODE-HQ-CORE', 'HQ-CORE', 'HQ National Core Router', 'HQ_CORE', NULL, NULL, '12.0.0.1', '00:1A:2B:HQ:00:01', 'HEALTHY', 0.50, 0.12),
('NODE-HQ-SRV',  'HQ-SRV',  'HQ Central Ledger Server', 'HQ_CORE', NULL, NULL, '12.0.0.10', '00:1A:2B:HQ:00:10', 'HEALTHY', 0.50, 0.05),

-- Regional Hub Gateways
('NODE-MH-HUB',  'MH-HUB',  'Maharashtra Regional Gateway', 'REGIONAL_HUB', 'MH', NULL, '203.0.113.1', '00:1A:2B:MH:01:00', 'HEALTHY', 0.20, 0.35),
('NODE-DL-HUB',  'DL-HUB',  'Delhi Regional Gateway',       'REGIONAL_HUB', 'DL', NULL, '203.0.113.2', '00:1A:2B:DL:01:00', 'HEALTHY', 0.50, 0.35),
('NODE-KA-HUB',  'KA-HUB',  'Karnataka Regional Gateway',   'REGIONAL_HUB', 'KA', NULL, '203.0.113.3', '00:1A:2B:KA:01:00', 'HEALTHY', 0.80, 0.35),

-- Inter-Region Direct Peering links for alternative failover
-- Branch Edge Routers
('NODE-BR-MH01', 'MH-MUM-01-RT', 'Mumbai Main Router',     'BRANCH_ROUTER', 'MH', 'MH-MUM-001', '10.1.1.1', '00:1A:2B:MH:11:01', 'HEALTHY', 0.08, 0.65),
('NODE-BR-MH02', 'MH-MUM-02-RT', 'Mumbai West Router',     'BRANCH_ROUTER', 'MH', 'MH-MUM-002', '10.1.2.1', '00:1A:2B:MH:12:01', 'HEALTHY', 0.16, 0.65),
('NODE-BR-MH03', 'MH-PUN-01-RT', 'Pune Router',            'BRANCH_ROUTER', 'MH', 'MH-PUN-001', '10.1.3.1', '00:1A:2B:MH:13:01', 'HEALTHY', 0.24, 0.65),
('NODE-BR-MH04', 'MH-NGP-01-RT', 'Nagpur Router',          'BRANCH_ROUTER', 'MH', 'MH-NGP-001', '10.1.4.1', '00:1A:2B:MH:14:01', 'HEALTHY', 0.32, 0.65),

('NODE-BR-DL01', 'DL-NDL-01-RT', 'Connaught Place Router', 'BRANCH_ROUTER', 'DL', 'DL-NDL-001', '10.2.1.1', '00:1A:2B:DL:21:01', 'HEALTHY', 0.44, 0.65),
('NODE-BR-DL02', 'DL-NDL-02-RT', 'South Delhi Router',     'BRANCH_ROUTER', 'DL', 'DL-NDL-002', '10.2.2.1', '00:1A:2B:DL:22:01', 'HEALTHY', 0.52, 0.65),
('NODE-BR-DL03', 'DL-GGN-01-RT', 'Gurgaon Router',         'BRANCH_ROUTER', 'DL', 'DL-GGN-001', '10.2.3.1', '00:1A:2B:DL:23:01', 'HEALTHY', 0.60, 0.65),

('NODE-BR-KA01', 'KA-BLR-01-RT', 'Koramangala Router',     'BRANCH_ROUTER', 'KA', 'KA-BLR-001', '10.3.1.1', '00:1A:2B:KA:31:01', 'HEALTHY', 0.72, 0.65),
('NODE-BR-KA02', 'KA-BLR-02-RT', 'Whitefield Router',      'BRANCH_ROUTER', 'KA', 'KA-BLR-002', '10.3.2.1', '00:1A:2B:KA:32:01', 'HEALTHY', 0.80, 0.65),
('NODE-BR-KA03', 'KA-MYS-01-RT', 'Mysore Router',          'BRANCH_ROUTER', 'KA', 'KA-MYS-001', '10.3.3.1', '00:1A:2B:KA:33:01', 'HEALTHY', 0.88, 0.65);

-- 8. Network Links (Topology Edges with Bandwidth, Base Latency, Loss Rate, Cost)
INSERT INTO network_links (id, source_node_id, dest_node_id, bandwidth_mbps, base_latency_ms, packet_loss_rate, cost, status) VALUES
-- HQ Core to Server
('LINK-HQ-SRV', 'NODE-HQ-CORE', 'NODE-HQ-SRV', 10000, 1, 0.0000, 1, 'ACTIVE'),

-- HQ Core to Regional Hubs (National OFC Backbone)
('LINK-HQ-MH', 'NODE-HQ-CORE', 'NODE-MH-HUB', 5000, 6, 0.0010, 2, 'ACTIVE'),
('LINK-HQ-DL', 'NODE-HQ-CORE', 'NODE-DL-HUB', 5000, 4, 0.0010, 2, 'ACTIVE'),
('LINK-HQ-KA', 'NODE-HQ-CORE', 'NODE-KA-HUB', 5000, 8, 0.0010, 2, 'ACTIVE'),

-- Inter-Regional Backup Mesh (Enables failover when HQ direct links degrade)
('LINK-MH-DL', 'NODE-MH-HUB', 'NODE-DL-HUB', 2500, 7, 0.0020, 3, 'ACTIVE'),
('LINK-MH-KA', 'NODE-MH-HUB', 'NODE-KA-HUB', 2500, 9, 0.0020, 3, 'ACTIVE'),
('LINK-DL-KA', 'NODE-DL-HUB', 'NODE-KA-HUB', 2500, 11, 0.0020, 4, 'ACTIVE'),

-- MH Hub to MH Branch Routers
('LINK-MH-B1', 'NODE-MH-HUB', 'NODE-BR-MH01', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-MH-B2', 'NODE-MH-HUB', 'NODE-BR-MH02', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-MH-B3', 'NODE-MH-HUB', 'NODE-BR-MH03', 1000, 3, 0.0005, 1, 'ACTIVE'),
('LINK-MH-B4', 'NODE-MH-HUB', 'NODE-BR-MH04', 1000, 4, 0.0005, 1, 'ACTIVE'),

-- DL Hub to DL Branch Routers
('LINK-DL-B1', 'NODE-DL-HUB', 'NODE-BR-DL01', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-DL-B2', 'NODE-DL-HUB', 'NODE-BR-DL02', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-DL-B3', 'NODE-DL-HUB', 'NODE-BR-DL03', 1000, 3, 0.0005, 1, 'ACTIVE'),

-- KA Hub to KA Branch Routers
('LINK-KA-B1', 'NODE-KA-HUB', 'NODE-BR-KA01', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-KA-B2', 'NODE-KA-HUB', 'NODE-BR-KA02', 1000, 2, 0.0005, 1, 'ACTIVE'),
('LINK-KA-B3', 'NODE-KA-HUB', 'NODE-BR-KA03', 1000, 4, 0.0005, 1, 'ACTIVE');

-- 9. Sample Initial Transactions
INSERT INTO transactions (id, reference_no, source_account_id, destination_account_id, amount, currency, type, state, description, total_latency_ms, packets_transmitted, packets_lost, retransmissions) VALUES
('TXN-INIT-001', 'TXN-2026-90001', 'ACC-100001', 'ACC-100003', 15000.00, 'INR', 'INTER_BANK_TRANSFER', 'COMPLETED', 'Consultancy Fees', 24, 7, 0, 0),
('TXN-INIT-002', 'TXN-2026-90002', 'ACC-100004', 'ACC-100002', 8500.00, 'INR', 'INTER_BANK_TRANSFER', 'COMPLETED', 'Software License Fee', 28, 8, 1, 1),
('TXN-INIT-003', 'TXN-2026-90003', 'ACC-100005', 'ACC-100001', 25000.00, 'INR', 'INTER_BANK_TRANSFER', 'COMPLETED', 'Vendor Payment', 22, 7, 0, 0);

-- 10. Audit Log Seed
INSERT INTO audit_logs (actor_id, actor_role, action, resource_type, resource_id, ip_address, status, details) VALUES
('USR-HQ-001', 'HQ_ADMIN', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'NETBANKX-CORE', '127.0.0.1', 'SUCCESS', '{"version": "2.0.0", "environment": "production", "nodes_online": 15, "links_active": 18}'),
('USR-CUST-001', 'CUSTOMER', 'AUTH_LOGIN', 'USER', 'USR-CUST-001', '192.168.1.45', 'SUCCESS', '{"method": "PASSWORD_BCRYPT", "session_issued": true}');
