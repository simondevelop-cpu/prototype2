import { addMonths, subMonths } from 'date-fns';

import type {
  Account,
  Category,
  Insight,
  InsightFeedbackValue,
  InsightModule,
  Transaction,
} from './types.js';

export const categorySeed: Category[] = [
  { id: 100, name: 'Home', displayName: 'Home', kind: 'EXPENSE' },
  { id: 101, name: 'Rent', displayName: 'Rent', kind: 'EXPENSE', parentId: 100 },
  { id: 102, name: 'Pets', displayName: 'Pets', kind: 'EXPENSE' },
  { id: 103, name: 'Daycare', displayName: 'Daycare', kind: 'EXPENSE' },
  { id: 104, name: 'Transport', displayName: 'Transport', kind: 'EXPENSE' },
  { id: 105, name: 'Car', displayName: 'Car', kind: 'EXPENSE', parentId: 104 },
  { id: 106, name: 'Bank and other fees', displayName: 'Bank & fees', kind: 'EXPENSE' },
  { id: 107, name: 'Other bills', displayName: 'Other bills', kind: 'EXPENSE' },
  { id: 108, name: 'Utilities (Home insurance)', displayName: 'Home insurance', kind: 'EXPENSE', parentId: 100 },
  { id: 109, name: 'Utilities (Gas)', displayName: 'Gas utility', kind: 'EXPENSE', parentId: 100 },
  { id: 110, name: 'Utilities (Car insurance)', displayName: 'Car insurance', kind: 'EXPENSE', parentId: 104 },
  { id: 111, name: 'Utilities (Electric)', displayName: 'Electricity', kind: 'EXPENSE', parentId: 100 },
  { id: 112, name: 'Utilities (Water)', displayName: 'Water', kind: 'EXPENSE', parentId: 100 },
  { id: 113, name: 'Utilities (Utility)', displayName: 'Utilities', kind: 'EXPENSE', parentId: 100 },
  { id: 114, name: 'Utilities (Cell phones)', displayName: 'Cell phones', kind: 'EXPENSE', parentId: 107 },
  { id: 115, name: 'Utilities (Internet)', displayName: 'Internet', kind: 'EXPENSE', parentId: 107 },
  { id: 116, name: 'Groceries', displayName: 'Groceries', kind: 'EXPENSE' },
  { id: 117, name: 'Eating Out', displayName: 'Eating out', kind: 'EXPENSE' },
  { id: 118, name: 'Coffee', displayName: 'Coffee', kind: 'EXPENSE' },
  { id: 119, name: 'Health', displayName: 'Health', kind: 'EXPENSE' },
  { id: 120, name: 'Travel', displayName: 'Travel', kind: 'EXPENSE' },
  { id: 121, name: 'Shopping', displayName: 'Shopping', kind: 'EXPENSE' },
  { id: 122, name: 'Clothes', displayName: 'Clothes', kind: 'EXPENSE', parentId: 121 },
  { id: 123, name: 'Beauty', displayName: 'Beauty', kind: 'EXPENSE' },
  { id: 124, name: 'Education', displayName: 'Education', kind: 'EXPENSE' },
  { id: 125, name: 'Work', displayName: 'Work', kind: 'EXPENSE' },
  { id: 126, name: 'Subscriptions', displayName: 'Subscriptions', kind: 'EXPENSE' },
  { id: 127, name: 'Family & Personal', displayName: 'Family & personal', kind: 'EXPENSE' },
  { id: 128, name: 'Sport & Hobbies', displayName: 'Sport & hobbies', kind: 'EXPENSE' },
  { id: 129, name: 'Entertainment', displayName: 'Entertainment', kind: 'EXPENSE' },
  { id: 130, name: 'Gym membership', displayName: 'Gym membership', kind: 'EXPENSE' },
  { id: 131, name: 'Salary', displayName: 'Salary', kind: 'INCOME' },
  { id: 132, name: 'Business', displayName: 'Business', kind: 'INCOME' },
  { id: 133, name: 'Loan', displayName: 'Loan', kind: 'INCOME' },
  { id: 134, name: 'Gifts', displayName: 'Gifts', kind: 'INCOME' },
  { id: 135, name: 'Extra income', displayName: 'Extra income', kind: 'INCOME' },
  { id: 136, name: 'Other income', displayName: 'Other income', kind: 'INCOME' },
  { id: 137, name: 'Tax', displayName: 'Tax', kind: 'OTHER' },
  { id: 138, name: 'Transfers', displayName: 'Transfers', kind: 'TRANSFER' },
];

export const demoAccountSeed: Account = {
  id: 'demo-chequing',
  userId: 'demo-user',
  name: 'Everyday Chequing',
  institution: 'Canadian Insights Demo Bank',
  type: 'chequing',
  currency: 'CAD',
};

const now = new Date();

const randomBetween = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

const buildRecurring = (base: number, months: number) =>
  Array.from({ length: months }).map((_, idx) => base + randomBetween(-5, 12) + idx * randomBetween(-1, 2));

const subscriptionMerchants = [
  { name: 'Netflix', categoryId: 126, base: 16.49 },
  { name: 'Spotify', categoryId: 126, base: 14.99 },
  { name: 'Telus Mobility', categoryId: 114, base: 85.0 },
  { name: 'Hydro-Québec', categoryId: 111, base: 98.5 },
];

const groceryMerchants = ['Metro', 'IGA', 'Loblaws', 'Costco'];
const diningMerchants = ['Tim Hortons', 'Starbucks', 'A&W', 'Harvey\'s', 'The Keg'];

export const demoTransactionsSeed: Transaction[] = [];

const addTransaction = (transaction: Omit<Transaction, 'id'> & { id?: string }) => {
  demoTransactionsSeed.push({
    ...transaction,
    id: transaction.id ?? `${transaction.accountId}-${transaction.date.getTime()}-${transaction.description.replace(/\s+/g, '-')}`,
  });
};

subscriptionMerchants.forEach((merchant) => {
  const amounts = buildRecurring(merchant.base, 8);
  amounts.forEach((amount, idx) => {
    const date = subMonths(now, idx);
    addTransaction({
      id: `sub-${merchant.name}-${idx}`,
      userId: 'demo-user',
      accountId: demoAccountSeed.id,
      merchantId: merchant.name.toLowerCase().replace(/[^a-z]/g, '-'),
      categoryId: merchant.categoryId,
      normalizedName: merchant.name.toLowerCase(),
      description: merchant.name,
      amount: amount * -1,
      currency: 'CAD',
      transactionType: 'EXPENSE',
      cashflowSign: -1,
      date,
      isTransfer: false,
      isRecurring: true,
    });
  });
});

Array.from({ length: 24 }).forEach((_, idx) => {
  const date = addMonths(subMonths(now, 6), idx % 6);
  const merchant = groceryMerchants[idx % groceryMerchants.length];
  const amount = randomBetween(65, 130) * -1;
  addTransaction({
    userId: 'demo-user',
    accountId: demoAccountSeed.id,
    merchantId: merchant.toLowerCase(),
    categoryId: 116,
    normalizedName: merchant.toLowerCase(),
    description: merchant,
    amount,
    currency: 'CAD',
    transactionType: 'EXPENSE',
    cashflowSign: -1,
    date,
    isTransfer: false,
    isRecurring: false,
  });
});

Array.from({ length: 16 }).forEach((_, idx) => {
  const date = addMonths(subMonths(now, 4), idx % 4);
  const merchant = diningMerchants[idx % diningMerchants.length];
  const amount = randomBetween(8, 45) * -1;
  addTransaction({
    userId: 'demo-user',
    accountId: demoAccountSeed.id,
    merchantId: merchant.toLowerCase(),
    categoryId: 117,
    normalizedName: merchant.toLowerCase(),
    description: merchant,
    amount,
    currency: 'CAD',
    transactionType: 'EXPENSE',
    cashflowSign: -1,
    date,
    isTransfer: false,
    isRecurring: false,
  });
});

Array.from({ length: 6 }).forEach((_, idx) => {
  const date = subMonths(now, idx);
  addTransaction({
    userId: 'demo-user',
    accountId: demoAccountSeed.id,
    merchantId: 'employer-inc',
    categoryId: 131,
    normalizedName: 'employer inc',
    description: 'Employer Inc. Payroll',
    amount: 3985.5,
    currency: 'CAD',
    transactionType: 'INCOME',
    cashflowSign: 1,
    date,
    isTransfer: false,
    isRecurring: true,
  });
});

addTransaction({
  userId: 'demo-user',
  accountId: demoAccountSeed.id,
  merchantId: 'tfsa-transfer',
  categoryId: 138,
  normalizedName: 'transfer tfsa',
  description: 'TFSA Transfer',
  amount: -500,
  currency: 'CAD',
  transactionType: 'TRANSFER',
  cashflowSign: 0,
  date: subMonths(now, 1),
  isTransfer: true,
  isRecurring: false,
});

export const demoInsightsSeed: InsightModule[] = [
  {
    id: 'subscriptions',
    title: 'Subscriptions & Bills',
    description: 'Spot recurring charges and recent increases.',
    insights: [
      {
        id: 'insight-netflix-hike',
        userId: 'demo-user',
        type: 'BILL_HIKE',
        title: 'Netflix increased by 9% vs 3-mo avg',
        body: 'We noticed your Netflix membership climbed from $15.10 to $16.45. Consider downgrading or sharing a family plan.',
        status: 'ACTIVE',
        data: { merchant: 'Netflix', categoryId: 126, change: 0.09 },
      },
      {
        id: 'insight-spotify',
        userId: 'demo-user',
        type: 'SUBSCRIPTION',
        title: 'Spotify charged $14.99 on the 15th',
        body: 'Spotify Premium posts monthly around the 15th. Keep or cancel from the Spotify account centre.',
        status: 'ACTIVE',
        data: { merchant: 'Spotify', cadence: 'monthly' },
      },
    ],
  },
  {
    id: 'fees',
    title: 'Fees & Outliers',
    description: 'Surface unexpected bank fees or duplicates.',
    insights: [
      {
        id: 'insight-bank-fee',
        userId: 'demo-user',
        type: 'FEE_ALERT',
        title: 'Your bank charged a $12.00 account fee',
        body: 'Canadian Insights Demo Bank collected $12.00 in fees last month. You could save by maintaining the minimum balance.',
        status: 'ACTIVE',
        data: { amount: 12, merchant: 'Canadian Insights Demo Bank' },
      },
    ],
  },
  {
    id: 'peer',
    title: 'Peer comparisons',
    description: 'Tasteful comparisons versus similar Canadians.',
    insights: [
      {
        id: 'insight-peer-groceries',
        userId: 'demo-user',
        type: 'PEER_COMPARISON',
        title: 'Groceries trending 8% above similar households',
        body: 'Households in Québec with 2 people spend about $540/mo on groceries. You averaged $584.',
        status: 'ACTIVE',
        data: { categoryId: 116, cohort: 'QC households (2 people)', delta: 0.08 },
      },
    ],
  },
];

export const insightFeedbackOptions: { value: InsightFeedbackValue; label: string }[] = [
  { value: 'USEFUL', label: 'Insightful' },
  { value: 'NOT_RELEVANT', label: 'Not relevant' },
  { value: 'TOO_OBVIOUS', label: 'Too obvious' },
  { value: 'INACCURATE', label: 'Inaccurate' },
  { value: 'OTHER', label: 'Other' },
];
