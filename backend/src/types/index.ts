export type UserRole = 'HQ_ADMIN' | 'REGIONAL_MANAGER' | 'BRANCH_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  roleId: UserRole;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
}

export interface AuthTokenPayload {
  userId: string;
  roleId: UserRole;
  username: string;
  email: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  headUserId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Branch {
  id: string;
  regionId: string;
  name: string;
  code: string;
  city: string;
  state: string;
  ifsc: string;
  address: string;
  phone: string;
  managerUserId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Account {
  id: string;
  customerId: string;
  branchId: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'SETTLEMENT';
  balance: string; // Stored as Decimal string e.g. "250000.00"
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt?: string;
}

export type TransactionState =
  | 'INITIATED'
  | 'VALIDATING'
  | 'ROUTING'
  | 'TRANSMITTING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'TIMEOUT';

export interface Transaction {
  id: string;
  referenceNo: string;
  idempotencyKey?: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: string;
  type: string;
  state: TransactionState;
  description?: string;
  routingPath?: string[];
  totalLatencyMs: number;
  packetsTransmitted: number;
  packetsLost: number;
  retransmissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEvent {
  id?: number;
  transactionId: string;
  previousState?: TransactionState;
  newState: TransactionState;
  message: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface AuditLog {
  id?: number;
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  details?: Record<string, any>;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}
