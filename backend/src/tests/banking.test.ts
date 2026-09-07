import { TransactionService } from '../modules/transactions/transaction.service.js';
import { AccountService } from '../modules/accounts/account.service.js';
import { initDatabase } from '../database/index.js';
import { NetworkService } from '../modules/network/network.service.js';

describe('Banking & Transaction Engine Suite', () => {
  beforeAll(async () => {
    await initDatabase();
    await NetworkService.initializeTopology();
  });

  it('should successfully execute valid fund transfer with atomic balance updates', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');
    const dstAccount = await AccountService.getAccountByNumber('ACC-100003');

    const initialSrcBalance = parseFloat(srcAccount.balance);
    const initialDstBalance = parseFloat(dstAccount.balance);
    const transferAmount = 5000.00;

    const result = await TransactionService.executeTransfer(
      'USR-CUST-001',
      'CUSTOMER',
      '127.0.0.1',
      {
        sourceAccountId: srcAccount.id,
        destinationAccountNumber: dstAccount.account_number,
        amount: transferAmount,
        description: 'Test Transfer',
        speedMultiplier: 5.0
      }
    );

    expect(result).toBeDefined();
    expect(result.transaction.state).toBe('COMPLETED');
    expect(parseFloat(result.transaction.amount)).toBe(transferAmount);

    // Verify account balances
    const updatedSrc = await AccountService.getAccountByNumber('ACC-100001');
    const updatedDst = await AccountService.getAccountByNumber('ACC-100003');

    expect(parseFloat(updatedSrc.balance)).toBe(initialSrcBalance - transferAmount);
    expect(parseFloat(updatedDst.balance)).toBe(initialDstBalance + transferAmount);
  });

  it('should reject transfer when amount exceeds available balance', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');
    const excessiveAmount = 99999999.00;

    await expect(
      TransactionService.executeTransfer(
        'USR-CUST-001',
        'CUSTOMER',
        '127.0.0.1',
        {
          sourceAccountId: srcAccount.id,
          destinationAccountNumber: 'ACC-100003',
          amount: excessiveAmount
        }
      )
    ).rejects.toThrow('INSUFFICIENT_FUNDS');
  });

  it('should reject self-transfers to the same account', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');

    await expect(
      TransactionService.executeTransfer(
        'USR-CUST-001',
        'CUSTOMER',
        '127.0.0.1',
        {
          sourceAccountId: srcAccount.id,
          destinationAccountNumber: srcAccount.account_number,
          amount: 100
        }
      )
    ).rejects.toThrow('CANNOT_TRANSFER_TO_SELF');
  });

  it('should prevent unauthorized users from transferring out of accounts they do not own', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');

    await expect(
      TransactionService.executeTransfer(
        'USR-CUST-999_IMPOSTOR',
        'CUSTOMER',
        '127.0.0.1',
        {
          sourceAccountId: srcAccount.id,
          destinationAccountNumber: 'ACC-100003',
          amount: 500
        }
      )
    ).rejects.toThrow('UNAUTHORIZED_ACCOUNT_ACCESS');
  });

  it('should enforce idempotency: duplicate requests with same idempotencyKey must not transfer twice', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');
    const dstAccount = await AccountService.getAccountByNumber('ACC-100003');

    const initialSrcBal = parseFloat(srcAccount.balance);
    const initialDstBal = parseFloat(dstAccount.balance);
    const transferAmount = 2500.00;
    const testIdempotencyKey = `IDEM-TEST-UNIQUE-${Date.now()}`;

    // Request 1: Initial execution
    const firstCall = await TransactionService.executeTransfer(
      'USR-CUST-001',
      'CUSTOMER',
      '127.0.0.1',
      {
        sourceAccountId: srcAccount.id,
        destinationAccountNumber: dstAccount.account_number,
        amount: transferAmount,
        idempotencyKey: testIdempotencyKey,
        speedMultiplier: 5.0
      }
    );

    expect(firstCall.transaction.id).toBeDefined();
    expect(firstCall.transaction.state).toBe('COMPLETED');

    // Intermediate balance check
    const intermediateSrc = await AccountService.getAccountByNumber('ACC-100001');
    expect(parseFloat(intermediateSrc.balance)).toBe(initialSrcBal - transferAmount);

    // Request 2: Duplicate call with exact same idempotencyKey
    const secondCall = await TransactionService.executeTransfer(
      'USR-CUST-001',
      'CUSTOMER',
      '127.0.0.1',
      {
        sourceAccountId: srcAccount.id,
        destinationAccountNumber: dstAccount.account_number,
        amount: transferAmount,
        idempotencyKey: testIdempotencyKey,
        speedMultiplier: 5.0
      }
    );

    // Request 3: Third call with exact same idempotencyKey
    const thirdCall = await TransactionService.executeTransfer(
      'USR-CUST-001',
      'CUSTOMER',
      '127.0.0.1',
      {
        sourceAccountId: srcAccount.id,
        destinationAccountNumber: dstAccount.account_number,
        amount: transferAmount,
        idempotencyKey: testIdempotencyKey,
        speedMultiplier: 5.0
      }
    );

    // Verify all return the exact same transaction ID
    expect(secondCall.transaction.id).toBe(firstCall.transaction.id);
    expect(thirdCall.transaction.id).toBe(firstCall.transaction.id);
    expect(secondCall.simResult.idempotentReplay).toBe(true);

    // Final balance check: only deducted ONCE
    const finalSrc = await AccountService.getAccountByNumber('ACC-100001');
    const finalDst = await AccountService.getAccountByNumber('ACC-100003');

    expect(parseFloat(finalSrc.balance)).toBe(initialSrcBal - transferAmount);
    expect(parseFloat(finalDst.balance)).toBe(initialDstBal + transferAmount);
  });

  it('should serialize concurrent requests with one idempotency key', async () => {
    const srcAccount = await AccountService.getAccountByNumber('ACC-100001');
    const dstAccount = await AccountService.getAccountByNumber('ACC-100003');
    const startingSourceBalance = Number(srcAccount.balance);
    const startingDestinationBalance = Number(dstAccount.balance);
    const idempotencyKey = `IDEM-CONCURRENT-${Date.now()}`;
    const request = {
      sourceAccountId: srcAccount.id,
      destinationAccountNumber: dstAccount.account_number,
      amount: 100,
      idempotencyKey,
      speedMultiplier: 5
    };

    const results = await Promise.all(
      Array.from({ length: 3 }, () => TransactionService.executeTransfer('USR-CUST-001', 'CUSTOMER', 'test', request))
    );

    expect(new Set(results.map(result => result.transaction.id)).size).toBe(1);
    const updatedSource = await AccountService.getAccountByNumber('ACC-100001');
    const updatedDestination = await AccountService.getAccountByNumber('ACC-100003');
    expect(Number(updatedSource.balance)).toBe(startingSourceBalance - 100);
    expect(Number(updatedDestination.balance)).toBe(startingDestinationBalance + 100);
  });
});
