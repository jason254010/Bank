import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  User,
  Account,
  DebitCard,
  Transaction,
  Notification,
  NotificationType,
  SupportConversation,
  SupportMessage,
  AuditLog,
  OTPRecord,
  Beneficiary,
  UserRole,
  AccountType,
  TransferCodeRecord
} from '../types.js';

interface DBData {
  isInitialized?: boolean;
  users: User[];
  accounts: Account[];
  cards: DebitCard[];
  transactions: Transaction[];
  notifications: Notification[];
  conversations: SupportConversation[];
  messages: SupportMessage[];
  auditLogs: AuditLog[];
  otps: OTPRecord[];
  beneficiaries?: Beneficiary[];
  transferCodes?: TransferCodeRecord[];
}

let DATA_DIR = path.join(process.cwd(), 'data');
let DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize Firebase Firestore for optional database-backed persistence
let firestoreDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath) && process.env.ENABLE_FIRESTORE === 'true') {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    console.log('Firestore initialized in store with databaseId:', firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn('Could not initialize Firebase in store server:', err);
  firestoreDb = null;
}

function ensureDataDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Failed to create primary DATA_DIR, attempting fallback to /tmp/data:', err);
    try {
      DATA_DIR = path.join('/tmp', 'data');
      DB_FILE = path.join(DATA_DIR, 'db.json');
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (fallbackErr) {
      console.error('Failed to create fallback data directory in /tmp:', fallbackErr);
    }
  }
}

function loadDB(): DBData {
  ensureDataDirExists();
  let loadedData: DBData | null = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      loadedData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse db.json, initializing fresh store:', e);
  }

  if (!loadedData) {
    loadedData = {
      isInitialized: false,
      users: [],
      accounts: [],
      cards: [],
      transactions: [],
      notifications: [],
      conversations: [],
      messages: [],
      auditLogs: [],
      otps: []
    };
  }

  // If DB has owner user, permanently mark as initialized
  if (loadedData.users.some(u => u.role === 'OWNER')) {
    loadedData.isInitialized = true;
  }

  saveDB(loadedData);
  return loadedData;
}

function saveDB(data: DBData) {
  try {
    ensureDataDirExists();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json to file system:', err);
  }
}

export class BankStore {
  private data: DBData;

  constructor() {
    this.data = loadDB();
    this.initFirestoreSync();
  }

  private async initFirestoreSync() {
    if (!firestoreDb) return;
    try {
      const configRef = doc(firestoreDb, 'system', 'config');
      const snap = await getDoc(configRef);
      if (snap.exists() && snap.data().isInitialized) {
        this.data.isInitialized = true;
        this.persist();
      } else if (this.isInitialized()) {
        const owner = this.getOwner();
        await setDoc(configRef, {
          isInitialized: true,
          hasOwner: true,
          ownerEmail: owner ? owner.email : null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err: any) {
      console.warn('Firestore initial sync error (disabling Firestore sync):', err?.message || err);
      firestoreDb = null;
    }
  }

  private persist() {
    saveDB(this.data);
    if (firestoreDb && this.isInitialized()) {
      const owner = this.getOwner();
      setDoc(doc(firestoreDb, 'system', 'config'), {
        isInitialized: true,
        hasOwner: true,
        ownerEmail: owner ? owner.email : null,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn('Failed to sync system init status to Firestore (disabling Firestore sync):', err?.message || err);
        firestoreDb = null;
      });
    }
  }

  // --- SYSTEM STATE ---
  public isInitialized(): boolean {
    if (this.data.isInitialized) return true;
    if (this.data.users.some(u => u.role === 'OWNER')) {
      this.data.isInitialized = true;
      this.persist();
      return true;
    }
    return false;
  }

  public hasOwner(): boolean {
    return this.isInitialized();
  }

  public getOwner(): User | undefined {
    return this.data.users.find(u => u.role === 'OWNER');
  }

  // --- USER MANAGEMENT ---
  public createUser(userData: Omit<User, 'id' | 'createdAt'> & { createdAt?: string }): User {
    const customerId = userData.role === 'CUSTOMER'
      ? (userData.customerId || `CID-${Math.floor(100000 + Math.random() * 900000)}`)
      : undefined;

    const user: User = {
      ...userData,
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      customerId,
      kycStatus: userData.role === 'CUSTOMER' ? (userData.kycStatus || 'Verified') : undefined,
      createdAt: userData.createdAt || new Date().toISOString()
    };
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByCustomerId(customerId: string): User | undefined {
    const cleanId = customerId.trim().toUpperCase();
    return this.data.users.find(u => u.customerId && u.customerId.toUpperCase() === cleanId);
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserByAccountNumber(accountNumber: string): { user: User; account: Account } | undefined {
    const acc = this.data.accounts.find(a => a.accountNumber === accountNumber.trim());
    if (!acc) return undefined;
    const user = this.findUserById(acc.userId);
    if (!user) return undefined;
    return { user, account: acc };
  }

  public getAllCustomers(): User[] {
    return this.data.users.filter(u => u.role === 'CUSTOMER');
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const user = this.findUserById(id);
    if (!user || user.role === 'OWNER') return false; // Cannot delete owner

    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.accounts = this.data.accounts.filter(a => a.userId !== id);
    this.data.cards = this.data.cards.filter(c => c.userId !== id);
    this.persist();
    return true;
  }

  // --- ACCOUNT MANAGEMENT ---
  public createAccount(userId: string, accountType: AccountType, initialBalance: number, createdAt?: string): Account {
    // Generate 10-digit account number starting with 1092
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const accountNumber = `1092${randomDigits}`;

    const user = this.findUserById(userId);

    const account: Account = {
      id: 'acc_' + crypto.randomBytes(6).toString('hex'),
      userId,
      accountNumber,
      routingNumber: '021000021', // Nova Trust Routing
      accountType,
      status: 'Active',
      kycStatus: user?.kycStatus || 'Verified',
      balance: initialBalance,
      availableBalance: initialBalance,
      currency: 'USD',
      createdAt: createdAt || new Date().toISOString()
    };

    this.data.accounts.push(account);

    // Also auto-create a default debit card for this account
    const cardNum = `4092${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
    const card: DebitCard = {
      id: 'crd_' + crypto.randomBytes(6).toString('hex'),
      userId,
      accountId: account.id,
      fullCardNumber: cardNum,
      cardNumber: `•••• •••• •••• ${cardNum.slice(-4)}`,
      cardHolderName: user ? user.fullName.toUpperCase() : 'NOVA TRUST CLIENT',
      expiryDate: '12/29',
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      isLocked: false,
      dailyLimit: 2500
    };
    this.data.cards.push(card);

    this.persist();
    return account;
  }

  public getAccountByUserId(userId: string): Account | undefined {
    return this.data.accounts.find(a => a.userId === userId);
  }

  public getAccountByNumber(accountNumber: string): Account | undefined {
    return this.data.accounts.find(a => a.accountNumber === accountNumber.trim());
  }

  public getCardsByUserId(userId: string): DebitCard[] {
    return this.data.cards.filter(c => c.userId === userId);
  }

  public toggleCardLock(cardId: string, userId: string): DebitCard | undefined {
    const card = this.data.cards.find(c => c.id === cardId && c.userId === userId);
    if (!card) return undefined;
    card.isLocked = !card.isLocked;
    this.persist();
    return card;
  }

  public updateAccountStatus(userId: string, status: Account['status']): Account | undefined {
    const acc = this.getAccountByUserId(userId);
    if (!acc) return undefined;
    acc.status = status;
    this.persist();
    return acc;
  }

  public updateAccountKycStatus(userId: string, kycStatus: Account['kycStatus']): Account | undefined {
    const acc = this.getAccountByUserId(userId);
    const user = this.findUserById(userId);
    if (user) {
      user.kycStatus = kycStatus;
    }
    if (acc) {
      acc.kycStatus = kycStatus;
    }
    this.persist();
    return acc;
  }

  public adjustAccountBalance(userId: string, amount: number, isCredit: boolean): { account: Account; newBalance: number } | undefined {
    const acc = this.getAccountByUserId(userId);
    if (!acc) return undefined;

    if (isCredit) {
      acc.balance += amount;
      acc.availableBalance += amount;
    } else {
      if (acc.balance < amount) {
        throw new Error('Insufficient funds for debit adjustment');
      }
      acc.balance -= amount;
      acc.availableBalance -= amount;
    }

    this.persist();
    return { account: acc, newBalance: acc.balance };
  }

  // --- TRANSACTIONS ---
  public createTransaction(txData: Omit<Transaction, 'id' | 'reference' | 'createdAt'>): Transaction {
    const tx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(tx); // Most recent first
    this.persist();
    return tx;
  }

  public setTransactionsForUser(userId: string, newTxs: Transaction[]): void {
    // Remove existing transactions for user
    this.data.transactions = this.data.transactions.filter(
      t => t.senderUserId !== userId && t.recipientUserId !== userId
    );
    // Push new transactions
    this.data.transactions.push(...newTxs);
    this.recalculateRunningBalancesForUser(userId);
  }

  public recalculateRunningBalancesForUser(userId: string): void {
    const userTxs = this.data.transactions.filter(
      t => t.senderUserId === userId || t.recipientUserId === userId
    );

    // Sort chronologically ascending (oldest first)
    userTxs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let running = 0;
    for (const t of userTxs) {
      const isCredit = t.recipientUserId === userId || t.type === 'Transfer Received' || t.type === 'Credit Adjustment' || t.type === 'Initial Deposit';
      if (isCredit) {
        running += t.amount;
      } else {
        running -= t.amount;
      }
      t.runningBalance = Math.round(running * 100) / 100;
    }

    // Update user account balance to match exact latest running balance
    const acc = this.getAccountByUserId(userId);
    if (acc) {
      acc.balance = Math.round(running * 100) / 100;
      acc.availableBalance = Math.round(running * 100) / 100;
    }

    // Sort all transactions descending (newest first)
    this.data.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.persist();
  }

  public addTransactionForUser(userId: string, txData: Omit<Transaction, 'id' | 'reference'> & { reference?: string }): Transaction {
    const tx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      reference: txData.reference || ('NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString())
    };

    this.data.transactions.push(tx);
    this.recalculateRunningBalancesForUser(userId);
    return tx;
  }

  public updateTransaction(txId: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.data.transactions.findIndex(t => t.id === txId);
    if (idx === -1) return undefined;

    this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
    const tx = this.data.transactions[idx];
    const affectedUser = tx.recipientUserId || tx.senderUserId;
    if (affectedUser) {
      this.recalculateRunningBalancesForUser(affectedUser);
    } else {
      this.persist();
    }
    return tx;
  }

  public deleteTransaction(txId: string): boolean {
    const tx = this.data.transactions.find(t => t.id === txId);
    if (!tx) return false;

    const affectedUser = tx.recipientUserId || tx.senderUserId;
    this.data.transactions = this.data.transactions.filter(t => t.id !== txId);

    if (affectedUser) {
      this.recalculateRunningBalancesForUser(affectedUser);
    } else {
      this.persist();
    }
    return true;
  }

  public getTransactionsForUser(userId: string): Transaction[] {
    return this.data.transactions.filter(
      t => t.senderUserId === userId || t.recipientUserId === userId
    );
  }

  public getAllTransactions(): Transaction[] {
    return [...this.data.transactions];
  }

  // --- NOTIFICATIONS ---
  public createNotification(notifData: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const notif: Notification = {
      ...notifData,
      id: 'ntf_' + crypto.randomBytes(6).toString('hex'),
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getNotificationsForUser(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public markNotificationsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.persist();
  }

  // --- SUPPORT CHAT ---
  public getOrCreateConversation(customer: User): SupportConversation {
    let conv = this.data.conversations.find(c => c.customerId === customer.id);
    const acc = this.getAccountByUserId(customer.id);

    if (!conv) {
      conv = {
        id: 'cnv_' + crypto.randomBytes(6).toString('hex'),
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerAccountNumber: acc ? acc.accountNumber : 'N/A',
        status: 'Open',
        isPinned: false,
        unreadByOwner: false,
        unreadByCustomer: false,
        lastMessageText: 'Conversation started',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.data.conversations.push(conv);
      this.persist();
    }
    return conv;
  }

  public getConversationById(id: string): SupportConversation | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  public getAllConversations(): SupportConversation[] {
    return [...this.data.conversations].sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  public addSupportMessage(msgData: Omit<SupportMessage, 'id' | 'createdAt'>): SupportMessage {
    const msg: SupportMessage = {
      ...msgData,
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(msg);

    // Update parent conversation
    const conv = this.data.conversations.find(c => c.id === msgData.conversationId);
    if (conv) {
      conv.lastMessageText = msgData.text || (msgData.attachments?.length ? '[Attachment]' : 'Message');
      conv.lastMessageAt = msg.createdAt;
      if (msgData.senderRole === 'CUSTOMER') {
        conv.unreadByOwner = true;
      } else {
        conv.unreadByCustomer = true;
      }
    }

    this.persist();
    return msg;
  }

  public getMessagesForConversation(conversationId: string): SupportMessage[] {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  public updateConversationStatus(
    id: string,
    updates: Partial<Pick<SupportConversation, 'status' | 'isPinned' | 'unreadByOwner' | 'unreadByCustomer'>>
  ): SupportConversation | undefined {
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return undefined;
    Object.assign(conv, updates);
    this.persist();
    return conv;
  }

  // --- AUDIT LOGS ---
  public logAudit(logData: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...logData,
      id: 'log_' + crypto.randomBytes(6).toString('hex'),
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    this.persist();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs];
  }

  // --- NOTIFICATIONS ---
  public addNotification(userId: string, type: NotificationType, title: string, message: string): Notification {
    if (!this.data.notifications) this.data.notifications = [];
    const notification: Notification = {
      id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  // --- OTP GENERATION & VERIFICATION ---
  public generateOTP(userId: string, email: string, purpose: OTPRecord['purpose']): OTPRecord {
    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate existing unused OTPs for user & purpose
    this.data.otps.forEach(o => {
      if (o.userId === userId && o.purpose === purpose) {
        o.verified = true;
      }
    });

    const otp: OTPRecord = {
      id: 'otp_' + crypto.randomBytes(6).toString('hex'),
      userId,
      email,
      code,
      purpose,
      expiresAt,
      verified: false
    };

    this.data.otps.push(otp);
    this.persist();
    return otp;
  }

  public verifyOTP(userId: string, code: string, purpose: OTPRecord['purpose']): boolean {
    const now = new Date().toISOString();
    const otp = this.data.otps.find(
      o => o.userId === userId && o.code === code.trim() && o.purpose === purpose && !o.verified && o.expiresAt > now
    );

    if (!otp) return false;
    otp.verified = true;
    this.persist();
    return true;
  }

  // --- BENEFICIARIES ---
  public getBeneficiariesForUser(userId: string): Beneficiary[] {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    return this.data.beneficiaries.filter(b => b.userId === userId);
  }

  public addBeneficiary(
    userId: string,
    data: { name: string; accountNumber: string; bankName: string; nickname?: string }
  ): Beneficiary {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    
    // Check if beneficiary already exists for user
    const existing = this.data.beneficiaries.find(
      b => b.userId === userId && b.accountNumber.trim() === data.accountNumber.trim() && b.bankName.trim().toLowerCase() === data.bankName.trim().toLowerCase()
    );

    if (existing) {
      existing.name = data.name.trim();
      if (data.nickname) existing.nickname = data.nickname.trim();
      this.persist();
      return existing;
    }

    const beneficiary: Beneficiary = {
      id: 'ben_' + crypto.randomBytes(6).toString('hex'),
      userId,
      name: data.name.trim(),
      accountNumber: data.accountNumber.trim(),
      bankName: data.bankName.trim(),
      nickname: data.nickname ? data.nickname.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    this.data.beneficiaries.push(beneficiary);
    this.persist();
    return beneficiary;
  }

  public updateBeneficiary(
    beneficiaryId: string,
    userId: string,
    updates: { name?: string; accountNumber?: string; bankName?: string; nickname?: string }
  ): Beneficiary | null {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    const ben = this.data.beneficiaries.find(b => b.id === beneficiaryId && b.userId === userId);
    if (!ben) return null;

    if (updates.name) ben.name = updates.name.trim();
    if (updates.accountNumber) ben.accountNumber = updates.accountNumber.trim();
    if (updates.bankName) ben.bankName = updates.bankName.trim();
    if (updates.nickname !== undefined) ben.nickname = updates.nickname.trim();

    this.persist();
    return ben;
  }

  public deleteBeneficiary(beneficiaryId: string, userId: string): boolean {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    const index = this.data.beneficiaries.findIndex(b => b.id === beneficiaryId && b.userId === userId);
    if (index === -1) return false;

    this.data.beneficiaries.splice(index, 1);
    this.persist();
    return true;
  }

  // --- TRANSFER CODES FOR ADMIN ---
  public recordTransferCode(data: {
    userId: string;
    userName: string;
    userEmail: string;
    accountNumber: string;
    recipientName?: string;
    amount?: number;
    primaryOtp: string;
    secondaryCode: string;
  }): TransferCodeRecord {
    if (!this.data.transferCodes) this.data.transferCodes = [];

    // Mark previous pending codes for this user as expired
    this.data.transferCodes.forEach(tc => {
      if (tc.userId === data.userId && tc.status === 'PENDING') {
        tc.status = 'EXPIRED';
      }
    });

    const record: TransferCodeRecord = {
      id: 'tc_' + crypto.randomBytes(6).toString('hex'),
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      accountNumber: data.accountNumber,
      recipientName: data.recipientName || 'Unspecified Recipient',
      amount: data.amount || 0,
      primaryOtp: data.primaryOtp,
      secondaryCode: data.secondaryCode,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.data.transferCodes.unshift(record);
    this.persist();
    return record;
  }

  public getTransferCodes(): TransferCodeRecord[] {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    return [...this.data.transferCodes];
  }

  public markTransferCodeVerified(userId: string, secondaryCode: string): boolean {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    const tc = this.data.transferCodes.find(
      c => c.userId === userId && c.secondaryCode === secondaryCode && c.status === 'PENDING'
    );
    if (tc) {
      tc.status = 'VERIFIED';
      this.persist();
      return true;
    }
    return false;
  }
}

export const store = new BankStore();
