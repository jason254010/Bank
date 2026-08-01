import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { store } from './src/server/store.js';
import { generateHistoricalTransactions } from './src/server/generator.js';
import { UserRole, AccountStatus } from './src/types.js';

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for base64 attachment uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple in-memory session tokens map (token -> userId)
const sessions = new Map<string, { userId: string; role: UserRole; expiresAt: number }>();

function createSession(userId: string, role: UserRole): string {
  const token = 'ntb_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  // Session valid for 24 hours
  sessions.set(token, { userId, role, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return token;
}

function getSessionUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }
  const user = store.findUserById(session.userId);
  return user || null;
}

// Middleware: Require Auth
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }
  (req as any).user = user;
  next();
}

// Middleware: Require Owner
function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'OWNER') {
    return res.status(403).json({ error: 'Access denied: Owner privilege required' });
  }
  (req as any).user = user;
  next();
}

// Client IP Helper
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// ==================== API ROUTES ====================

// System status (Check if owner exists)
app.get('/api/system/status', (req, res) => {
  const hasOwner = store.hasOwner();
  const isInitialized = store.isInitialized();
  const owner = store.getOwner();
  res.json({
    hasOwner,
    isInitialized,
    ownerEmail: owner ? owner.email : null
  });
});

// Phase 1: Owner Setup (First launch only)
app.post('/api/auth/owner-setup', (req, res) => {
  if (store.hasOwner()) {
    return res.status(400).json({ error: 'Owner account has already been set up. Setup is disabled.' });
  }

  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email and passwords are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const owner = store.createUser({
    email: email.trim().toLowerCase(),
    role: 'OWNER',
    fullName: 'Bank Administrator',
    passwordHash: password, // Simple secure simulation
    emailVerified: true
  });

  store.logAudit({
    userId: owner.id,
    userEmail: owner.email,
    action: 'INITIAL_OWNER_SETUP',
    details: 'Initial bank owner account created successfully',
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  const token = createSession(owner.id, 'OWNER');
  res.json({
    message: 'Owner account created successfully',
    user: owner,
    token
  });
});

// Phase 1: Authentication Login (Owner & Customer)
app.post('/api/auth/login', (req, res) => {
  const { loginIdentifier, password, loginType } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Login identifier and password are required.' });
  }

  let user = store.findUserByEmail(loginIdentifier);

  if (!user && loginType === 'CUSTOMER') {
    // Try finding by Customer ID (e.g. CID-849201)
    user = store.findUserByCustomerId(loginIdentifier);
    if (!user) {
      // Try finding by username
      user = store.findUserByUsername(loginIdentifier);
    }
    if (!user) {
      // Try finding by account number
      const found = store.findUserByAccountNumber(loginIdentifier);
      if (found) user = found.user;
    }
  }

  if (!user) {
    store.logAudit({
      action: 'LOGIN_FAILED',
      details: `Failed login attempt for identifier: ${loginIdentifier}`,
      ipAddress: getClientIp(req),
      status: 'FAILED'
    });
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  if (loginType && user.role !== loginType) {
    return res.status(403).json({ error: `This account is not authorized as ${loginType.toLowerCase()}.` });
  }

  if (user.passwordHash !== password) {
    store.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      details: 'Invalid password provided',
      ipAddress: getClientIp(req),
      status: 'FAILED'
    });
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  // Update last login
  const ip = getClientIp(req);
  store.updateUser(user.id, {
    lastLoginAt: new Date().toISOString(),
    lastLoginIp: ip
  });

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'LOGIN_SUCCESS',
    details: `${user.role} logged in successfully`,
    ipAddress: ip,
    status: 'SUCCESS'
  });

  // Notify customer of login
  if (user.role === 'CUSTOMER') {
    store.createNotification({
      userId: user.id,
      title: 'New Login Detected',
      message: `A new login to your account was detected from IP ${ip} on ${new Date().toLocaleString()}.`,
      type: 'LOGIN_DETECTED'
    });
  }

  const token = createSession(user.id, user.role);
  const account = store.getAccountByUserId(user.id);

  res.json({
    user,
    account,
    token
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    sessions.delete(token);
  }
  res.json({ success: true });
});

// Get Current User Info
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user;
  const account = store.getAccountByUserId(user.id);
  res.json({ user, account });
});

// Password Reset Request
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = store.findUserByEmail(email);
  if (!user) {
    // Return success for security, but log
    return res.json({ message: 'If an account exists with that email, a password reset OTP code has been generated.' });
  }

  const otp = store.generateOTP(user.id, user.email, 'PASSWORD_RESET');
  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'PASSWORD_RESET_REQUEST',
    details: `Generated password reset OTP: ${otp.code}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({
    message: 'Password reset OTP generated.',
    otpCodeHint: otp.code // For testing/demonstration in preview UI
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  const user = store.findUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'User not found.' });

  const verified = store.verifyOTP(user.id, otpCode, 'PASSWORD_RESET');
  if (!verified) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  store.updateUser(user.id, { passwordHash: newPassword });
  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'PASSWORD_RESET_SUCCESS',
    details: 'Password was successfully reset using OTP',
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  store.createNotification({
    userId: user.id,
    title: 'Password Changed',
    message: 'Your account password was successfully updated.',
    type: 'PASSWORD_CHANGED'
  });

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// ==================== PHASE 2: OWNER DASHBOARD API ====================

// Get All Customers (Owner Only)
app.get('/api/admin/customers', requireOwner, (req, res) => {
  const customers = store.getAllCustomers();
  const enriched = customers.map(c => {
    const account = store.getAccountByUserId(c.id);
    return {
      ...c,
      account
    };
  });
  res.json(enriched);
});

// Create Customer (Owner Only)
app.post('/api/admin/customers', requireOwner, (req, res) => {
  const { fullName, email, password, phoneNumber, dateOfBirth, address, accountType, initialBalance, accountCreatedAt, generateHistory } = req.body;

  if (!fullName || !email || !accountType) {
    return res.status(400).json({ error: 'Full Name, Email, and Account Type are required.' });
  }

  if (!password || password.trim().length < 4) {
    return res.status(400).json({ error: 'The Bank Owner must manually enter and assign the initial customer password (min 4 chars).' });
  }

  if (store.findUserByEmail(email)) {
    return res.status(400).json({ error: 'A customer with this email address already exists.' });
  }

  const assignedPassword = password.trim();
  const createdAtDate = accountCreatedAt ? new Date(accountCreatedAt).toISOString() : new Date().toISOString();

  const customer = store.createUser({
    email: email.trim().toLowerCase(),
    role: 'CUSTOMER',
    fullName: fullName.trim(),
    phoneNumber,
    dateOfBirth,
    address,
    passwordHash: assignedPassword,
    emailVerified: true,
    kycStatus: 'Verified',
    createdAt: createdAtDate
  });

  const deposit = parseFloat(initialBalance) || 0;
  const account = store.createAccount(customer.id, accountType || 'Checking', deposit, createdAtDate);

  // Generate historical demo transactions covering from creation date to present if requested
  if (generateHistory !== false) {
    const historicalTxs = generateHistoricalTransactions(
      customer.id,
      customer.fullName,
      account.accountNumber,
      createdAtDate,
      deposit
    );
    store.setTransactionsForUser(customer.id, historicalTxs);
  } else if (deposit > 0) {
    store.createTransaction({
      recipientUserId: customer.id,
      recipientName: customer.fullName,
      recipientAccountNumber: account.accountNumber,
      bankName: 'Nova Trust Bank',
      amount: deposit,
      fee: 0,
      description: 'Initial Account Deposit',
      type: 'Initial Deposit',
      status: 'Completed'
    });
    store.recalculateRunningBalancesForUser(customer.id);
  }

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'CREATE_CUSTOMER',
    details: `Created customer ${customer.fullName} (${customer.email}) [ID: ${customer.customerId}] with account ${account.accountNumber} starting on ${createdAtDate.split('T')[0]}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  // Automatically start/get support conversation for customer
  store.getOrCreateConversation(customer);

  res.json({
    message: 'Customer account created successfully',
    customer,
    account: store.getAccountByUserId(customer.id),
    assignedPassword,
    loginUrl: '/login'
  });
});

// Update Customer KYC Status (Owner Only)
app.post('/api/admin/customers/:id/kyc-status', requireOwner, (req, res) => {
  const { kycStatus } = req.body;
  if (!['Verified', 'Verification Required', 'Suspended'].includes(kycStatus)) {
    return res.status(400).json({ error: 'Invalid KYC Status value.' });
  }

  const customer = store.findUserById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  store.updateAccountKycStatus(customer.id, kycStatus);

  // Notify customer
  let msg = `Your account KYC status has been set to: ${kycStatus}`;
  if (kycStatus === 'Verification Required' || kycStatus === 'Suspended') {
    msg = `Your account has been temporarily restricted because your KYC verification is incomplete or suspended. Please contact Customer Support to complete your identity verification.`;
  }
  store.addNotification(customer.id, 'SYSTEM_ALERT', 'KYC Status Update', msg);

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'UPDATE_KYC_STATUS',
    details: `Updated KYC status for ${customer.fullName} (${customer.id}) to ${kycStatus}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ message: 'KYC status updated successfully', customer: store.findUserById(customer.id), account: store.getAccountByUserId(customer.id) });
});

// Reset Customer Password by Bank Owner
app.post('/api/admin/customers/:id/reset-password', requireOwner, (req, res) => {
  const { newPassword } = req.body;
  const customer = store.findUserById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const resetPassword = newPassword && newPassword.trim() ? newPassword.trim() : ('Nova' + Math.floor(100000 + Math.random() * 900000));
  store.updateUser(customer.id, { passwordHash: resetPassword });

  store.addNotification(customer.id, 'PASSWORD_CHANGED', 'Password Reset by Bank Admin', `Your account login password has been updated by bank security. New credentials active immediately.`);

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'ADMIN_RESET_PASSWORD',
    details: `Bank Owner reset password for ${customer.fullName} (${customer.id})`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ message: 'Customer password updated successfully', newPassword: resetPassword });
});

// Send/Generate Customer Verification Code (OTP & Passcode)
app.post('/api/admin/customers/:id/send-verification-code', requireOwner, (req, res) => {
  const customer = store.findUserById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const account = store.getAccountByUserId(customer.id);

  const primaryOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const secondaryCode = 'COT-' + Math.floor(100000 + Math.random() * 900000).toString();

  store.addNotification(customer.id, 'SYSTEM_ALERT', 'Security Verification Code', `Your security verification OTP code is: ${primaryOtp}. Transfer Code: ${secondaryCode}`);

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'GENERATE_VERIFICATION_CODE',
    details: `Generated security verification codes for ${customer.fullName} (OTP: ${primaryOtp})`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({
    message: 'Verification code generated and sent to customer',
    primaryOtp,
    secondaryCode,
    customerName: customer.fullName,
    customerEmail: customer.email,
    accountNumber: account?.accountNumber
  });
});

// Regenerate Customer Transaction History (Owner Only)
app.post('/api/admin/customers/:id/regenerate-history', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const customer = store.findUserById(customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });

  const account = store.getAccountByUserId(customerId);
  if (!account) return res.status(404).json({ error: 'Customer account not found.' });

  const { startDate, targetBalance } = req.body;
  const startDateStr = startDate ? new Date(startDate).toISOString() : (account.createdAt || new Date('2020-01-15').toISOString());
  const balanceVal = targetBalance !== undefined && !isNaN(parseFloat(targetBalance)) ? parseFloat(targetBalance) : account.balance;

  account.createdAt = startDateStr;
  customer.createdAt = startDateStr;

  const txs = generateHistoricalTransactions(
    customer.id,
    customer.fullName,
    account.accountNumber,
    startDateStr,
    balanceVal
  );

  store.setTransactionsForUser(customer.id, txs);

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'REGENERATE_HISTORY',
    details: `Regenerated transaction history for customer ${customer.fullName} starting ${startDateStr.split('T')[0]} ending balance $${balanceVal}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({
    message: 'Historical transaction history regenerated successfully',
    account: store.getAccountByUserId(customer.id),
    transactions: store.getTransactionsForUser(customer.id)
  });
});

// Add Single Transaction Entry for Customer (Owner Only)
app.post('/api/admin/customers/:id/transactions', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const customer = store.findUserById(customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });

  const account = store.getAccountByUserId(customerId);
  if (!account) return res.status(404).json({ error: 'Customer account not found.' });

  const { type, amount, description, bankName, counterpartyName, createdAt, reference } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Valid positive amount is required.' });
  }

  const isCredit = type === 'Credit' || type === 'Transfer Received' || type === 'Initial Deposit' || type === 'Credit Adjustment';
  const amtVal = Math.round(parseFloat(amount) * 100) / 100;

  const txData: any = {
    amount: amtVal,
    fee: 0,
    description: description || (isCredit ? 'Direct Credit Deposit' : 'Outward Debit Payment'),
    type: isCredit ? 'Transfer Received' : 'Transfer Sent',
    status: 'Completed',
    createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    reference
  };

  if (isCredit) {
    txData.recipientUserId = customer.id;
    txData.recipientName = customer.fullName;
    txData.recipientAccountNumber = account.accountNumber;
    txData.senderName = counterpartyName || 'External Remitter';
    txData.bankName = bankName || 'Nova Trust Bank';
  } else {
    txData.senderUserId = customer.id;
    txData.senderName = customer.fullName;
    txData.senderAccountNumber = account.accountNumber;
    txData.recipientName = counterpartyName || 'External Beneficiary';
    txData.bankName = bankName || 'Nova Trust Bank';
    txData.recipientAccountNumber = '998' + Math.floor(100000 + Math.random() * 900000).toString();
  }

  const newTx = store.addTransactionForUser(customer.id, txData);

  res.json({
    message: 'Transaction added successfully',
    transaction: newTx,
    account: store.getAccountByUserId(customer.id),
    transactions: store.getTransactionsForUser(customer.id)
  });
});

// Edit Transaction Entry (Owner Only)
app.put('/api/admin/transactions/:txId', requireOwner, (req, res) => {
  const { txId } = req.params;
  const { description, amount, createdAt, counterpartyName, bankName, type } = req.body;

  const updates: any = {};
  if (description !== undefined) updates.description = description;
  if (amount !== undefined && !isNaN(parseFloat(amount))) updates.amount = parseFloat(amount);
  if (createdAt !== undefined) updates.createdAt = new Date(createdAt).toISOString();
  if (bankName !== undefined) updates.bankName = bankName;

  if (counterpartyName !== undefined) {
    updates.senderName = counterpartyName;
    updates.recipientName = counterpartyName;
  }

  if (type !== undefined) {
    const isCredit = type === 'Credit' || type === 'Transfer Received' || type === 'Initial Deposit';
    updates.type = isCredit ? 'Transfer Received' : 'Transfer Sent';
  }

  const updated = store.updateTransaction(txId, updates);
  if (!updated) return res.status(404).json({ error: 'Transaction not found.' });

  res.json({
    message: 'Transaction updated successfully',
    transaction: updated
  });
});

// Delete Transaction Entry (Owner Only)
app.delete('/api/admin/transactions/:txId', requireOwner, (req, res) => {
  const { txId } = req.params;
  const success = store.deleteTransaction(txId);
  if (!success) return res.status(404).json({ error: 'Transaction not found.' });

  res.json({ message: 'Transaction deleted successfully.' });
});

// Update Customer Details (By Admin/Owner)
app.put('/api/admin/customers/:id', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { fullName, email, phoneNumber, address, dateOfBirth, username, profilePicture } = req.body;

  const updateFields: any = {};
  if (fullName !== undefined) updateFields.fullName = fullName;
  if (email !== undefined) updateFields.email = email;
  if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
  if (address !== undefined) updateFields.address = address;
  if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
  if (username !== undefined) updateFields.username = username;
  if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

  const updated = store.updateUser(customerId, updateFields);

  if (!updated) return res.status(404).json({ error: 'Customer not found' });

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'UPDATE_CUSTOMER',
    details: `Updated details for customer ID ${customerId}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ customer: updated });
});

// Update Customer Own Profile
app.put('/api/customer/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { fullName, phoneNumber, address, dateOfBirth, username, profilePicture } = req.body;

  const updateFields: any = {};
  if (fullName !== undefined && fullName.trim()) updateFields.fullName = fullName.trim();
  if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
  if (address !== undefined) updateFields.address = address;
  if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
  if (username !== undefined) updateFields.username = username;
  if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

  const updated = store.updateUser(user.id, updateFields);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'UPDATE_PROFILE',
    details: 'Customer updated profile information',
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ user: updated });
});

// Delete Customer Profile Picture
app.delete('/api/customer/profile/picture', requireAuth, (req, res) => {
  const user = (req as any).user;
  const updated = store.updateUser(user.id, { profilePicture: '' });
  if (!updated) return res.status(404).json({ error: 'User not found' });

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'REMOVE_PROFILE_PICTURE',
    details: 'Customer removed profile picture',
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ user: updated });
});

// Get Full Customer Profile Details (for Owner view)
app.get('/api/admin/customers/:id/details', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const customer = store.findUserById(customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const account = store.getAccountByUserId(customerId);
  const transactions = store.getTransactionsForUser(customerId);
  const beneficiaries = store.getBeneficiariesForUser(customerId);
  const conversation = store.getOrCreateConversation(customer);
  const messages = store.getMessagesForConversation(conversation.id);
  const auditLogs = store.getAuditLogs().filter(l => l.userId === customerId || l.userEmail === customer.email);

  res.json({
    customer,
    account,
    transactions,
    beneficiaries,
    conversation,
    messages,
    activityHistory: auditLogs
  });
});

// Direct Send Message from Owner to Customer
app.post('/api/admin/customers/:id/send-message', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { text, attachments } = req.body;
  const owner = (req as any).user;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const customer = store.findUserById(customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const conversation = store.getOrCreateConversation(customer);

  const msg = store.addSupportMessage({
    conversationId: conversation.id,
    senderId: owner.id,
    senderRole: 'OWNER',
    senderName: owner.fullName,
    text: text.trim(),
    attachments: attachments || []
  });

  store.createNotification({
    userId: customerId,
    title: 'New Support Message from Bank Administration',
    message: text.length > 80 ? text.substring(0, 77) + '...' : text,
    type: 'SYSTEM_ALERT'
  });

  res.json({ message: msg, conversation });
});

// Delete Customer
app.delete('/api/admin/customers/:id', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const success = store.deleteUser(customerId);
  if (!success) return res.status(400).json({ error: 'Failed to delete customer' });

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'DELETE_CUSTOMER',
    details: `Deleted customer ID ${customerId}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ message: 'Customer account deleted successfully' });
});

// Update Account Status (Freeze, Unfreeze, Suspend, Reactivate, Close)
app.post('/api/admin/customers/:id/status', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { status } = req.body as { status: AccountStatus };

  if (!['Active', 'Frozen', 'Suspended', 'Closed', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid account status value' });
  }

  const account = store.updateAccountStatus(customerId, status);
  if (!account) return res.status(404).json({ error: 'Customer account not found' });

  let notifType: any = 'ACCOUNT_FROZEN';
  if (status === 'Active') notifType = 'ACCOUNT_UNFROZEN';
  if (status === 'Suspended') notifType = 'ACCOUNT_SUSPENDED';

  store.createNotification({
    userId: customerId,
    title: `Account Status Updated: ${status}`,
    message: `Your Nova Trust Bank account status has been changed to ${status} by bank administration.`,
    type: notifType
  });

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'UPDATE_ACCOUNT_STATUS',
    details: `Changed account ${account.accountNumber} status to ${status}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ account });
});

// Credit/Debit Customer Balance
app.post('/api/admin/customers/:id/balance', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { amount, type, description } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive amount required' });
  }

  const isCredit = type === 'CREDIT';
  const customer = store.findUserById(customerId);
  const account = store.getAccountByUserId(customerId);

  if (!customer || !account) return res.status(404).json({ error: 'Customer or account not found' });

  try {
    const result = store.adjustAccountBalance(customerId, numAmount, isCredit);

    const txType = isCredit ? 'Credit Adjustment' : 'Debit Adjustment';
    store.createTransaction({
      recipientUserId: customerId,
      recipientName: customer.fullName,
      recipientAccountNumber: account.accountNumber,
      bankName: 'Nova Trust Bank',
      amount: numAmount,
      fee: 0,
      description: description || `${isCredit ? 'Credit' : 'Debit'} balance adjustment by Owner`,
      type: txType,
      status: 'Completed'
    });

    store.createNotification({
      userId: customerId,
      title: isCredit ? 'Account Credited' : 'Account Debited',
      message: `Your account balance was ${isCredit ? 'credited' : 'debited'} by $${numAmount.toFixed(2)}. ${description ? `Note: ${description}` : ''}`,
      type: isCredit ? 'MONEY_RECEIVED' : 'MONEY_SENT',
      amount: numAmount
    });

    store.logAudit({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: isCredit ? 'CREDIT_BALANCE' : 'DEBIT_BALANCE',
      details: `${isCredit ? 'Credited' : 'Debited'} $${numAmount} for customer ${customer.fullName} (${account.accountNumber})`,
      ipAddress: getClientIp(req),
      status: 'SUCCESS'
    });

    res.json({ account: result?.account, message: `Successfully ${isCredit ? 'credited' : 'debited'} $${numAmount.toFixed(2)}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Balance adjustment failed' });
  }
});

// Admin Reset Password for Customer
app.post('/api/admin/customers/:id/reset-password', requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { newPassword } = req.body || {};
  const passToSet = newPassword && newPassword.trim() ? newPassword.trim() : ('Nova' + Math.floor(1000 + Math.random() * 9000) + '!');

  const updated = store.updateUser(customerId, { passwordHash: passToSet });
  if (!updated) return res.status(404).json({ error: 'Customer not found' });

  store.createNotification({
    userId: customerId,
    title: 'Password Reset by Administration',
    message: `Your account password has been updated by bank administration. Your new active login password is: ${passToSet}`,
    type: 'PASSWORD_CHANGED'
  });

  store.logAudit({
    userId: (req as any).user.id,
    userEmail: (req as any).user.email,
    action: 'ADMIN_RESET_PASSWORD',
    details: `Reset active login password for customer ${updated.fullName} (${updated.email})`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ newPassword: passToSet, temporaryPassword: passToSet, message: 'Password reset successfully' });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireOwner, (req, res) => {
  res.json(store.getAuditLogs());
});

// Admin All Transactions
app.get('/api/admin/transactions', requireOwner, (req, res) => {
  res.json(store.getAllTransactions());
});

// ==================== PHASE 3: CUSTOMER ONLINE BANKING API ====================

app.get('/api/customer/dashboard', requireAuth, (req, res) => {
  const user = (req as any).user;
  const account = store.getAccountByUserId(user.id);
  const cards = store.getCardsByUserId(user.id);
  const recentTransactions = store.getTransactionsForUser(user.id).slice(0, 10);
  const notifications = store.getNotificationsForUser(user.id);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  res.json({
    user,
    account,
    cards,
    recentTransactions,
    unreadNotifications
  });
});

app.get('/api/customer/transactions', requireAuth, (req, res) => {
  const user = (req as any).user;
  let txs = store.getTransactionsForUser(user.id);

  const { search, type } = req.query;
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    txs = txs.filter(t => 
      t.recipientName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q)
    );
  }

  if (type && typeof type === 'string' && type !== 'ALL') {
    txs = txs.filter(t => t.type === type);
  }

  res.json(txs);
});

app.get('/api/customer/notifications', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(store.getNotificationsForUser(user.id));
});

app.post('/api/customer/notifications/mark-read', requireAuth, (req, res) => {
  const user = (req as any).user;
  store.markNotificationsRead(user.id);
  res.json({ success: true });
});

app.get('/api/customer/cards', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(store.getCardsByUserId(user.id));
});

app.post('/api/customer/cards/:cardId/toggle-lock', requireAuth, (req, res) => {
  const user = (req as any).user;
  const cardId = req.params.cardId;
  const card = store.toggleCardLock(cardId, user.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

app.put('/api/customer/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { phoneNumber, address, username } = req.body;

  if (username && username.trim().length > 0) {
    const existing = store.findUserByUsername(username.trim());
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
  }

  const updated = store.updateUser(user.id, {
    phoneNumber,
    address,
    username: username ? username.trim() : user.username
  });

  res.json({ user: updated });
});

app.post('/api/customer/change-password', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (user.passwordHash !== currentPassword) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  store.updateUser(user.id, { passwordHash: newPassword });

  store.createNotification({
    userId: user.id,
    title: 'Password Changed',
    message: 'Your account password was successfully updated.',
    type: 'PASSWORD_CHANGED'
  });

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'CHANGE_PASSWORD',
    details: 'User successfully changed password',
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({ message: 'Password updated successfully' });
});

// ==================== PHASE 4: INTERNAL TRANSFERS API ====================

app.post('/api/transfers/validate-recipient', requireAuth, (req, res) => {
  const { accountNumber } = req.body;

  if (!accountNumber) {
    return res.status(400).json({ error: 'Account number is required' });
  }

  const found = store.findUserByAccountNumber(accountNumber.trim());
  if (found) {
    res.json({
      isInternal: true,
      recipientName: found.user.fullName,
      accountNumber: found.account.accountNumber,
      bankName: 'Nova Trust Bank'
    });
  } else {
    // External or unmapped internal recipient
    res.json({
      isInternal: false,
      recipientName: 'External Account Holder',
      accountNumber: accountNumber.trim(),
      bankName: 'Partner Institution'
    });
  }
});

app.post('/api/transfers/request-otp', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { recipientName, amount } = req.body || {};
  const senderAccount = store.getAccountByUserId(user.id);

  if (user.kycStatus === 'Verification Required' || user.kycStatus === 'Suspended' || senderAccount?.kycStatus === 'Verification Required' || senderAccount?.kycStatus === 'Suspended') {
    return res.status(403).json({ error: 'Your account has been temporarily restricted because your KYC verification is incomplete. Please contact Customer Support to complete your identity verification.' });
  }

  if (senderAccount && senderAccount.status !== 'Active') {
    return res.status(403).json({ error: `Transfers disabled. Account status is currently ${senderAccount.status}. Please contact Customer Support.` });
  }

  const otp = store.generateOTP(user.id, user.email, 'TRANSFER');
  const predefinedCodes = ['254010', '969433', '969443', '443969'];
  const secondCode = predefinedCodes[Math.floor(Math.random() * predefinedCodes.length)];

  // Record transfer code for Admin viewing
  store.recordTransferCode({
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    accountNumber: senderAccount ? senderAccount.accountNumber : 'N/A',
    recipientName: recipientName || 'External Recipient',
    amount: parseFloat(amount) || 0,
    primaryOtp: otp.code,
    secondaryCode: secondCode
  });

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'TRANSFER_OTP_REQUESTED',
    details: `Generated OTP code: ${otp.code}, Secondary Code: ${secondCode} for ${user.fullName}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  // Do NOT send codes to customer response, just return confirmation!
  res.json({
    message: 'Transfer verification codes generated and sent to bank administration. Please request verification code from your relationship manager or support desk.',
    success: true
  });
});

// Get transfer verification codes for Admin
app.get('/api/admin/transfer-codes', requireOwner, (req, res) => {
  const codes = store.getTransferCodes();
  res.json(codes);
});

app.post('/api/transfers/execute', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { recipientAccountNumber, recipientName, bankName, amount, description, otpCode, secondCode, saveAsBeneficiary, beneficiaryNickname } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid transfer amount.' });
  }

  // 1. Verify OTP
  const isOtpValid = store.verifyOTP(user.id, otpCode, 'TRANSFER');
  if (!isOtpValid) {
    return res.status(400).json({ error: 'Invalid or expired primary OTP verification code.' });
  }

  // 1b. Verify Secondary Code
  const predefinedCodes = ['254010', '969433', '969443', '443969'];
  if (!secondCode || !predefinedCodes.includes(secondCode)) {
    return res.status(400).json({ error: 'Invalid secondary verification authorization passcode.' });
  }
  store.markTransferCodeVerified(user.id, secondCode);

  // 2. Validate sender account status and balance
  const senderAccount = store.getAccountByUserId(user.id);
  if (!senderAccount) {
    return res.status(404).json({ error: 'Sender account not found.' });
  }

  if (user.kycStatus === 'Verification Required' || user.kycStatus === 'Suspended' || senderAccount.kycStatus === 'Verification Required' || senderAccount.kycStatus === 'Suspended') {
    return res.status(403).json({ error: 'Your account has been temporarily restricted because your KYC verification is incomplete. Please contact Customer Support to complete your identity verification.' });
  }

  if (senderAccount.status !== 'Active') {
    return res.status(403).json({ error: `Transfers disabled. Account status is currently: ${senderAccount.status}. Please contact Customer Support.` });
  }

  if (senderAccount.availableBalance < numAmount) {
    return res.status(400).json({ error: 'Insufficient funds for this transfer.' });
  }

  // 3. Check internal recipient if within Nova Trust Bank
  const recipientLookup = store.findUserByAccountNumber(recipientAccountNumber);
  const recipientUser = recipientLookup?.user;
  const recipientAccount = recipientLookup?.account;

  if (recipientAccount && recipientAccount.id === senderAccount.id) {
    return res.status(400).json({ error: 'Cannot transfer money to the same account.' });
  }

  // 4. Debit sender balance
  store.adjustAccountBalance(user.id, numAmount, false);

  // 5. Save as beneficiary if requested
  if (saveAsBeneficiary) {
    store.addBeneficiary(user.id, {
      name: recipientName || (recipientUser ? recipientUser.fullName : 'Saved Beneficiary'),
      accountNumber: recipientAccountNumber.trim(),
      bankName: bankName || 'Nova Trust Bank',
      nickname: beneficiaryNickname
    });
  }

  // 6. Create sender transaction record
  const senderTx = store.createTransaction({
    senderUserId: user.id,
    senderName: user.fullName,
    senderAccountNumber: senderAccount.accountNumber,
    recipientUserId: recipientUser ? recipientUser.id : undefined,
    recipientName: recipientName || (recipientUser ? recipientUser.fullName : 'External Recipient'),
    recipientAccountNumber: recipientAccountNumber.trim(),
    bankName: bankName || 'Nova Trust Bank',
    amount: numAmount,
    fee: 0,
    description: description || 'Transfer',
    type: 'Transfer Sent',
    status: 'Completed'
  });

  // 7. Notify sender
  store.createNotification({
    userId: user.id,
    title: 'Transfer Sent Successfully',
    message: `You transferred $${numAmount.toFixed(2)} to ${senderTx.recipientName} (${recipientAccountNumber}). Ref: ${senderTx.reference}`,
    type: 'MONEY_SENT',
    amount: numAmount
  });

  // 8. Credit recipient if inside application
  if (recipientUser && recipientAccount) {
    store.adjustAccountBalance(recipientUser.id, numAmount, true);

    store.createTransaction({
      senderUserId: user.id,
      senderName: user.fullName,
      senderAccountNumber: senderAccount.accountNumber,
      recipientUserId: recipientUser.id,
      recipientName: recipientUser.fullName,
      recipientAccountNumber: recipientAccount.accountNumber,
      bankName: bankName || 'Nova Trust Bank',
      amount: numAmount,
      fee: 0,
      description: description || 'Internal Transfer Received',
      type: 'Transfer Received',
      status: 'Completed'
    });

    store.createNotification({
      userId: recipientUser.id,
      title: 'Money Received',
      message: `You received $${numAmount.toFixed(2)} from ${user.fullName} (${senderAccount.accountNumber}). Ref: ${senderTx.reference}`,
      type: 'MONEY_RECEIVED',
      amount: numAmount
    });
  }

  store.logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'TRANSFER_COMPLETED',
    details: `Transferred $${numAmount} to ${recipientAccountNumber}. Reference: ${senderTx.reference}`,
    ipAddress: getClientIp(req),
    status: 'SUCCESS'
  });

  res.json({
    message: 'Transfer completed successfully',
    transaction: senderTx,
    updatedAccount: store.getAccountByUserId(user.id)
  });
});

// ==================== BENEFICIARIES API ====================

app.get('/api/customer/beneficiaries', requireAuth, (req, res) => {
  const user = (req as any).user;
  const list = store.getBeneficiariesForUser(user.id);
  res.json(list);
});

app.post('/api/customer/beneficiaries', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { name, accountNumber, bankName, nickname } = req.body;

  if (!name || !accountNumber || !bankName) {
    return res.status(400).json({ error: 'Name, Account Number, and Bank Name are required' });
  }

  const ben = store.addBeneficiary(user.id, {
    name,
    accountNumber,
    bankName,
    nickname
  });

  res.json(ben);
});

app.put('/api/customer/beneficiaries/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const benId = req.params.id;
  const { name, accountNumber, bankName, nickname } = req.body;

  const updated = store.updateBeneficiary(benId, user.id, {
    name,
    accountNumber,
    bankName,
    nickname
  });

  if (!updated) {
    return res.status(404).json({ error: 'Beneficiary not found' });
  }

  res.json(updated);
});

app.delete('/api/customer/beneficiaries/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const benId = req.params.id;

  const success = store.deleteBeneficiary(benId, user.id);
  if (!success) {
    return res.status(404).json({ error: 'Beneficiary not found' });
  }

  res.json({ success: true, message: 'Beneficiary deleted successfully' });
});


// ==================== PHASE 7: REAL-TIME CUSTOMER SUPPORT API ====================

app.get('/api/support/conversations', requireAuth, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'OWNER') {
    res.json(store.getAllConversations());
  } else {
    const conv = store.getOrCreateConversation(user);
    res.json([conv]);
  }
});

app.get('/api/support/conversations/:id/messages', requireAuth, (req, res) => {
  const convId = req.params.id;
  const messages = store.getMessagesForConversation(convId);
  res.json(messages);
});

app.post('/api/support/messages', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { conversationId, text, attachments } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }

  const msg = store.addSupportMessage({
    conversationId,
    senderId: user.id,
    senderRole: user.role,
    senderName: user.fullName,
    text: text || '',
    attachments: attachments || []
  });

  res.json(msg);
});

app.put('/api/support/conversations/:id/status', requireAuth, (req, res) => {
  const id = req.params.id;
  const { status, isPinned, unreadByOwner, unreadByCustomer } = req.body;

  const conv = store.updateConversationStatus(id, {
    status,
    isPinned,
    unreadByOwner,
    unreadByCustomer
  });

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conv);
});

// ==================== TEMPORARY PROJECT ZIP DOWNLOAD ROUTE ====================
const handleDownloadProjectZip = (req: Request, res: Response) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const zip = new AdmZip();
    const rootDir = process.cwd();

    function addFilesRecursively(currentPath: string, zipPath: string) {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const item of items) {
        if (
          item.name === 'node_modules' ||
          item.name === '.git' ||
          item.name === 'dist' ||
          item.name === '.cache' ||
          item.name === '.upm' ||
          item.name === '.DS_Store'
        ) {
          continue;
        }

        const fullPath = path.join(currentPath, item.name);
        const relativeZipPath = zipPath ? `${zipPath}/${item.name}` : item.name;

        if (item.isDirectory()) {
          addFilesRecursively(fullPath, relativeZipPath);
        } else if (item.isFile()) {
          const content = fs.readFileSync(fullPath);
          zip.addFile(relativeZipPath, content);
        }
      }
    }

    addFilesRecursively(rootDir, '');

    const buffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="nova-trust-bank-source.zip"');
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ error: 'Failed to generate project ZIP', message: err?.message || 'Unknown error' });
  }
};

app.get('/api/download-project-zip', handleDownloadProjectZip);
app.options('/api/download-project-zip', handleDownloadProjectZip);
app.get('/download-zip', handleDownloadProjectZip);
app.options('/download-zip', handleDownloadProjectZip);

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err?.message || 'An unexpected error occurred.' });
});

// ==================== VITE MIDDLEWARE & SERVER LISTEN ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova Trust Bank server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
