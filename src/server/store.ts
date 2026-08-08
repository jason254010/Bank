import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, terminate, disableNetwork } from 'firebase/firestore';
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
  TransferCodeRecord,
  OwnerResetTokenRecord,
  SessionRecord,
  BankSettings
} from '../types.js';

interface DBData {
  isInitialized?: boolean;
  settings?: BankSettings;
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
  ownerResetTokens?: OwnerResetTokenRecord[];
  sessions?: SessionRecord[];
}

let DATA_DIR = path.join(process.cwd(), 'data');
let DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize PostgreSQL pool if DATABASE_URL or POSTGRES_URL is set
let pgPool: pg.Pool | null = null;
const pgDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PRIVATE_URL;
if (pgDbUrl) {
  try {
    pgPool = new pg.Pool({
      connectionString: pgDbUrl,
      ssl: pgDbUrl.includes('localhost') || pgDbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });
    console.log('[POSTGRES] Connection pool initialized successfully.');
  } catch (err) {
    console.error('[POSTGRES] Failed to initialize connection pool:', err);
    pgPool = null;
  }
} else if (process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL DATABASE CONFIGURATION ERROR] DATABASE_URL is NOT set in production! Ephemeral local fallback is disabled for production reliability.');
}

// Initialize Firebase Firestore for database persistence
let firestoreDb: any = null;

function disableFirestore(db: any) {
  if (!db && !firestoreDb) return;
  const target = db || firestoreDb;
  firestoreDb = null;
  try {
    disableNetwork(target).catch(() => {});
    terminate(target).catch(() => {});
  } catch (_) {}
}

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // If project is suspended (e.g. dynamic-flag-r6d0h), avoid initializing gRPC background streams
    if (firebaseConfig?.projectId && firebaseConfig.projectId !== 'dynamic-flag-r6d0h') {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
      console.log('Firestore initialized in store with databaseId:', firebaseConfig.firestoreDatabaseId);
    } else {
      console.log('Skipping suspended or unconfigured Firebase project:', firebaseConfig?.projectId);
    }
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
      otps: [],
      beneficiaries: [],
      transferCodes: [],
      ownerResetTokens: []
    };
  }

  if (!loadedData.ownerResetTokens) {
    loadedData.ownerResetTokens = [];
  }

  if (!loadedData.sessions) {
    loadedData.sessions = [];
  }

  // If DB has owner user, permanently mark as initialized
  if (loadedData.users && loadedData.users.some(u => u.role === 'OWNER')) {
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
  public readyPromise: Promise<void>;

  constructor() {
    this.data = loadDB();
    this.readyPromise = this.initPersistence().catch(err => {
      console.warn('Initial background persistence loading encountered an error:', err);
    });
  }

  public async initPersistence(): Promise<void> {
    // If running in production and DATABASE_URL is missing, fail fast with a configuration error
    if (process.env.NODE_ENV === 'production' && !pgPool) {
      throw new Error('[CRITICAL DATABASE CONFIGURATION ERROR] DATABASE_URL is missing! PostgreSQL is required as the single source of truth in production.');
    }

    // 1. Check PostgreSQL first if available
    if (pgPool) {
      try {
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS bank_store (
            id VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        const res = await pgPool.query(`SELECT data FROM bank_store WHERE id = 'main'`);
        if (res.rows.length > 0 && res.rows[0].data) {
          const pgData = res.rows[0].data as DBData;
          if (pgData && Array.isArray(pgData.users)) {
            pgData.users.forEach((u: any) => {
              if (!u.passwordHash && u.password) u.passwordHash = u.password;
            });
            this.data = {
              isInitialized: false,
              users: [],
              accounts: [],
              cards: [],
              transactions: [],
              notifications: [],
              conversations: [],
              messages: [],
              auditLogs: [],
              otps: [],
              beneficiaries: [],
              transferCodes: [],
              ownerResetTokens: [],
              sessions: [],
              ...pgData
            };
            console.log(`[POSTGRES] Loaded persistent data: ${this.data.users.length} users, ${(this.data.accounts || []).length} accounts, ${(this.data.transactions || []).length} transactions.`);
            saveDB(this.data);
            return;
          }
        }

        // If PostgreSQL was empty, preserve any existing local initial seed data or create clean state and save to PG
        if (!this.data || !Array.isArray(this.data.users)) {
          this.data = {
            isInitialized: false,
            users: [],
            accounts: [],
            cards: [],
            transactions: [],
            notifications: [],
            conversations: [],
            messages: [],
            auditLogs: [],
            otps: [],
            beneficiaries: [],
            transferCodes: [],
            ownerResetTokens: [],
            sessions: []
          };
        }

        await pgPool.query(
          `INSERT INTO bank_store (id, data, updated_at)
           VALUES ('main', $1, NOW())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
          [JSON.stringify(this.data)]
        );
        console.log('[POSTGRES] Initialized main record in bank_store.');
        saveDB(this.data);
        return;
      } catch (err: any) {
        console.error('[POSTGRES] Database initialization failed:', err);
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`[CRITICAL DATABASE CONFIGURATION ERROR] PostgreSQL initialization failed: ${err?.message || err}`);
        }
      }
    }

    // 2. Check Firestore with 2.5s timeout guard (if configured)
    if (firestoreDb) {
      try {
        const docRef = doc(firestoreDb, 'bank_data', 'main');
        const snap: any = await Promise.race([
          getDoc(docRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 2500))
        ]);
        if (snap && snap.exists && snap.exists() && snap.data()?.data) {
          const fsData = snap.data().data as DBData;
          if (fsData && Array.isArray(fsData.users) && fsData.users.length > 0) {
            fsData.users.forEach((u: any) => {
              if (!u.passwordHash && u.password) u.passwordHash = u.password;
            });
            this.data = { ...this.data, ...fsData };
            console.log(`[FIRESTORE] Loaded persistent data: ${this.data.users.length} users, ${this.data.accounts.length} accounts, ${this.data.transactions.length} transactions.`);
            saveDB(this.data);
            return;
          }
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        console.warn('Firestore data load notice:', errMsg);
        console.warn('Disabling Firestore sync due to initial read failure / suspension.');
        disableFirestore(firestoreDb);
      }
    }

    // 3. Fallback sync if users exist
    if (this.data.users && this.data.users.length > 0) {
      await this.persist();
    }
  }

  public async persist(): Promise<void> {
    saveDB(this.data);

    if (pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO bank_store (id, data, updated_at)
           VALUES ('main', $1, NOW())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
          [JSON.stringify(this.data)]
        );
      } catch (err: any) {
        console.error('[POSTGRES] Failed to sync bank store to PostgreSQL:', err?.message || err);
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`[POSTGRES ERROR] Failed to save data to PostgreSQL: ${err?.message || err}`);
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('[CRITICAL DATABASE CONFIGURATION ERROR] DATABASE_URL is missing in production!');
    }

    if (firestoreDb) {
      const dbInstance = firestoreDb;
      const owner = this.getOwner();
      const sanitizedData = JSON.parse(JSON.stringify(this.data));
      setDoc(doc(dbInstance, 'bank_data', 'main'), {
        data: sanitizedData,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        const errMsg = String(err?.message || err);
        console.warn('Failed to sync bank store to Firestore:', errMsg);
        disableFirestore(dbInstance);
      });

      if (this.isInitialized() && firestoreDb) {
        setDoc(doc(dbInstance, 'system', 'config'), {
          isInitialized: true,
          hasOwner: true,
          ownerEmail: owner ? owner.email : null,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          const errMsg = String(err?.message || err);
          console.warn('Failed to sync system config to Firestore:', errMsg);
          disableFirestore(dbInstance);
        });
      }
    }
  }

  // --- SYSTEM STATE ---
  public isInitialized(): boolean {
    if (this.data.isInitialized) return true;
    if (this.data.users && this.data.users.some(u => u.role === 'OWNER')) {
      this.data.isInitialized = true;
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
  public async createUser(userData: Omit<User, 'id' | 'createdAt'> & { createdAt?: string }): Promise<User> {
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
    if (user.role === 'OWNER') {
      this.data.isInitialized = true;
    }
    await this.persist();
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

  public async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    await this.persist();
    return this.data.users[idx];
  }

  public async deleteUser(id: string): Promise<boolean> {
    const user = this.findUserById(id);
    if (!user || user.role === 'OWNER') return false; // Cannot delete owner

    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.accounts = this.data.accounts.filter(a => a.userId !== id);
    this.data.cards = this.data.cards.filter(c => c.userId !== id);
    await this.persist();
    return true;
  }

  // --- ACCOUNT MANAGEMENT ---
  public async createAccount(userId: string, accountType: AccountType, initialBalance: number, createdAt?: string): Promise<Account> {
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

    await this.persist();
    return account;
  }

  public async getAccountByUserId(userId: string): Promise<Account> {
    let acc = this.data.accounts.find(a => a.userId === userId);
    if (!acc) {
      const user = this.data.users.find(u => u.id === userId);
      const accNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      acc = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: userId,
        accountNumber: accNum,
        routingNumber: '021000021',
        currency: 'USD',
        balance: 15000,
        availableBalance: 15000,
        accountType: 'Checking',
        status: 'Active',
        kycStatus: user?.kycStatus || 'Verified',
        createdAt: new Date().toISOString()
      };
      this.data.accounts.push(acc);
      await this.persist();
    }
    return acc;
  }

  public getAccountByNumber(accountNumber: string): Account | undefined {
    return this.data.accounts.find(a => a.accountNumber === accountNumber.trim());
  }

  public getCardsByUserId(userId: string): DebitCard[] {
    return this.data.cards.filter(c => c.userId === userId);
  }

  public async toggleCardLock(cardId: string, userId: string): Promise<DebitCard | undefined> {
    const card = this.data.cards.find(c => c.id === cardId && c.userId === userId);
    if (!card) return undefined;
    card.isLocked = !card.isLocked;
    await this.persist();
    return card;
  }

  public async updateAccountStatus(userId: string, status: Account['status']): Promise<Account | undefined> {
    const acc = await this.getAccountByUserId(userId);
    if (!acc) return undefined;
    acc.status = status;
    await this.persist();
    return acc;
  }

  public async updateAccountKycStatus(userId: string, kycStatus: Account['kycStatus']): Promise<Account | undefined> {
    const acc = await this.getAccountByUserId(userId);
    const user = this.findUserById(userId);
    if (user) {
      user.kycStatus = kycStatus;
    }
    if (acc) {
      acc.kycStatus = kycStatus;
    }
    await this.persist();
    return acc;
  }

  public async adjustAccountBalance(userId: string, amount: number, isCredit: boolean): Promise<{ account: Account; newBalance: number } | undefined> {
    const acc = await this.getAccountByUserId(userId);
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

    await this.persist();
    return { account: acc, newBalance: acc.balance };
  }

  // --- TRANSACTIONS ---
  public async createTransaction(txData: Omit<Transaction, 'id' | 'reference' | 'createdAt'>): Promise<Transaction> {
    const tx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(tx); // Most recent first
    await this.persist();
    return tx;
  }

  public async setTransactionsForUser(userId: string, newTxs: Transaction[]): Promise<void> {
    // Remove existing transactions for user
    this.data.transactions = this.data.transactions.filter(
      t => t.senderUserId !== userId && t.recipientUserId !== userId
    );
    // Push new transactions
    this.data.transactions.push(...newTxs);
    await this.recalculateRunningBalancesForUser(userId);
  }

  public async recalculateRunningBalancesForUser(userId: string): Promise<void> {
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
    const acc = await this.getAccountByUserId(userId);
    if (acc) {
      acc.balance = Math.round(running * 100) / 100;
      acc.availableBalance = Math.round(running * 100) / 100;
    }

    // Sort all transactions descending (newest first)
    this.data.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    await this.persist();
  }

  public async addTransactionForUser(userId: string, txData: Omit<Transaction, 'id' | 'reference'> & { reference?: string }): Promise<Transaction> {
    const tx: Transaction = {
      ...txData,
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      reference: txData.reference || ('NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString())
    };

    this.data.transactions.push(tx);
    await this.recalculateRunningBalancesForUser(userId);
    return tx;
  }

  public async updateTransaction(txId: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const idx = this.data.transactions.findIndex(t => t.id === txId);
    if (idx === -1) return undefined;

    this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
    const tx = this.data.transactions[idx];
    const affectedUser = tx.recipientUserId || tx.senderUserId;
    if (affectedUser) {
      await this.recalculateRunningBalancesForUser(affectedUser);
    } else {
      await this.persist();
    }
    return tx;
  }

  public async deleteTransaction(txId: string): Promise<boolean> {
    const tx = this.data.transactions.find(t => t.id === txId);
    if (!tx) return false;

    const affectedUser = tx.recipientUserId || tx.senderUserId;
    this.data.transactions = this.data.transactions.filter(t => t.id !== txId);

    if (affectedUser) {
      await this.recalculateRunningBalancesForUser(affectedUser);
    } else {
      await this.persist();
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
  public async createNotification(notifData: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const notif: Notification = {
      ...notifData,
      id: 'ntf_' + crypto.randomBytes(6).toString('hex'),
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    await this.persist();
    return notif;
  }

  public getNotificationsForUser(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public async markNotificationsRead(userId: string): Promise<void> {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    await this.persist();
  }

  // --- SUPPORT CHAT ---
  public async getOrCreateConversation(customer: User): Promise<SupportConversation> {
    let conv = this.data.conversations.find(c => c.customerId === customer.id);
    const acc = await this.getAccountByUserId(customer.id);

    if (!conv) {
      conv = {
        id: 'cnv_' + crypto.randomBytes(6).toString('hex'),
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerAccountNumber: acc ? acc.accountNumber : 'N/A',
        status: 'Open',
        mode: 'INITIAL',
        verifiedForHuman: false,
        channel: 'IN_APP',
        isPinned: false,
        unreadByOwner: false,
        unreadByCustomer: false,
        lastMessageText: 'Welcome to Nova trust Bank Customer Support. We’re here to assist you 24/7. How may we help you today?',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.data.conversations.push(conv);

      // Auto-insert Welcome Message
      const welcomeMsg: SupportMessage = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        conversationId: conv.id,
        senderId: 'AI_BOT',
        senderRole: 'OWNER',
        senderName: 'Nova Concierge AI',
        text: 'Welcome to Nova trust Bank Customer Support. We’re here to assist you 24/7. How may we help you today?',
        createdAt: new Date().toISOString()
      };
      this.data.messages.push(welcomeMsg);

      await this.persist();
    } else {
      // Ensure conversation has welcome message if empty
      const existingMsgs = this.getMessagesForConversation(conv.id);
      if (existingMsgs.length === 0) {
        const welcomeMsg: SupportMessage = {
          id: 'msg_' + crypto.randomBytes(6).toString('hex'),
          conversationId: conv.id,
          senderId: 'AI_BOT',
          senderRole: 'OWNER',
          senderName: 'Nova Concierge AI',
          text: 'Welcome to Nova trust Bank Customer Support. We’re here to assist you 24/7. How may we help you today?',
          createdAt: new Date().toISOString()
        };
        this.data.messages.push(welcomeMsg);
        await this.persist();
      }
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

  public async updateConversationMode(
    id: string,
    mode: 'INITIAL' | 'SELECT_MODE' | 'AI_ASSISTANT' | 'HUMAN_VERIFICATION' | 'HUMAN_SUPPORT',
    verifiedForHuman?: boolean
  ): Promise<SupportConversation | undefined> {
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return undefined;
    conv.mode = mode;
    if (typeof verifiedForHuman === 'boolean') {
      conv.verifiedForHuman = verifiedForHuman;
    }
    await this.persist();
    return conv;
  }

  public async updateConversationChannel(
    id: string,
    channel: 'IN_APP' | 'WHATSAPP' | 'TELEGRAM'
  ): Promise<SupportConversation | undefined> {
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return undefined;
    conv.channel = channel;
    await this.persist();
    return conv;
  }

  public async addSupportMessage(msgData: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<SupportMessage> {
    // Deduplication check: ignore duplicate message with same content & sender within 2 seconds
    const nowMs = Date.now();
    const recentDuplicate = this.data.messages.slice(-10).find(m =>
      m.conversationId === msgData.conversationId &&
      m.senderId === msgData.senderId &&
      m.text === msgData.text &&
      (nowMs - new Date(m.createdAt).getTime()) < 2000
    );

    if (recentDuplicate) {
      return recentDuplicate;
    }

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

    await this.persist();
    return msg;
  }

  public getMessagesForConversation(conversationId: string): SupportMessage[] {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  public async updateConversationStatus(
    id: string,
    updates: Partial<Pick<SupportConversation, 'status' | 'isPinned' | 'unreadByOwner' | 'unreadByCustomer'>>
  ): Promise<SupportConversation | undefined> {
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return undefined;
    Object.assign(conv, updates);
    await this.persist();
    return conv;
  }

  // --- AUDIT LOGS ---
  public async logAudit(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const log: AuditLog = {
      ...logData,
      id: 'log_' + crypto.randomBytes(6).toString('hex'),
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    await this.persist();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs];
  }

  // --- NOTIFICATIONS ---
  public async addNotification(userId: string, type: NotificationType, title: string, message: string): Promise<Notification> {
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
    await this.persist();
    return notification;
  }

  // --- OTP GENERATION & VERIFICATION ---
  public async generateOTP(userId: string, email: string, purpose: OTPRecord['purpose']): Promise<OTPRecord> {
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
    await this.persist();
    return otp;
  }

  public async verifyOTP(userId: string, code: string, purpose: OTPRecord['purpose']): Promise<boolean> {
    const now = new Date().toISOString();
    const otp = this.data.otps.find(
      o => o.userId === userId && o.code === code.trim() && o.purpose === purpose && !o.verified && o.expiresAt > now
    );

    if (!otp) return false;
    otp.verified = true;
    await this.persist();
    return true;
  }

  // --- BENEFICIARIES ---
  public getBeneficiariesForUser(userId: string): Beneficiary[] {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    return this.data.beneficiaries.filter(b => b.userId === userId);
  }

  public async addBeneficiary(
    userId: string,
    data: { name: string; accountNumber: string; bankName: string; nickname?: string }
  ): Promise<Beneficiary> {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    
    // Check if beneficiary already exists for user
    const existing = this.data.beneficiaries.find(
      b => b.userId === userId && b.accountNumber.trim() === data.accountNumber.trim() && b.bankName.trim().toLowerCase() === data.bankName.trim().toLowerCase()
    );

    if (existing) {
      existing.name = data.name.trim();
      if (data.nickname) existing.nickname = data.nickname.trim();
      await this.persist();
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
    await this.persist();
    return beneficiary;
  }

  public async updateBeneficiary(
    beneficiaryId: string,
    userId: string,
    updates: { name?: string; accountNumber?: string; bankName?: string; nickname?: string }
  ): Promise<Beneficiary | null> {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    const ben = this.data.beneficiaries.find(b => b.id === beneficiaryId && b.userId === userId);
    if (!ben) return null;

    if (updates.name) ben.name = updates.name.trim();
    if (updates.accountNumber) ben.accountNumber = updates.accountNumber.trim();
    if (updates.bankName) ben.bankName = updates.bankName.trim();
    if (updates.nickname !== undefined) ben.nickname = updates.nickname.trim();

    await this.persist();
    return ben;
  }

  public async deleteBeneficiary(beneficiaryId: string, userId: string): Promise<boolean> {
    if (!this.data.beneficiaries) this.data.beneficiaries = [];
    const index = this.data.beneficiaries.findIndex(b => b.id === beneficiaryId && b.userId === userId);
    if (index === -1) return false;

    this.data.beneficiaries.splice(index, 1);
    await this.persist();
    return true;
  }

  // --- TRANSFER & LOGIN CODES FOR ADMIN MONITORING ---
  public async recordLoginOtp(data: {
    userId: string;
    userName: string;
    userEmail: string;
    accountNumber?: string;
    otpCode: string;
  }): Promise<TransferCodeRecord> {
    if (!this.data.transferCodes) this.data.transferCodes = [];

    // Expire existing pending login OTPs for user
    this.data.transferCodes.forEach(tc => {
      if (tc.userId === data.userId && tc.codeType === 'LOGIN_OTP' && tc.status === 'PENDING') {
        tc.status = 'EXPIRED';
      }
    });

    const record: TransferCodeRecord = {
      id: 'lotp_' + crypto.randomBytes(6).toString('hex'),
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      accountNumber: data.accountNumber || 'N/A',
      primaryOtp: data.otpCode.trim(),
      codeType: 'LOGIN_OTP',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.data.transferCodes.unshift(record);
    await this.persist();
    return record;
  }

  public async verifyLoginOtpRecord(userId: string, code: string): Promise<boolean> {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    const record = this.data.transferCodes.find(
      tc => tc.userId === userId && tc.codeType === 'LOGIN_OTP' && tc.status === 'PENDING' && tc.primaryOtp.trim() === code.trim()
    );

    if (!record) return false;
    record.status = 'VERIFIED';
    await this.persist();
    return true;
  }

  public async recordTransferCode(data: {
    userId: string;
    userName: string;
    userEmail: string;
    accountNumber: string;
    recipientName?: string;
    amount?: number;
    primaryOtp: string;
    secondaryCode: string;
  }): Promise<TransferCodeRecord> {
    if (!this.data.transferCodes) this.data.transferCodes = [];

    // Mark previous pending transfer codes for this user as expired
    this.data.transferCodes.forEach(tc => {
      if (tc.userId === data.userId && tc.codeType !== 'LOGIN_OTP' && tc.status === 'PENDING') {
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
      primaryOtp: data.primaryOtp.trim(),
      secondaryCode: data.secondaryCode.trim(),
      codeType: 'WIRE_TRANSFER',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.data.transferCodes.unshift(record);
    await this.persist();
    return record;
  }

  public getTransferCodes(): TransferCodeRecord[] {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    return [...this.data.transferCodes];
  }

  public getPendingTransferCode(userId: string): TransferCodeRecord | undefined {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    return this.data.transferCodes.find(tc => tc.userId === userId && tc.status === 'PENDING');
  }

  public verifyFirstTransferOtp(userId: string, code: string): boolean {
    const pending = this.getPendingTransferCode(userId);
    if (!pending) return false;
    return pending.primaryOtp.trim() === code.trim();
  }

  public verifySecondTransferOtp(userId: string, code: string): boolean {
    const pending = this.getPendingTransferCode(userId);
    if (!pending) return false;
    return pending.secondaryCode.trim() === code.trim();
  }

  public async markTransferCodeVerified(userId: string): Promise<boolean> {
    if (!this.data.transferCodes) this.data.transferCodes = [];
    const tc = this.data.transferCodes.find(
      c => c.userId === userId && c.status === 'PENDING'
    );
    if (tc) {
      tc.status = 'VERIFIED';
      await this.persist();
      return true;
    }
    return false;
  }

  // --- BANK SETTINGS ---
  public getSettings(): BankSettings {
    const defaultGreeting = "Welcome to Nova Trust Bank. Thank you for calling our Customer Support Hotline. At this time, live phone support is unavailable. For faster assistance, please contact us through our official WhatsApp or Telegram support channels, where our AI Assistant and Human Support Representatives are available to help you. Thank you for choosing Nova Trust Bank. Goodbye.";
    if (!this.data.settings) {
      this.data.settings = {
        whatsappNumber: '+1 (800) 555-0199',
        telegramUsername: 'NovaTrustSupport',
        telegramLink: 'https://t.me/NovaTrustSupport',
        supportEmail: 'support@novatrustbank.com',
        supportPhone: '+1 (800) 555-NOVA',
        hotlinePhone: '+1 (800) 555-NOVA',
        hotlineGreeting: defaultGreeting,
        officeAddress: '100 Financial Plaza, Suite 2800, New York, NY 10005',
        businessHours: '24/7 Digital Banking & Support'
      };
    } else {
      if (!this.data.settings.officeAddress) {
        this.data.settings.officeAddress = '100 Financial Plaza, Suite 2800, New York, NY 10005';
      }
      if (!this.data.settings.businessHours) {
        this.data.settings.businessHours = '24/7 Digital Banking & Support';
      }
      if (!this.data.settings.hotlinePhone) {
        this.data.settings.hotlinePhone = this.data.settings.supportPhone || '+1 (800) 555-NOVA';
      }
      if (!this.data.settings.hotlineGreeting) {
        this.data.settings.hotlineGreeting = defaultGreeting;
      }
      if (!this.data.settings.telegramLink) {
        this.data.settings.telegramLink = `https://t.me/${this.data.settings.telegramUsername || 'NovaTrustSupport'}`;
      }
    }
    return this.data.settings;
  }

  public async updateSettings(newSettings: Partial<BankSettings>): Promise<BankSettings> {
    const current = this.getSettings();
    this.data.settings = {
      ...current,
      ...newSettings
    };
    await this.persist();
    return this.data.settings;
  }

  public async createOwnerResetToken(userId: string, email: string): Promise<OwnerResetTokenRecord> {
    if (!this.data.ownerResetTokens) this.data.ownerResetTokens = [];

    // Invalidate existing pending reset tokens for this user
    this.data.ownerResetTokens.forEach(t => {
      if (t.userId === userId && !t.used) {
        t.used = true;
      }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const record: OwnerResetTokenRecord = {
      id: 'owntok_' + crypto.randomBytes(6).toString('hex'),
      userId,
      email: email.toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    };

    this.data.ownerResetTokens.unshift(record);
    await this.persist();
    return record;
  }

  public getOwnerResetToken(token: string): OwnerResetTokenRecord | undefined {
    if (!this.data.ownerResetTokens) this.data.ownerResetTokens = [];
    return this.data.ownerResetTokens.find(t => t.token.trim() === token.trim());
  }

  public verifyOwnerResetToken(token: string): { valid: boolean; error?: string; record?: OwnerResetTokenRecord } {
    const record = this.getOwnerResetToken(token);
    if (!record) {
      return { valid: false, error: 'Invalid or expired password reset token. Please request a new link.' };
    }
    if (record.used) {
      return { valid: false, error: 'This password reset link has already been used. Please request a new link.' };
    }
    const expiresMs = new Date(record.expiresAt).getTime();
    if (isNaN(expiresMs) || expiresMs < Date.now()) {
      return { valid: false, error: 'This password reset link has expired (15-minute limit exceeded). Please request a new link.' };
    }
    return { valid: true, record };
  }

  public async invalidateOwnerResetToken(token: string): Promise<void> {
    const record = this.getOwnerResetToken(token);
    if (record) {
      record.used = true;
      await this.persist();
    }
  }

  // --- PERSISTENT SESSION MANAGEMENT ---
  public async createSession(userId: string, role: UserRole): Promise<SessionRecord> {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    const token = 'ntb_sess_' + crypto.randomBytes(24).toString('hex');
    const session: SessionRecord = {
      token,
      userId,
      role,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days validity
      createdAt: new Date().toISOString()
    };
    this.data.sessions.push(session);
    await this.persist();
    return session;
  }

  public getSession(token: string): SessionRecord | undefined {
    if (!this.data.sessions) this.data.sessions = [];
    const cleanToken = token.trim();
    const session = this.data.sessions.find(s => s.token === cleanToken);
    if (!session) return undefined;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(cleanToken);
      return undefined;
    }
    return session;
  }

  public async deleteSession(token: string): Promise<void> {
    if (!this.data.sessions) return;
    const cleanToken = token.trim();
    this.data.sessions = this.data.sessions.filter(s => s.token !== cleanToken);
    await this.persist();
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    if (!this.data.sessions) return;
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
    await this.persist();
  }
}

export const store = new BankStore();
