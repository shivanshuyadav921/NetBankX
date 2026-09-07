-- ==========================================================
-- NETBANKX Enterprise Banking & Network Digital Twin Schema
-- Database: MySQL 8.0 / Compatible RDBMS
-- ==========================================================

DROP TABLE IF EXISTS network_events;
DROP TABLE IF EXISTS network_links;
DROP TABLE IF EXISTS network_nodes;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS transaction_events;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. Roles
CREATE TABLE roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(32) NOT NULL,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Regions (National Regional Hubs)
CREATE TABLE regions (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(8) NOT NULL UNIQUE,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    head_user_id VARCHAR(64),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_regions_head FOREIGN KEY (head_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Branches
CREATE TABLE branches (
    id VARCHAR(32) PRIMARY KEY,
    region_id VARCHAR(16) NOT NULL,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(16) NOT NULL UNIQUE,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    ifsc VARCHAR(16) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    manager_user_id VARCHAR(64),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_branches_region FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_branches_manager FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Departments
CREATE TABLE departments (
    id VARCHAR(32) PRIMARY KEY,
    branch_id VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(16) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dept_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Employees
CREATE TABLE employees (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(32),
    region_id VARCHAR(16),
    department_id VARCHAR(32),
    employee_code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(64) NOT NULL,
    phone VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_region FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Customers
CREATE TABLE customers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(32) NOT NULL,
    customer_code VARCHAR(32) NOT NULL UNIQUE,
    kyc_status VARCHAR(20) DEFAULT 'VERIFIED',
    phone VARCHAR(32) NOT NULL,
    address VARCHAR(255) NOT NULL,
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cust_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Accounts (Strict Financial Constraints)
CREATE TABLE accounts (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    branch_id VARCHAR(32) NOT NULL,
    account_number VARCHAR(32) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL DEFAULT 'SAVINGS', -- 'SAVINGS', 'CURRENT', 'SETTLEMENT'
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'FROZEN', 'CLOSED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_balance CHECK (balance >= 0.00),
    CONSTRAINT fk_acc_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_acc_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_accounts_accno ON accounts(account_number);
CREATE INDEX idx_accounts_cust ON accounts(customer_id);

-- 9. Transactions (Double-Entry Core + Authoritative State Machine)
CREATE TABLE transactions (
    id VARCHAR(64) PRIMARY KEY,
    reference_no VARCHAR(64) NOT NULL UNIQUE,
    idempotency_key VARCHAR(128) UNIQUE,
    source_account_id VARCHAR(64) NOT NULL,
    destination_account_id VARCHAR(64) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    type VARCHAR(32) NOT NULL DEFAULT 'INTER_BANK_TRANSFER', -- 'TRANSFER', 'INTER_BRANCH', 'DEPOSIT', 'WITHDRAWAL'
    state VARCHAR(32) NOT NULL DEFAULT 'INITIATED', 
    -- States: 'INITIATED', 'VALIDATING', 'ROUTING', 'TRANSMITTING', 'DELIVERED', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'TIMEOUT'
    description VARCHAR(255),
    routing_path JSON,
    total_latency_ms INT DEFAULT 0,
    packets_transmitted INT DEFAULT 0,
    packets_lost INT DEFAULT 0,
    retransmissions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_amount CHECK (amount > 0.00),
    CONSTRAINT fk_txn_src_acc FOREIGN KEY (source_account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
    CONSTRAINT fk_txn_dst_acc FOREIGN KEY (destination_account_id) REFERENCES accounts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_txn_ref ON transactions(reference_no);
CREATE INDEX idx_txn_state ON transactions(state);
CREATE INDEX idx_txn_created ON transactions(created_at);

-- 10. Transaction Events (Immutable State Transition History)
CREATE TABLE transaction_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    previous_state VARCHAR(32),
    new_state VARCHAR(32) NOT NULL,
    message VARCHAR(255) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_txnev_txn FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_txnev_txnid ON transaction_events(transaction_id);

-- 11. Audit Logs (Compliance, Security, and Operations)
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(64),
    actor_role VARCHAR(32),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILURE', 'DENIED'
    details JSON,
    prev_hash VARCHAR(64) DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    record_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- 12. Network Nodes (Digital Twin Enterprise Topology)
CREATE TABLE network_nodes (
    id VARCHAR(64) PRIMARY KEY,
    node_key VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    node_type VARCHAR(32) NOT NULL, -- 'HQ_CORE', 'REGIONAL_HUB', 'BRANCH_ROUTER', 'CUSTOMER_EDGE'
    region_id VARCHAR(16),
    branch_id VARCHAR(32),
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(18) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HEALTHY', -- 'HEALTHY', 'DEGRADED', 'OFFLINE'
    pos_x FLOAT NOT NULL DEFAULT 0.5,
    pos_y FLOAT NOT NULL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_node_region FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE SET NULL,
    CONSTRAINT fk_node_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Network Links (Weighted Graph Edges)
CREATE TABLE network_links (
    id VARCHAR(64) PRIMARY KEY,
    source_node_id VARCHAR(64) NOT NULL,
    dest_node_id VARCHAR(64) NOT NULL,
    bandwidth_mbps INT NOT NULL DEFAULT 1000,
    base_latency_ms INT NOT NULL DEFAULT 5,
    packet_loss_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    cost INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CONGESTED', 'SEVERED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_link_src FOREIGN KEY (source_node_id) REFERENCES network_nodes (id) ON DELETE CASCADE,
    CONSTRAINT fk_link_dst FOREIGN KEY (dest_node_id) REFERENCES network_nodes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Network Events (Live Simulation Telemetry Log)
CREATE TABLE network_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL, -- 'PACKET_CREATED', 'HOP_FORWARDED', 'PACKET_LOST', 'RETRANSMIT', 'ROUTE_RECALCULATED', 'DELIVERED'
    source_node_id VARCHAR(64),
    dest_node_id VARCHAR(64),
    hop_number INT DEFAULT 0,
    protocol VARCHAR(16) DEFAULT 'TCP',
    payload_summary VARCHAR(255),
    latency_ms INT DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR', 'SUCCESS'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_netev_txnid ON network_events(transaction_id);
CREATE INDEX idx_netev_type ON network_events(event_type);
