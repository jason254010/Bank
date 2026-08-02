export type UserRole = 'OWNER' | 'CUSTOMER';

export type AccountType = 'Checking' | 'Savings' | 'Business' | 'High-Yield';

export type AccountStatus = 'Active' | 'Frozen' | 'Suspended' | 'Closed' | 'Inactive';

export type KYCStatus = 'Verified' | 'Verification Required' | 'Suspended';

export type TransactionType = 'Transfer Sent' | 'Transfer Received' | 'Credit Adjustment' | 'Debit Adjustment' | 'Initial Deposit';

export type NotificationType = 'MONEY_RECEIVED' | 'MONEY_SENT' | 'PASSWORD_CHANGED' | 'ACCOUNT_FROZEN' | 'ACCOUNT_UNFROZEN' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_REACTIVATED' | 'LOGIN_DETECTED' | 'SUPPORT_MESSAGE' | 'SYSTEM_ALERT';

export interface BankSettings {
  whatsappNumber: string;
  telegramUsername: string;
  supportEmail: string;
  supportPhone: string;
  officeAddress?: string;
  businessHours?: string;
  homepageVideoUrl?: string;
  homepageVideoFilename?: string;
}

export interface User {
  id: string;
  customerId?: string; // Unique Customer ID e.g. CID-849201
  email: string;
  role: UserRole;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  username?: string;
  profilePicture?: string;
  passwordHash: string; // Stored securely
  emailVerified: boolean;
  kycStatus?: KYCStatus;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string; // e.g. 1092837465
  routingNumber: string; // e.g. 021000021
  accountType: AccountType;
  status: AccountStatus;
  kycStatus?: KYCStatus;
  balance: number;
  availableBalance: number;
  currency: string;
  createdAt: string;
}

export interface DebitCard {
  id: string;
  userId: string;
  accountId: string;
  cardNumber: string; // Masked for display except last 4
  fullCardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  isLocked: boolean;
  dailyLimit: number;
}

export interface Transaction {
  id: string;
  reference: string; // e.g. NTB-TX-98473210
  senderUserId?: string;
  senderName?: string;
  senderAccountNumber?: string;
  recipientUserId?: string;
  recipientName: string;
  recipientAccountNumber: string;
  bankName: string;
  amount: number;
  fee: number;
  description: string;
  type: TransactionType;
  status: 'Completed' | 'Pending' | 'Failed';
  createdAt: string;
  runningBalance?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  amount?: number;
}

export interface SupportAttachment {
  id: string;
  name: string;
  type: string; // image/png, application/pdf, etc.
  url: string; // Data URL or storage path
  size: number;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  attachments?: SupportAttachment[];
  createdAt: string;
}

export interface SupportConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAccountNumber: string;
  status: 'Open' | 'Resolved' | 'Archived';
  mode?: 'INITIAL' | 'SELECT_MODE' | 'AI_ASSISTANT' | 'HUMAN_VERIFICATION' | 'HUMAN_SUPPORT';
  verifiedForHuman?: boolean;
  channel?: 'IN_APP' | 'WHATSAPP' | 'TELEGRAM';
  isPinned?: boolean;
  unreadByOwner?: boolean;
  unreadByCustomer?: boolean;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface OTPRecord {
  id: string;
  userId: string;
  email: string;
  code: string;
  purpose: 'TRANSFER' | 'PASSWORD_RESET' | 'LOGIN';
  expiresAt: string;
  verified: boolean;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  nickname?: string;
  createdAt: string;
}

export interface TransferCodeRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  accountNumber: string;
  recipientName?: string;
  amount?: number;
  primaryOtp: string;
  secondaryCode: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  createdAt: string;
}
