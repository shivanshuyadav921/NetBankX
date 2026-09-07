export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityEventCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'TRANSACTION'
  | 'SESSION'
  | 'API'
  | 'NETWORK'
  | 'ADMINISTRATION'
  | 'AUDIT';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGIN_BRUTE_FORCE'
  | 'MFA_REQUIRED'
  | 'MFA_SUCCESS'
  | 'MFA_FAILURE'
  | 'SESSION_CREATED'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'SESSION_ANOMALY'
  | 'PASSWORD_CHANGED'
  | 'PRIVILEGE_ESCALATION_ATTEMPT'
  | 'PRIVILEGE_ESCALATION'
  | 'UNAUTHORIZED_API_ACCESS'
  | 'API_RATE_LIMIT'
  | 'API_ABUSE'
  | 'SUSPICIOUS_TRANSACTION'
  | 'TRANSACTION_BLOCKED'
  | 'TRANSACTION_HELD'
  | 'TRANSACTION_APPROVED'
  | 'NEW_DEVICE'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_BLOCKED'
  | 'NEW_SESSION'
  | 'ACCOUNT_TAKEOVER_SIGNAL'
  | 'DECOY_RESOURCE_ACCESSED'
  | 'NETWORK_ANOMALY'
  | 'PACKET_ANOMALY'
  | 'TOPOLOGY_ACCESS_VIOLATION'
  | 'ADMIN_ACTION'
  | 'AUDIT_INTEGRITY_FAILURE'
  | 'SECURITY_INCIDENT_CREATED'
  | 'SECURITY_INCIDENT_RESOLVED';

export interface SecurityEvent {
  eventId: string;
  timestamp: string;
  severity: SecuritySeverity;
  category: SecurityEventCategory;
  eventType: SecurityEventType;
  actor: string;
  actorRole?: string;
  source: string;
  action: string;
  resource: string;
  riskScore: number; // 0 to 100
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED' | 'BLOCKED' | 'HELD';
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export type IncidentStatus =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'FALSE_POSITIVE';

export interface SecurityIncident {
  incidentId: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  sourceEvents: string[]; // List of eventIds
  correlationId: string;
  affectedUser?: string;
  affectedTransaction?: string;
  affectedSession?: string;
  affectedNetworkEvents?: string[];
  resolution?: string;
  riskScore: number;
}

export type DeviceStatus = 'KNOWN' | 'NEW' | 'SUSPICIOUS' | 'BLOCKED';

export interface UserDevice {
  deviceId: string;
  userId: string;
  username: string;
  userAgent: string;
  deviceLabel: string;
  ipAddress: string;
  status: DeviceStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SecuritySession {
  sessionId: string;
  userId: string;
  username: string;
  roleId: string;
  createdAt: string;
  lastActivity: string;
  lastActivityAt?: string;
  expiresAt: string;
  revokedAt?: string;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  deviceLabel: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPICIOUS';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  mfaVerified: boolean;
}

export interface SecurityThreatAssessment {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0 to 100
  activeIncidentsCount: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  failedLoginsLastHour: number;
  blockedRequestsLastHour: number;
  decoyAccessesCount?: number;
  atoSignalsCount?: number;
  drivers: string[];
  calculatedAt: string;
}

export interface ExplainableRiskAssessment {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: Array<{
    name: string;
    weight: number;
    description: string;
  }>;
  recommendedAction: 'APPROVE' | 'STEP_UP_MFA' | 'MFA_AND_HOLD' | 'BLOCK';
  evaluatedAt: string;
}
