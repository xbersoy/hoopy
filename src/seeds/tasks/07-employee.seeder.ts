import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { EmployeeService } from '../../employee/employee.service';
import { OrgUnitService } from '../../org-structure/services/org-unit.service';
import { EmploymentType } from '../../employee/enums/employment-type.enum';
import { Relationship } from '../../employee/enums/relationship.enum';
import { Gender } from '../../employee/enums/gender.enum';
import { NationalIdType } from '../../employee/enums/national-id-type.enum';
import { LicenseCertificationType } from '../../employee/enums/license-certification-type.enum';

// ── Employee seed data: { team code → employees[] } ──────────────
// 18 teams, ~6 employees each = 108 employees total
const EMPLOYEES_BY_TEAM: Record<
  string,
  Array<{
    firstName: string;
    lastName: string;
    position: string;
    hireDate: string;
    employmentType?: EmploymentType;
  }>
> = {
  // ── Engineering → Frontend ────────────────────────────────────
  FE: [
    {
      firstName: 'Aylin',
      lastName: 'Kaya',
      position: 'Senior Frontend Engineer',
      hireDate: '2021-03-15',
    },
    {
      firstName: 'Marcus',
      lastName: 'Chen',
      position: 'Frontend Engineer',
      hireDate: '2022-06-01',
    },
    {
      firstName: 'Sofia',
      lastName: 'Rivera',
      position: 'Frontend Engineer',
      hireDate: '2022-09-12',
    },
    {
      firstName: 'Liam',
      lastName: "O'Brien",
      position: 'Junior Frontend Engineer',
      hireDate: '2023-01-10',
    },
    {
      firstName: 'Yuki',
      lastName: 'Tanaka',
      position: 'Frontend Engineer',
      hireDate: '2023-04-22',
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      position: 'UI Engineer',
      hireDate: '2023-07-03',
    },
  ],
  // ── Engineering → Backend ─────────────────────────────────────
  BE: [
    {
      firstName: 'Emre',
      lastName: 'Demir',
      position: 'Senior Backend Engineer',
      hireDate: '2020-11-01',
    },
    {
      firstName: 'Olivia',
      lastName: 'Johnson',
      position: 'Backend Engineer',
      hireDate: '2021-05-15',
    },
    {
      firstName: 'Kenji',
      lastName: 'Watanabe',
      position: 'Backend Engineer',
      hireDate: '2022-02-28',
    },
    {
      firstName: 'Anja',
      lastName: 'Mueller',
      position: 'Backend Engineer',
      hireDate: '2022-08-14',
    },
    {
      firstName: 'Diego',
      lastName: 'Martinez',
      position: 'Junior Backend Engineer',
      hireDate: '2023-03-20',
    },
    {
      firstName: 'Fatima',
      lastName: 'Al-Hassan',
      position: 'Backend Engineer',
      hireDate: '2023-06-05',
    },
    {
      firstName: 'Noah',
      lastName: 'Williams',
      position: 'Senior Backend Engineer',
      hireDate: '2021-01-10',
    },
  ],
  // ── Engineering → Infrastructure ──────────────────────────────
  INFRA: [
    {
      firstName: 'Viktor',
      lastName: 'Petrov',
      position: 'Senior DevOps Engineer',
      hireDate: '2020-09-01',
    },
    {
      firstName: 'Mei',
      lastName: 'Zhang',
      position: 'Cloud Engineer',
      hireDate: '2021-07-15',
    },
    {
      firstName: 'Tobias',
      lastName: 'Lindgren',
      position: 'Site Reliability Engineer',
      hireDate: '2022-01-20',
    },
    {
      firstName: 'Amara',
      lastName: 'Okafor',
      position: 'DevOps Engineer',
      hireDate: '2022-11-08',
    },
    {
      firstName: 'Ivan',
      lastName: 'Horvat',
      position: 'Platform Engineer',
      hireDate: '2023-02-14',
    },
    {
      firstName: 'Chloe',
      lastName: 'Dupont',
      position: 'Infrastructure Engineer',
      hireDate: '2023-05-30',
    },
  ],
  // ── Engineering → Mobile ──────────────────────────────────────
  MOB: [
    {
      firstName: 'Ravi',
      lastName: 'Patel',
      position: 'Senior Mobile Engineer',
      hireDate: '2021-02-01',
    },
    {
      firstName: 'Elena',
      lastName: 'Voronova',
      position: 'iOS Engineer',
      hireDate: '2021-10-15',
    },
    {
      firstName: 'Juan',
      lastName: 'Garcia',
      position: 'Android Engineer',
      hireDate: '2022-04-20',
    },
    {
      firstName: 'Hana',
      lastName: 'Kim',
      position: 'Mobile Engineer',
      hireDate: '2022-12-01',
    },
    {
      firstName: 'Oscar',
      lastName: 'Eriksson',
      position: 'Junior Mobile Engineer',
      hireDate: '2023-06-15',
    },
    {
      firstName: 'Zara',
      lastName: 'Mohammed',
      position: 'Flutter Engineer',
      hireDate: '2023-08-01',
    },
  ],
  // ── Engineering → QA ──────────────────────────────────────────
  QA: [
    {
      firstName: 'Tomoko',
      lastName: 'Sato',
      position: 'Senior QA Engineer',
      hireDate: '2020-06-01',
    },
    {
      firstName: 'Andrei',
      lastName: 'Popescu',
      position: 'QA Engineer',
      hireDate: '2021-09-15',
    },
    {
      firstName: 'Leila',
      lastName: 'Ahmadi',
      position: 'QA Automation Engineer',
      hireDate: '2022-05-10',
    },
    {
      firstName: 'Patrick',
      lastName: "O'Connor",
      position: 'QA Engineer',
      hireDate: '2023-01-08',
    },
    {
      firstName: 'Ingrid',
      lastName: 'Johansson',
      position: 'QA Analyst',
      hireDate: '2023-04-25',
    },
  ],
  // ── Product → Design ──────────────────────────────────────────
  DSG: [
    {
      firstName: 'Mila',
      lastName: 'Novak',
      position: 'Senior Product Designer',
      hireDate: '2020-08-15',
    },
    {
      firstName: 'Tariq',
      lastName: 'Benali',
      position: 'UI/UX Designer',
      hireDate: '2021-04-01',
    },
    {
      firstName: 'Emma',
      lastName: 'Larsson',
      position: 'Visual Designer',
      hireDate: '2022-02-15',
    },
    {
      firstName: 'Lucas',
      lastName: 'Ferreira',
      position: 'Product Designer',
      hireDate: '2022-10-20',
    },
    {
      firstName: 'Suki',
      lastName: 'Nakamura',
      position: 'Interaction Designer',
      hireDate: '2023-03-12',
    },
    {
      firstName: 'Nadia',
      lastName: 'Kovalenko',
      position: 'Junior Designer',
      hireDate: '2023-09-01',
    },
  ],
  // ── Product → Product Management ──────────────────────────────
  PM: [
    {
      firstName: 'Aisha',
      lastName: 'Ibrahim',
      position: 'Senior Product Manager',
      hireDate: '2020-04-01',
    },
    {
      firstName: 'Thomas',
      lastName: 'Hartmann',
      position: 'Product Manager',
      hireDate: '2021-06-15',
    },
    {
      firstName: 'Clara',
      lastName: 'Rossi',
      position: 'Product Manager',
      hireDate: '2022-03-10',
    },
    {
      firstName: 'Daniel',
      lastName: 'Park',
      position: 'Associate Product Manager',
      hireDate: '2023-01-20',
    },
    {
      firstName: 'Vera',
      lastName: 'Sokolova',
      position: 'Technical Product Manager',
      hireDate: '2023-05-15',
    },
  ],
  // ── Product → UX Research ─────────────────────────────────────
  UXR: [
    {
      firstName: 'Camille',
      lastName: 'Bernard',
      position: 'Senior UX Researcher',
      hireDate: '2021-01-15',
    },
    {
      firstName: 'Arjun',
      lastName: 'Nair',
      position: 'UX Researcher',
      hireDate: '2022-06-01',
    },
    {
      firstName: 'Linnea',
      lastName: 'Andersen',
      position: 'UX Researcher',
      hireDate: '2023-02-28',
    },
    {
      firstName: 'George',
      lastName: 'Papadopoulos',
      position: 'Junior UX Researcher',
      hireDate: '2023-08-15',
    },
  ],
  // ── Sales & Marketing → Sales ─────────────────────────────────
  SLS: [
    {
      firstName: 'James',
      lastName: 'Taylor',
      position: 'Senior Account Executive',
      hireDate: '2020-03-01',
    },
    {
      firstName: 'Elif',
      lastName: 'Yilmaz',
      position: 'Account Executive',
      hireDate: '2021-05-20',
    },
    {
      firstName: 'Ryan',
      lastName: 'Murphy',
      position: 'Account Executive',
      hireDate: '2021-11-10',
    },
    {
      firstName: 'Nina',
      lastName: 'Kovac',
      position: 'Sales Development Rep',
      hireDate: '2022-07-15',
    },
    {
      firstName: 'William',
      lastName: 'Brown',
      position: 'Sales Development Rep',
      hireDate: '2023-02-01',
    },
    {
      firstName: 'Selma',
      lastName: 'Hansson',
      position: 'Enterprise Sales Rep',
      hireDate: '2023-06-20',
    },
  ],
  // ── Sales & Marketing → Marketing ─────────────────────────────
  MKT: [
    {
      firstName: 'Isabelle',
      lastName: 'Moreau',
      position: 'Senior Marketing Manager',
      hireDate: '2020-05-01',
    },
    {
      firstName: 'Mateo',
      lastName: 'Silva',
      position: 'Content Strategist',
      hireDate: '2021-08-15',
    },
    {
      firstName: 'Rachel',
      lastName: 'Green',
      position: 'Growth Marketing Specialist',
      hireDate: '2022-03-20',
    },
    {
      firstName: 'Kofi',
      lastName: 'Asante',
      position: 'Social Media Manager',
      hireDate: '2022-09-01',
    },
    {
      firstName: 'Petra',
      lastName: 'Svoboda',
      position: 'Marketing Analyst',
      hireDate: '2023-04-10',
    },
    {
      firstName: 'Alex',
      lastName: 'Thompson',
      position: 'Marketing Coordinator',
      hireDate: '2023-07-22',
    },
  ],
  // ── Sales & Marketing → Business Development ──────────────────
  BD: [
    {
      firstName: 'Hassan',
      lastName: 'El-Amin',
      position: 'Senior BD Manager',
      hireDate: '2020-07-01',
    },
    {
      firstName: 'Sveta',
      lastName: 'Ivanova',
      position: 'BD Representative',
      hireDate: '2021-12-01',
    },
    {
      firstName: 'Leo',
      lastName: 'Fischer',
      position: 'BD Representative',
      hireDate: '2022-06-15',
    },
    {
      firstName: 'Grace',
      lastName: 'Oduya',
      position: 'Partnership Manager',
      hireDate: '2023-01-15',
    },
  ],
  // ── Human Resources → Recruiting ──────────────────────────────
  REC: [
    {
      firstName: 'Carmen',
      lastName: 'Delgado',
      position: 'Senior Technical Recruiter',
      hireDate: '2020-10-01',
    },
    {
      firstName: 'Erik',
      lastName: 'Nilsson',
      position: 'Technical Recruiter',
      hireDate: '2021-06-15',
    },
    {
      firstName: 'Yara',
      lastName: 'Haddad',
      position: 'Recruiting Coordinator',
      hireDate: '2022-08-20',
    },
    {
      firstName: 'Samuel',
      lastName: 'Mensah',
      position: 'Talent Sourcer',
      hireDate: '2023-03-01',
    },
  ],
  // ── Human Resources → People Operations ───────────────────────
  POPS: [
    {
      firstName: 'Lena',
      lastName: 'Bergstrom',
      position: 'Senior People Ops Manager',
      hireDate: '2020-02-01',
    },
    {
      firstName: 'Marco',
      lastName: 'Bianchi',
      position: 'People Ops Specialist',
      hireDate: '2021-09-15',
    },
    {
      firstName: 'Adèle',
      lastName: 'Fontaine',
      position: 'People Ops Specialist',
      hireDate: '2022-05-10',
    },
    {
      firstName: 'Tomas',
      lastName: 'Novotny',
      position: 'HR Generalist',
      hireDate: '2023-01-25',
    },
  ],
  // ── Finance & Legal → Accounting ──────────────────────────────
  ACC: [
    {
      firstName: 'Margaret',
      lastName: 'Wilson',
      position: 'Senior Accountant',
      hireDate: '2020-01-15',
    },
    {
      firstName: 'Hiroshi',
      lastName: 'Yamamoto',
      position: 'Staff Accountant',
      hireDate: '2021-04-01',
    },
    {
      firstName: 'Olga',
      lastName: 'Petrenko',
      position: 'Accounts Payable Specialist',
      hireDate: '2022-02-15',
    },
    {
      firstName: 'Felix',
      lastName: 'Bauer',
      position: 'Financial Analyst',
      hireDate: '2022-11-01',
    },
    {
      firstName: 'Amina',
      lastName: 'Diallo',
      position: 'Junior Accountant',
      hireDate: '2023-05-01',
    },
  ],
  // ── Finance & Legal → Legal ───────────────────────────────────
  LGL: [
    {
      firstName: 'Victoria',
      lastName: 'Stenberg',
      position: 'Senior Legal Counsel',
      hireDate: '2020-06-01',
    },
    {
      firstName: 'Roberto',
      lastName: 'Conti',
      position: 'Legal Counsel',
      hireDate: '2021-11-15',
    },
    {
      firstName: 'Sophie',
      lastName: 'Lambert',
      position: 'Compliance Officer',
      hireDate: '2022-07-20',
    },
    {
      firstName: 'David',
      lastName: 'Reis',
      position: 'Paralegal',
      hireDate: '2023-02-10',
    },
  ],
  // ── Operations → IT Support ───────────────────────────────────
  ITS: [
    {
      firstName: 'Pavel',
      lastName: 'Kowalski',
      position: 'Senior IT Support Engineer',
      hireDate: '2020-04-15',
    },
    {
      firstName: 'Binta',
      lastName: 'Traore',
      position: 'IT Support Specialist',
      hireDate: '2021-08-01',
    },
    {
      firstName: 'Henry',
      lastName: 'Clarke',
      position: 'IT Support Specialist',
      hireDate: '2022-04-10',
    },
    {
      firstName: 'Mei-Lin',
      lastName: 'Wu',
      position: 'Helpdesk Analyst',
      hireDate: '2023-01-05',
    },
    {
      firstName: 'Niko',
      lastName: 'Virtanen',
      position: 'Junior IT Support',
      hireDate: '2023-06-01',
      employmentType: EmploymentType.PART_TIME,
    },
  ],
  // ── Operations → Facilities ───────────────────────────────────
  FAC: [
    {
      firstName: 'Rosa',
      lastName: 'Hernandez',
      position: 'Facilities Manager',
      hireDate: '2019-11-01',
    },
    {
      firstName: 'Jan',
      lastName: 'Kowalczyk',
      position: 'Facilities Coordinator',
      hireDate: '2021-05-15',
    },
    {
      firstName: 'Abigail',
      lastName: 'Stewart',
      position: 'Office Administrator',
      hireDate: '2022-09-20',
    },
  ],
  // ── Operations → Security ─────────────────────────────────────
  SEC: [
    {
      firstName: 'Omar',
      lastName: 'Farooq',
      position: 'Security Operations Lead',
      hireDate: '2020-05-01',
    },
    {
      firstName: 'Katarina',
      lastName: 'Jovanovic',
      position: 'Security Analyst',
      hireDate: '2021-10-15',
    },
    {
      firstName: 'Nathan',
      lastName: 'Brooks',
      position: 'Security Engineer',
      hireDate: '2022-06-01',
    },
    {
      firstName: 'Simone',
      lastName: 'De Luca',
      position: 'Security Analyst',
      hireDate: '2023-04-15',
    },
  ],
};

// ── Related entities: keyed by "firstName.lastName" ──────────────
// We attach rich data to ~30 employees to cover all entity types
const RELATED_DATA: Record<
  string,
  {
    emergencyContacts?: any[];
    dependents?: any[];
    workExperiences?: any[];
    educations?: any[];
    licensesCertifications?: any[];
    nationalIds?: any[];
  }
> = {
  'Aylin.Kaya': {
    emergencyContacts: [
      {
        fullName: 'Mehmet Kaya',
        relationship: Relationship.PARENT,
        phone: '+905551234567',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Elif Kaya',
        relationship: Relationship.CHILD,
        dateOfBirth: '2019-05-10',
        gender: Gender.FEMALE,
      },
    ],
    educations: [
      {
        institution: 'Bogazici University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Engineering',
        startDate: '2013-09-01',
        endDate: '2017-06-15',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: '12345678901',
        country: 'TR',
      },
    ],
  },
  'Emre.Demir': {
    emergencyContacts: [
      {
        fullName: 'Zeynep Demir',
        relationship: Relationship.SPOUSE,
        phone: '+905559876543',
        isPrimary: true,
      },
      {
        fullName: 'Ali Demir',
        relationship: Relationship.PARENT,
        phone: '+905551112233',
      },
    ],
    dependents: [
      {
        fullName: 'Zeynep Demir',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1992-03-22',
        gender: Gender.FEMALE,
      },
      {
        fullName: 'Can Demir',
        relationship: Relationship.CHILD,
        dateOfBirth: '2021-08-14',
        gender: Gender.MALE,
      },
    ],
    workExperiences: [
      {
        companyName: 'TechCorp',
        jobTitle: 'Backend Developer',
        startDate: '2017-06-01',
        endDate: '2020-10-30',
        location: 'Ankara',
        reasonForLeaving: 'Career growth',
      },
    ],
    educations: [
      {
        institution: 'METU',
        degree: 'Master of Science',
        fieldOfStudy: 'Software Engineering',
        startDate: '2015-09-01',
        endDate: '2017-06-01',
      },
    ],
    licensesCertifications: [
      {
        name: 'AWS Solutions Architect',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2022-03-15',
        expirationDate: '2025-03-15',
        credentialId: 'AWS-SA-PRO-12345',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: '98765432101',
        country: 'TR',
      },
      {
        idType: NationalIdType.PASSPORT,
        idNumber: 'U12345678',
        country: 'TR',
        issueDate: '2021-01-10',
        expirationDate: '2031-01-10',
      },
    ],
  },
  'Viktor.Petrov': {
    emergencyContacts: [
      {
        fullName: 'Natasha Petrova',
        relationship: Relationship.SPOUSE,
        phone: '+359888123456',
        isPrimary: true,
      },
    ],
    workExperiences: [
      {
        companyName: 'CloudBase GmbH',
        jobTitle: 'Systems Administrator',
        startDate: '2016-03-01',
        endDate: '2020-08-31',
        location: 'Berlin',
      },
    ],
    licensesCertifications: [
      {
        name: 'Certified Kubernetes Administrator',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'CNCF',
        issueDate: '2021-11-01',
        expirationDate: '2024-11-01',
        credentialId: 'CKA-4567',
      },
      {
        name: 'Terraform Associate',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'HashiCorp',
        issueDate: '2022-05-20',
      },
    ],
  },
  'Mila.Novak': {
    emergencyContacts: [
      {
        fullName: 'Stefan Novak',
        relationship: Relationship.SIBLING,
        phone: '+385911234567',
        isPrimary: true,
      },
    ],
    educations: [
      {
        institution: 'Royal College of Art',
        degree: 'Master of Arts',
        fieldOfStudy: 'Design',
        startDate: '2016-09-01',
        endDate: '2018-06-30',
      },
    ],
    licensesCertifications: [
      {
        name: 'Google UX Design Certificate',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Google',
        issueDate: '2020-02-01',
      },
    ],
  },
  'Aisha.Ibrahim': {
    emergencyContacts: [
      {
        fullName: 'Yusuf Ibrahim',
        relationship: Relationship.SPOUSE,
        phone: '+234801234567',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Yusuf Ibrahim',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1988-11-30',
        gender: Gender.MALE,
      },
      {
        fullName: 'Amina Ibrahim',
        relationship: Relationship.CHILD,
        dateOfBirth: '2020-04-12',
        gender: Gender.FEMALE,
      },
      {
        fullName: 'Omar Ibrahim',
        relationship: Relationship.CHILD,
        dateOfBirth: '2022-09-05',
        gender: Gender.MALE,
      },
    ],
    workExperiences: [
      {
        companyName: 'Andela',
        jobTitle: 'Product Manager',
        startDate: '2017-01-01',
        endDate: '2020-03-31',
        location: 'Lagos',
      },
    ],
    educations: [
      {
        institution: 'University of Lagos',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Business Administration',
        startDate: '2008-09-01',
        endDate: '2012-06-30',
      },
      {
        institution: 'Stanford University',
        degree: 'MBA',
        startDate: '2014-09-01',
        endDate: '2016-06-15',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.PASSPORT,
        idNumber: 'A12345678',
        country: 'NG',
        issueDate: '2020-06-01',
        expirationDate: '2030-06-01',
      },
    ],
  },
  'James.Taylor': {
    emergencyContacts: [
      {
        fullName: 'Susan Taylor',
        relationship: Relationship.SPOUSE,
        phone: '+447911234567',
        isPrimary: true,
      },
    ],
    workExperiences: [
      {
        companyName: 'Salesforce',
        jobTitle: 'Account Executive',
        startDate: '2015-04-01',
        endDate: '2020-02-28',
        location: 'London',
        reasonForLeaving: 'Relocated',
      },
    ],
    licensesCertifications: [
      {
        name: 'Salesforce Certified Administrator',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Salesforce',
        issueDate: '2016-07-01',
      },
    ],
  },
  'Margaret.Wilson': {
    emergencyContacts: [
      {
        fullName: 'Robert Wilson',
        relationship: Relationship.SPOUSE,
        phone: '+12025551234',
        isPrimary: true,
      },
    ],
    educations: [
      {
        institution: 'London School of Economics',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Accounting & Finance',
        startDate: '2012-09-01',
        endDate: '2015-06-30',
      },
    ],
    licensesCertifications: [
      {
        name: 'CPA',
        type: LicenseCertificationType.LICENSE,
        issuingOrganization: 'AICPA',
        issueDate: '2016-04-01',
      },
      {
        name: 'ACCA',
        type: LicenseCertificationType.LICENSE,
        issuingOrganization: 'Association of Chartered Certified Accountants',
        issueDate: '2017-09-01',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.SOCIAL_SECURITY,
        idNumber: '123-45-6789',
        country: 'US',
      },
    ],
  },
  'Victoria.Stenberg': {
    emergencyContacts: [
      {
        fullName: 'Erik Stenberg',
        relationship: Relationship.PARENT,
        phone: '+46701234567',
        isPrimary: true,
      },
    ],
    educations: [
      {
        institution: 'Uppsala University',
        degree: 'Master of Laws',
        fieldOfStudy: 'Corporate Law',
        startDate: '2012-09-01',
        endDate: '2017-06-30',
      },
    ],
    licensesCertifications: [
      {
        name: 'Bar Admission - Sweden',
        type: LicenseCertificationType.LICENSE,
        issuingOrganization: 'Swedish Bar Association',
        issueDate: '2018-01-15',
      },
    ],
  },
  'Ravi.Patel': {
    emergencyContacts: [
      {
        fullName: 'Meera Patel',
        relationship: Relationship.SPOUSE,
        phone: '+919876543210',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Meera Patel',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1993-07-15',
        gender: Gender.FEMALE,
      },
    ],
    workExperiences: [
      {
        companyName: 'Flipkart',
        jobTitle: 'Mobile Developer',
        startDate: '2016-07-01',
        endDate: '2021-01-31',
        location: 'Bangalore',
        reasonForLeaving: 'New opportunity',
      },
    ],
    educations: [
      {
        institution: 'IIT Bombay',
        degree: 'Bachelor of Technology',
        fieldOfStudy: 'Computer Science',
        startDate: '2012-07-01',
        endDate: '2016-05-30',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: 'ABCDE1234F',
        country: 'IN',
      },
      {
        idType: NationalIdType.PASSPORT,
        idNumber: 'L1234567',
        country: 'IN',
        issueDate: '2019-03-10',
        expirationDate: '2029-03-10',
      },
    ],
  },
  'Carmen.Delgado': {
    emergencyContacts: [
      {
        fullName: 'Maria Delgado',
        relationship: Relationship.PARENT,
        phone: '+34612345678',
        isPrimary: true,
      },
    ],
    workExperiences: [
      {
        companyName: 'LinkedIn',
        jobTitle: 'Technical Recruiter',
        startDate: '2017-09-01',
        endDate: '2020-09-30',
        location: 'Dublin',
      },
    ],
    licensesCertifications: [
      {
        name: 'AIRS Certified Recruiter',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'AIRS',
        issueDate: '2018-04-01',
      },
    ],
  },
  'Lena.Bergstrom': {
    emergencyContacts: [
      {
        fullName: 'Olaf Bergstrom',
        relationship: Relationship.SPOUSE,
        phone: '+46709876543',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Olaf Bergstrom',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1988-02-14',
        gender: Gender.MALE,
      },
      {
        fullName: 'Astrid Bergstrom',
        relationship: Relationship.CHILD,
        dateOfBirth: '2018-12-25',
        gender: Gender.FEMALE,
      },
    ],
    educations: [
      {
        institution: 'Stockholm University',
        degree: 'Master of Science',
        fieldOfStudy: 'Human Resources Management',
        startDate: '2010-09-01',
        endDate: '2012-06-30',
      },
    ],
    licensesCertifications: [
      {
        name: 'SHRM-SCP',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'SHRM',
        issueDate: '2019-06-01',
      },
    ],
  },
  'Omar.Farooq': {
    emergencyContacts: [
      {
        fullName: 'Fatima Farooq',
        relationship: Relationship.SPOUSE,
        phone: '+923001234567',
        isPrimary: true,
      },
    ],
    workExperiences: [
      {
        companyName: 'Palantir',
        jobTitle: 'Security Analyst',
        startDate: '2016-02-01',
        endDate: '2020-04-30',
        location: 'London',
      },
    ],
    licensesCertifications: [
      {
        name: 'CISSP',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'ISC2',
        issueDate: '2019-08-01',
        expirationDate: '2025-08-01',
        credentialId: 'CISSP-567890',
      },
      {
        name: 'CEH',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'EC-Council',
        issueDate: '2018-03-01',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: '42101-1234567-8',
        country: 'PK',
      },
    ],
  },
  'Isabelle.Moreau': {
    emergencyContacts: [
      {
        fullName: 'Pierre Moreau',
        relationship: Relationship.PARENT,
        phone: '+33612345678',
        isPrimary: true,
      },
    ],
    educations: [
      {
        institution: 'HEC Paris',
        degree: 'Master in Marketing',
        fieldOfStudy: 'Digital Marketing',
        startDate: '2014-09-01',
        endDate: '2016-06-30',
      },
    ],
    licensesCertifications: [
      {
        name: 'Google Analytics Certification',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Google',
        issueDate: '2021-01-15',
      },
      {
        name: 'HubSpot Inbound Marketing',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'HubSpot',
        issueDate: '2020-05-01',
      },
    ],
  },
  'Tomoko.Sato': {
    emergencyContacts: [
      {
        fullName: 'Kenji Sato',
        relationship: Relationship.SPOUSE,
        phone: '+81901234567',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Yui Sato',
        relationship: Relationship.CHILD,
        dateOfBirth: '2017-11-02',
        gender: Gender.FEMALE,
      },
    ],
    workExperiences: [
      {
        companyName: 'Sony Interactive Entertainment',
        jobTitle: 'QA Lead',
        startDate: '2014-04-01',
        endDate: '2020-05-31',
        location: 'Tokyo',
      },
    ],
    licensesCertifications: [
      {
        name: 'ISTQB Advanced Test Analyst',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'ISTQB',
        issueDate: '2017-09-01',
      },
    ],
  },
  'Camille.Bernard': {
    educations: [
      {
        institution: 'Sciences Po Paris',
        degree: 'Master of Arts',
        fieldOfStudy: 'Cognitive Science',
        startDate: '2014-09-01',
        endDate: '2016-06-30',
      },
      {
        institution: 'University of Michigan',
        degree: 'PhD',
        fieldOfStudy: 'Human-Computer Interaction',
        startDate: '2016-09-01',
        endDate: '2020-12-15',
      },
    ],
    licensesCertifications: [
      {
        name: 'UXPA Certified Usability Analyst',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'UXPA International',
        issueDate: '2021-06-01',
      },
    ],
  },
  'Pavel.Kowalski': {
    emergencyContacts: [
      {
        fullName: 'Anna Kowalska',
        relationship: Relationship.SPOUSE,
        phone: '+48501234567',
        isPrimary: true,
      },
    ],
    licensesCertifications: [
      {
        name: 'CompTIA A+',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'CompTIA',
        issueDate: '2018-01-15',
      },
      {
        name: 'ITIL Foundation',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Axelos',
        issueDate: '2019-04-01',
      },
    ],
  },
  'Hassan.ElAmin': {
    emergencyContacts: [
      {
        fullName: 'Layla El-Amin',
        relationship: Relationship.SPOUSE,
        phone: '+971501234567',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Layla El-Amin',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1991-06-20',
        gender: Gender.FEMALE,
      },
      {
        fullName: 'Adam El-Amin',
        relationship: Relationship.CHILD,
        dateOfBirth: '2020-01-15',
        gender: Gender.MALE,
      },
    ],
    workExperiences: [
      {
        companyName: 'Careem',
        jobTitle: 'Business Development Manager',
        startDate: '2015-06-01',
        endDate: '2020-06-30',
        location: 'Dubai',
        reasonForLeaving: 'Joined Hoopy',
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: '784-1990-1234567-1',
        country: 'AE',
      },
    ],
  },
  'Olivia.Johnson': {
    emergencyContacts: [
      {
        fullName: 'Michael Johnson',
        relationship: Relationship.PARENT,
        phone: '+12025559876',
        isPrimary: true,
      },
    ],
    educations: [
      {
        institution: 'MIT',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2014-09-01',
        endDate: '2018-06-15',
      },
    ],
    workExperiences: [
      {
        companyName: 'Stripe',
        jobTitle: 'Software Engineer',
        startDate: '2018-07-01',
        endDate: '2021-05-10',
        location: 'San Francisco',
      },
    ],
  },
  'Noah.Williams': {
    emergencyContacts: [
      {
        fullName: 'Sarah Williams',
        relationship: Relationship.SPOUSE,
        phone: '+447123456789',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Sarah Williams',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1991-09-12',
        gender: Gender.FEMALE,
      },
    ],
    licensesCertifications: [
      {
        name: 'Google Cloud Professional Architect',
        type: LicenseCertificationType.CERTIFICATION,
        issuingOrganization: 'Google Cloud',
        issueDate: '2022-08-01',
        expirationDate: '2024-08-01',
      },
    ],
  },
  'Rosa.Hernandez': {
    emergencyContacts: [
      {
        fullName: 'Carlos Hernandez',
        relationship: Relationship.SPOUSE,
        phone: '+525512345678',
        isPrimary: true,
      },
    ],
    dependents: [
      {
        fullName: 'Carlos Hernandez',
        relationship: Relationship.SPOUSE,
        dateOfBirth: '1987-04-18',
        gender: Gender.MALE,
      },
      {
        fullName: 'Lucia Hernandez',
        relationship: Relationship.CHILD,
        dateOfBirth: '2015-07-30',
        gender: Gender.FEMALE,
      },
      {
        fullName: 'Miguel Hernandez',
        relationship: Relationship.CHILD,
        dateOfBirth: '2018-02-14',
        gender: Gender.MALE,
      },
    ],
    nationalIds: [
      {
        idType: NationalIdType.NATIONAL_ID,
        idNumber: 'HERM870418HDFRRS09',
        country: 'MX',
      },
    ],
  },
};

export class EmployeeSeeder implements Seeder {
  private readonly logger = new Logger(EmployeeSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const employeeService = app.get(EmployeeService);
    const orgUnitService = app.get(OrgUnitService);

    const owners = [
      { email: 'manager@hoopy.com', label: 'Manager', domain: 'hoopy.com' },
      { email: 'admin@admin.com', label: 'Admin', domain: 'admin-corp.com' },
    ];

    let users: any[] = [];
    try {
      users = await userService.findAll();
    } catch {
      // ignore
    }

    for (const owner of owners) {
      const user = users.find((u: any) => u.email === owner.email) ?? null;
      if (!user) continue;

      let company = null;
      try {
        company = await companyService.findByOwner(user.id);
      } catch {
        // ignore
      }
      if (!company) continue;

      try {
        // Check if employees already exist for this company
        const existingEmployees = await employeeService.findAll();
        const companyEmployees = existingEmployees.filter(
          (e: any) => e.company?.id === company.id,
        );

        if (companyEmployees.length > 5) {
          this.logger.log(
            `  [${company.name}] Already has ${companyEmployees.length} employees; skipping.`,
          );
          continue;
        }

        // Build org unit lookup by code
        const roots = await orgUnitService.findChildren(company.id);
        const hq = roots.find((r: any) => r.code === 'HQ');
        let unitByCode: Record<string, any> = {};

        if (hq) {
          const allUnits = await orgUnitService.getSubtree(hq.id, company.id);
          unitByCode = allUnits.reduce(
            (acc, u) => (u.code ? { ...acc, [u.code]: u } : acc),
            {} as Record<string, any>,
          );
        }

        this.logger.log(
          `Seeding employees for ${company.name} (${owner.label})...`,
        );
        let created = 0;

        for (const [teamCode, employees] of Object.entries(EMPLOYEES_BY_TEAM)) {
          const unit = unitByCode[teamCode];

          for (const emp of employees) {
            try {
              const key = `${emp.firstName}.${emp.lastName.replace(/[^a-zA-Z]/g, '')}`;
              const related = RELATED_DATA[key] ?? {};

              await employeeService.create({
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: `${emp.firstName.toLowerCase().replace(/[^a-z]/g, '')}.${emp.lastName.toLowerCase().replace(/[^a-z]/g, '')}@${owner.domain}`,
                position: emp.position,
                department: unit?.name ?? teamCode,
                hireDate: emp.hireDate,
                companyId: company.id,
                jobInformations: [
                  {
                    effectiveDate: emp.hireDate,
                    jobTitle: emp.position,
                    department: unit?.name ?? teamCode,
                    location: 'Istanbul Office',
                    employmentType:
                      emp.employmentType ?? EmploymentType.FULL_TIME,
                  },
                ],
                ...related,
              });
              created++;
            } catch {
              // skip if employee already exists (e.g. unique constraint)
            }
          }

          if (unit) {
            this.logger.log(
              `  [${company.name}/${unit.name}] Seeded ${employees.length} employees`,
            );
          }
        }

        this.logger.log(
          `  [${company.name}] Total employees created: ${created}`,
        );
      } catch (err) {
        this.logger.warn(
          `Employee seed failed for ${company.name}: ${(err as Error).message}`,
        );
      }
    }
  }
}
