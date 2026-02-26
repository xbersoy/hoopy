import { User } from '@user/entities/user.entity';
import { Company } from '@company/entities/company.entity';
import { Account } from '../src/account/entities/account.entity';
import { Contact } from '../src/contact/entities/contact.entity';
import * as bcrypt from 'bcrypt';

export const createMockUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const user = new User();
  user.id = '1';
  user.email = 'test@example.com';
  user.password = 'hashedPassword';
  user.refreshToken = 'mock-refresh-token';
  return Object.assign(user, overrides);
};

export const createMockCompany = async (overrides: Partial<Company> = {}): Promise<Company> => {
  const company = new Company();
  company.id = '1';
  company.name = 'Test Company';
  company.sector = 'Technology';
  
  if (!overrides.owner) {
    company.owner = await createMockUser();
  }
  
  return Object.assign(company, overrides);
};

export const createMockAccount = async (overrides: Partial<Account> = {}): Promise<Account> => {
  const account = new Account();
  account.id = '1';
  account.name = 'Test Account';
  account.type = 'Personal';
  
  if (!overrides.owner) {
    account.owner = await createMockUser();
  }
  
  return Object.assign(account, overrides);
};

export const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn().mockResolvedValue({ sub: '1', email: 'test@example.com' })
};

export const mockConfigService = {
  get: jest.fn()
};

export const mockUserRepository = {
  findOne: jest.fn().mockImplementation((options) => {
    if (options?.where?.id === '1') {
      const user = new User();
      user.id = '1';
      user.email = 'test@example.com';
      return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity),
  update: jest.fn().mockResolvedValue({ affected: 1 })
};

export const mockCompanyRepository = {
  findOne: jest.fn().mockImplementation((options) => {
    if (options?.where?.owner?.id === '1') {
      const company = new Company();
      company.id = '1';
      company.name = 'Test Company';
      company.sector = 'Technology';
      company.owner = new User();
      company.owner.id = '1';
      return Promise.resolve(company);
    }
    return Promise.resolve(null);
  }),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity)
};

export const mockAccountRepository = {
  findOne: jest.fn().mockImplementation((options) => {
    if (options?.where?.owner?.id === '1') {
      const account = new Account();
      account.id = '1';
      account.name = 'Test Account';
      account.type = 'Personal';
      account.owner = new User();
      account.owner.id = '1';
      return Promise.resolve(account);
    }
    return Promise.resolve(null);
  }),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity)
};

export const mockContactRepository = {
  findOne: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity)
};

export const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity))
    }
  })
}; 