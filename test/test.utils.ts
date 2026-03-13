import { User } from '@user/entities/user.entity';
import { Company } from '@company/entities/company.entity';
import { Account } from '../src/account/entities/account.entity';
import { Contact, ContactType } from '../src/contact/entities/contact.entity';
import { Employee } from '../src/employee/entities/employee.entity';
import { EmployeeEducation } from '../src/employee/entities/employee-education.entity';
import { Attachment } from '../src/attachments/attachment.entity';

export const createMockUser = async (
  overrides: Partial<User> = {},
): Promise<User> => {
  const user = new User();
  user.id = '1';
  user.email = 'test@example.com';
  user.password = 'hashedPassword';
  user.refreshToken = 'mock-refresh-token';
  return Object.assign(user, overrides);
};

export const createMockCompany = async (
  overrides: Partial<Company> = {},
): Promise<Company> => {
  const company = new Company();
  company.id = '1';
  company.name = 'Test Company';
  company.sector = 'Technology';

  if (!overrides.owner) {
    company.owner = await createMockUser();
  }

  if (!overrides.account) {
    company.account = await createMockAccount();
  }

  return Object.assign(company, overrides);
};

export const createMockAccount = async (
  overrides: Partial<Account> = {},
): Promise<Account> => {
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
  verifyAsync: jest
    .fn()
    .mockResolvedValue({ sub: '1', email: 'test@example.com' }),
};

export const mockConfigService = {
  get: jest.fn(),
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
  update: jest.fn().mockResolvedValue({ affected: 1 }),
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
      company.account = new Account();
      company.account.id = '1';
      company.account.name = 'Test Account';
      company.account.type = 'Personal';
      return Promise.resolve(company);
    }
    return Promise.resolve(null);
  }),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity),
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
  create: jest.fn().mockImplementation((entity) => entity),
};

export const mockContactRepository = {
  findOne: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  create: jest.fn().mockImplementation((entity) => entity),
};

export const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    },
  }),
};

// ── New Entity Factories ────────────────────────────────────

export const createMockEmployee = (
  overrides: Partial<Employee> = {},
): Employee => {
  const employee = new Employee();
  employee.id = 'emp-1';
  employee.firstName = 'John';
  employee.lastName = 'Doe';
  employee.email = 'john@example.com';
  employee.phone = '+1234567890';
  employee.position = 'Software Engineer';
  employee.department = 'Engineering';
  employee.educations = [];
  employee.user = undefined;
  employee.company = undefined;
  return Object.assign(employee, overrides);
};

export const createMockEducation = (
  overrides: Partial<EmployeeEducation> = {},
): EmployeeEducation => {
  const education = new EmployeeEducation();
  education.id = 'edu-1';
  education.institution = 'MIT';
  education.degree = 'Bachelor of Science';
  education.fieldOfStudy = 'Computer Science';
  education.employee_id = 'emp-1';
  return Object.assign(education, overrides);
};

export const createMockContact = (
  overrides: Partial<Contact> = {},
): Contact => {
  const contact = new Contact();
  contact.id = 'contact-1';
  contact.type = ContactType.EMAIL;
  contact.value = 'test@example.com';
  contact.isPrimary = true;
  return Object.assign(contact, overrides);
};

export const createMockAttachment = (
  overrides: Partial<Attachment> = {},
): Attachment => {
  const attachment = new Attachment();
  attachment.id = 'att-1';
  attachment.url =
    'https://bucket.supabase.co/storage/v1/object/public/hoopy/uploads/test.pdf';
  attachment.fileName = 'test.pdf';
  attachment.mimeType = 'application/pdf';
  attachment.size = 1024;
  attachment.relatedType = 'employee';
  attachment.relatedId = 'emp-1';
  return Object.assign(attachment, overrides);
};

export const createMockFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('test file content'),
  stream: null as any,
  destination: '',
  filename: 'test.pdf',
  path: '',
  ...overrides,
});

// ── Repository Mock Factories (fresh mocks per test) ────────

export const createMockContactRepo = () => ({
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  findPrimary: jest.fn().mockResolvedValue(null),
  findByIdForUser: jest.fn().mockResolvedValue(null),
  unsetPrimaryForType: jest.fn().mockResolvedValue(undefined),
  deleteForUser: jest.fn().mockResolvedValue(1),
});

export const createMockEmployeeRepo = () => ({
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  findAllWithEducations: jest.fn().mockResolvedValue([]),
  findOneWithEducations: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
});

export const createMockEducationRepo = () => ({
  create: jest.fn().mockImplementation((data) => data),
  saveAll: jest
    .fn()
    .mockImplementation((entities) => Promise.resolve(entities)),
  deleteByEmployeeId: jest.fn().mockResolvedValue(undefined),
});

export const createMockAttachmentRepo = () => ({
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  findById: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  findByRelated: jest.fn().mockResolvedValue([]),
});

export const createMockStorageService = () => ({
  upload: jest.fn().mockResolvedValue({
    url: 'https://test-storage.example.com/uploads/test.pdf',
  }),
  delete: jest.fn().mockResolvedValue(undefined),
  getPublicUrl: jest
    .fn()
    .mockResolvedValue('https://test-storage.example.com/uploads/test.pdf'),
});
