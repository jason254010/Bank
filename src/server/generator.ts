import crypto from 'crypto';
import { Transaction } from '../types.js';

export function generateHistoricalTransactions(
  userId: string,
  customerName: string,
  accountNumber: string,
  accountCreatedAtStr: string,
  targetBalance: number
): Transaction[] {
  let accountCreatedAt = new Date(accountCreatedAtStr);
  const now = new Date();

  // Fallback if invalid date
  if (isNaN(accountCreatedAt.getTime())) {
    accountCreatedAt = new Date('2020-01-15T09:00:00.000Z');
  }

  // Ensure account creation date is not in the future
  if (accountCreatedAt >= now) {
    accountCreatedAt = new Date(now.getTime() - 30 * 24 * 3600 * 1000); // 30 days ago fallback
  }

  const creditSenders = [
    { name: 'Apex Global Logistics LLC', bank: 'JPMorgan Chase', desc: 'Bi-Weekly Direct Deposit Payroll' },
    { name: 'Horizon Healthcare Corp', bank: 'Wells Fargo', desc: 'Payroll Direct Deposit' },
    { name: 'Nova Technology Solutions', bank: 'Bank of America', desc: 'Contract Consulting Fee' },
    { name: 'Vanguard Investment Group', bank: 'CitiBank', desc: 'Quarterly Dividend Distribution' },
    { name: 'Barclays Global Settlement', bank: 'Barclays Bank', desc: 'International Wire Transfer Received' },
    { name: 'Fidelity Wealth Management', bank: 'HSBC Bank', desc: 'Capital Gains Yield Disbursement' },
    { name: 'David Sterling & Co', bank: 'Morgan Stanley', desc: 'Client Retainer Payment' },
    { name: 'Amazon Merchant Services', bank: 'JPMorgan Chase', desc: 'E-Commerce Return Refund' }
  ];

  const debitRecipients = [
    { name: 'Metropolitan Real Estate Mgmt', bank: 'Nova Trust Bank', desc: 'Monthly Lease Rent Payment' },
    { name: 'ConEdison Electric & Power', bank: 'CitiBank', desc: 'Utility Energy Bill Payment' },
    { name: 'Whole Foods Market', bank: 'JPMorgan Chase', desc: 'Grocery Superstore Purchase' },
    { name: 'Target Retail Store', bank: 'Wells Fargo', desc: 'Merchandise POS Purchase' },
    { name: 'Verizon Wireless Communications', bank: 'Bank of America', desc: 'Mobile Network & Data Services' },
    { name: 'Comcast Xfinity Broadband', bank: 'Wells Fargo', desc: 'High-Speed Internet Bill' },
    { name: 'Tesla Motors Charging', bank: 'Nova Trust Bank', desc: 'EV Charging Network' },
    { name: 'Starbucks Coffee Retail', bank: 'Bank of America', desc: 'Point of Sale Merchant Purchase' },
    { name: 'Delta Air Lines Reservation', bank: 'American Express', desc: 'Travel Airline Flight Booking' },
    { name: 'Apple Store Digital Services', bank: 'JPMorgan Chase', desc: 'Hardware & iCloud Subscription' },
    { name: 'The Capital Grille Hospitality', bank: 'CitiBank', desc: 'Dining & Hospitality Expense' },
    { name: 'JPMorgan Wire Outward', bank: 'JPMorgan Chase', desc: 'Outward Wire Transfer' }
  ];

  const rawTxs: Omit<Transaction, 'runningBalance'>[] = [];

  // 1. Opening initial deposit on account creation date
  const openingDepositAmount = Math.min(Math.max(1000, Math.round(targetBalance * 0.2)), 15000);
  const openingDate = new Date(accountCreatedAt.getTime() + 9 * 3600 * 1000); // 9:00 AM

  rawTxs.push({
    id: 'tx_' + crypto.randomBytes(6).toString('hex'),
    reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
    recipientUserId: userId,
    recipientName: customerName,
    recipientAccountNumber: accountNumber,
    bankName: 'Nova Trust Bank',
    amount: openingDepositAmount,
    fee: 0,
    description: 'Account Opening Initial Deposit',
    type: 'Initial Deposit',
    status: 'Completed',
    createdAt: openingDate.toISOString()
  });

  // Calculate total timeline
  const startTime = openingDate.getTime();
  const endTime = now.getTime();

  let currentDate = new Date(startTime + 7 * 24 * 3600 * 1000); // Start 1 week after opening

  while (currentDate.getTime() < endTime - 2 * 24 * 3600 * 1000) {
    const isCredit = Math.random() < 0.35; // 35% chance incoming credit, 65% debit

    if (isCredit) {
      const item = creditSenders[Math.floor(Math.random() * creditSenders.length)];
      const amt = Math.round((2200 + Math.random() * 4500) * 100) / 100;
      rawTxs.push({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        recipientUserId: userId,
        recipientName: customerName,
        recipientAccountNumber: accountNumber,
        senderName: item.name,
        bankName: item.bank,
        amount: amt,
        fee: 0,
        description: item.desc,
        type: 'Transfer Received',
        status: 'Completed',
        createdAt: new Date(currentDate.getTime() + Math.random() * 10 * 3600 * 1000).toISOString()
      });
    } else {
      const item = debitRecipients[Math.floor(Math.random() * debitRecipients.length)];
      const amt = Math.round((35 + Math.random() * 1400) * 100) / 100;
      rawTxs.push({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        senderUserId: userId,
        senderName: customerName,
        senderAccountNumber: accountNumber,
        recipientName: item.name,
        recipientAccountNumber: '998' + Math.floor(100000 + Math.random() * 900000).toString(),
        bankName: item.bank,
        amount: amt,
        fee: 0,
        description: item.desc,
        type: 'Transfer Sent',
        status: 'Completed',
        createdAt: new Date(currentDate.getTime() + Math.random() * 10 * 3600 * 1000).toISOString()
      });
    }

    // Step forward 4 - 14 days
    const stepDays = 4 + Math.floor(Math.random() * 11);
    currentDate = new Date(currentDate.getTime() + stepDays * 24 * 3600 * 1000);
  }

  // Sort raw transactions chronologically (oldest first)
  rawTxs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Compute unadjusted sum
  let sum = 0;
  for (const t of rawTxs) {
    if (t.type === 'Transfer Received' || t.type === 'Credit Adjustment' || t.type === 'Initial Deposit') {
      sum += t.amount;
    } else {
      sum -= t.amount;
    }
  }

  // Calculate discrepancy to hit exact target balance
  const diff = Math.round((targetBalance - sum) * 100) / 100;
  const recentDate = new Date(endTime - 1 * 24 * 3600 * 1000).toISOString();

  if (Math.abs(diff) > 0.009) {
    if (diff > 0) {
      rawTxs.push({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        recipientUserId: userId,
        recipientName: customerName,
        recipientAccountNumber: accountNumber,
        senderName: 'Nova Trust Investment Capital',
        bankName: 'Nova Trust Bank',
        amount: Math.round(diff * 100) / 100,
        fee: 0,
        description: 'Account Balance Portfolio Reconciliation Deposit',
        type: 'Transfer Received',
        status: 'Completed',
        createdAt: recentDate
      });
    } else {
      rawTxs.push({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        reference: 'NTB-TX-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        senderUserId: userId,
        senderName: customerName,
        senderAccountNumber: accountNumber,
        recipientName: 'Nova Asset Liquidity Reserve',
        recipientAccountNumber: '9981029384',
        bankName: 'Nova Trust Bank',
        amount: Math.round(Math.abs(diff) * 100) / 100,
        fee: 0,
        description: 'Portfolio Capital Allocation Transfer',
        type: 'Transfer Sent',
        status: 'Completed',
        createdAt: recentDate
      });
    }
  }

  // Final chronological sort
  rawTxs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Compute exact running balances sequentially from oldest to newest
  let running = 0;
  const processedTxs: Transaction[] = rawTxs.map(t => {
    const isCredit = t.type === 'Transfer Received' || t.type === 'Credit Adjustment' || t.type === 'Initial Deposit';
    if (isCredit) {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    return {
      ...t,
      runningBalance: Math.round(running * 100) / 100
    } as Transaction;
  });

  // Return sorted newest first (for API responses)
  return processedTxs.reverse();
}
