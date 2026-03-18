import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/services/company.service';
import { SkillType } from '../../employee/entities/skill-type.entity';
import { Skill } from '../../employee/entities/skill.entity';
import { Competency } from '../../employee/entities/competency.entity';
import { CompetencyCategory } from '../../employee/entities/competency-category.entity';
import { EmployeeSkill } from '../../employee/entities/employee-skill.entity';
import { EmployeeCompetency } from '../../employee/entities/employee-competency.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { ProficiencyLevel } from '../../employee/enums/proficiency-level.enum';
import { AssessmentSource } from '../../employee/enums/assessment-source.enum';

// ── Skill Types seed data ────────────────────────────────────────
const SKILL_TYPES = [
  {
    code: 'TECH',
    name: 'Technical',
    description: 'Technical and programming skills',
    sortOrder: 1,
  },
  {
    code: 'LANG',
    name: 'Language',
    description: 'Language proficiency',
    sortOrder: 2,
  },
  {
    code: 'TOOL',
    name: 'Tool / Software',
    description: 'Software and tools proficiency',
    sortOrder: 3,
  },
  {
    code: 'DOMAIN',
    name: 'Domain Knowledge',
    description: 'Industry and domain expertise',
    sortOrder: 4,
  },
  {
    code: 'SOFT',
    name: 'Soft Skill',
    description: 'Interpersonal and communication skills',
    sortOrder: 5,
  },
];

// ── Skills seed data (grouped by skill type code) ────────────────
const SKILLS_BY_TYPE: Record<
  string,
  Array<{ name: string; description?: string }>
> = {
  TECH: [
    { name: 'TypeScript', description: 'TypeScript programming language' },
    { name: 'JavaScript', description: 'JavaScript programming language' },
    { name: 'Python', description: 'Python programming language' },
    { name: 'SQL', description: 'Structured Query Language' },
    { name: 'Node.js', description: 'Node.js runtime environment' },
    { name: 'React', description: 'React frontend framework' },
    { name: 'NestJS', description: 'NestJS backend framework' },
    { name: 'PostgreSQL', description: 'PostgreSQL database' },
    { name: 'Docker', description: 'Docker containerization' },
    { name: 'Kubernetes', description: 'Kubernetes orchestration' },
  ],
  LANG: [
    { name: 'English', description: 'English language' },
    { name: 'Spanish', description: 'Spanish language' },
    { name: 'German', description: 'German language' },
    { name: 'French', description: 'French language' },
    { name: 'Turkish', description: 'Turkish language' },
    { name: 'Japanese', description: 'Japanese language' },
    { name: 'Mandarin Chinese', description: 'Mandarin Chinese language' },
  ],
  TOOL: [
    { name: 'Excel', description: 'Microsoft Excel' },
    { name: 'Jira', description: 'Jira project management' },
    { name: 'Git', description: 'Git version control' },
    { name: 'VS Code', description: 'Visual Studio Code IDE' },
    { name: 'Figma', description: 'Figma design tool' },
    { name: 'Slack', description: 'Slack communication platform' },
  ],
  DOMAIN: [
    {
      name: 'Payroll Processing',
      description: 'Payroll and compensation management',
    },
    { name: 'HR Management', description: 'Human resources processes' },
    { name: 'Financial Analysis', description: 'Financial data analysis' },
    {
      name: 'Project Management',
      description: 'Project planning and execution',
    },
    { name: 'Data Analytics', description: 'Data analysis and insights' },
  ],
  SOFT: [
    { name: 'Communication', description: 'Verbal and written communication' },
    { name: 'Teamwork', description: 'Collaboration and team dynamics' },
    { name: 'Problem Solving', description: 'Analytical problem solving' },
    { name: 'Time Management', description: 'Prioritization and scheduling' },
    { name: 'Adaptability', description: 'Flexibility and change management' },
    {
      name: 'Conflict Resolution',
      description: 'Managing and resolving conflicts',
    },
  ],
};

// ── Competency Categories seed data ──────────────────────────────
const COMPETENCY_CATEGORIES = [
  {
    code: 'TECHNICAL',
    name: 'Technical',
    description: 'Technical and domain-specific competencies',
    sortOrder: 1,
  },
  {
    code: 'BEHAVIORAL',
    name: 'Behavioral',
    description: 'Interpersonal and workplace behavior competencies',
    sortOrder: 2,
  },
  {
    code: 'COGNITIVE',
    name: 'Cognitive',
    description: 'Thinking and analytical competencies',
    sortOrder: 3,
  },
  {
    code: 'LEADERSHIP',
    name: 'Leadership',
    description: 'Leadership and management competencies',
    sortOrder: 4,
  },
];

// ── Competencies seed data (with category code reference) ────────
const COMPETENCIES = [
  {
    code: 'TECH_EXP',
    name: 'Technical Expertise',
    description: 'Depth and breadth of technical knowledge',
    categoryCode: 'TECHNICAL',
  },
  {
    code: 'COLLABORATION',
    name: 'Collaboration',
    description: 'Ability to work effectively with others',
    categoryCode: 'BEHAVIORAL',
  },
  {
    code: 'PROBLEM_SOLVE',
    name: 'Problem Solving',
    description: 'Analytical and creative problem solving',
    categoryCode: 'COGNITIVE',
  },
  {
    code: 'LEADERSHIP',
    name: 'Leadership',
    description: 'Ability to lead and inspire teams',
    categoryCode: 'LEADERSHIP',
  },
  {
    code: 'CUSTOMER_ORIENT',
    name: 'Customer Orientation',
    description: 'Focus on customer needs and satisfaction',
    categoryCode: 'BEHAVIORAL',
  },
  {
    code: 'INNOVATION',
    name: 'Innovation',
    description: 'Creative thinking and continuous improvement',
    categoryCode: 'COGNITIVE',
  },
  {
    code: 'COMMUNICATION',
    name: 'Communication',
    description: 'Clear and effective communication',
    categoryCode: 'BEHAVIORAL',
  },
  {
    code: 'ACCOUNTABILITY',
    name: 'Accountability',
    description: 'Taking ownership and responsibility',
    categoryCode: 'BEHAVIORAL',
  },
];

export class SkillsCompetenciesSeeder implements Seeder {
  private readonly logger = new Logger(SkillsCompetenciesSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const skillTypeRepo = app.get<Repository<SkillType>>(
      getRepositoryToken(SkillType),
    );
    const skillRepo = app.get<Repository<Skill>>(getRepositoryToken(Skill));
    const competencyCategoryRepo = app.get<Repository<CompetencyCategory>>(
      getRepositoryToken(CompetencyCategory),
    );
    const competencyRepo = app.get<Repository<Competency>>(
      getRepositoryToken(Competency),
    );
    const employeeSkillRepo = app.get<Repository<EmployeeSkill>>(
      getRepositoryToken(EmployeeSkill),
    );
    const employeeCompetencyRepo = app.get<Repository<EmployeeCompetency>>(
      getRepositoryToken(EmployeeCompetency),
    );
    const employeeRepo = app.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);

    // Get company owners to seed data for each company
    const owners = [
      { email: 'admin@admin.com', label: 'Admin' },
      { email: 'manager@hoopy.com', label: 'Manager' },
    ];

    let users: any[] = [];
    try {
      users = await userService.findAll();
    } catch {
      // ignore
    }

    for (const owner of owners) {
      const user = users.find((u: any) => u.email === owner.email) ?? null;
      if (!user) {
        this.logger.warn(
          `${owner.label} user not found — skipping skills/competencies seed.`,
        );
        continue;
      }

      let company = null;
      try {
        company = await companyService.findByOwner(user.id);
      } catch {
        // ignore
      }
      if (!company) {
        this.logger.warn(
          `${owner.label} company not found — skipping skills/competencies seed.`,
        );
        continue;
      }

      this.logger.log(`Seeding skills and competencies for ${company.name}...`);

      // ── Seed Skill Types ──────────────────────────────────────────
      const skillTypeMap = new Map<string, SkillType>();
      for (const stData of SKILL_TYPES) {
        let skillType = await skillTypeRepo.findOne({
          where: { companyId: company.id, name: stData.name },
        });
        if (!skillType) {
          skillType = await skillTypeRepo.save(
            skillTypeRepo.create({
              ...stData,
              companyId: company.id,
            }),
          );
          this.logger.log(
            `  [${company.name}] Created skill type: ${stData.name}`,
          );
        }
        skillTypeMap.set(stData.code, skillType);
      }

      // ── Seed Skills ───────────────────────────────────────────────
      const skillMap = new Map<string, Skill>();
      for (const [typeCode, skillsData] of Object.entries(SKILLS_BY_TYPE)) {
        const skillType = skillTypeMap.get(typeCode);
        if (!skillType) continue;

        for (const sData of skillsData) {
          let skill = await skillRepo.findOne({
            where: { companyId: company.id, name: sData.name },
          });
          if (!skill) {
            skill = await skillRepo.save(
              skillRepo.create({
                ...sData,
                companyId: company.id,
                skillTypeId: skillType.id,
              }),
            );
            this.logger.log(`  [${company.name}] Created skill: ${sData.name}`);
          }
          skillMap.set(sData.name, skill);
        }
      }

      // ── Seed Competency Categories ─────────────────────────────────
      const competencyCategoryMap = new Map<string, CompetencyCategory>();
      for (const ccData of COMPETENCY_CATEGORIES) {
        let category = await competencyCategoryRepo.findOne({
          where: { companyId: company.id, name: ccData.name },
        });
        if (!category) {
          category = await competencyCategoryRepo.save(
            competencyCategoryRepo.create({
              ...ccData,
              companyId: company.id,
            }),
          );
          this.logger.log(
            `  [${company.name}] Created competency category: ${ccData.name}`,
          );
        }
        competencyCategoryMap.set(ccData.code, category);
      }

      // ── Seed Competencies ─────────────────────────────────────────
      const competencyMap = new Map<string, Competency>();
      for (const cData of COMPETENCIES) {
        const category = competencyCategoryMap.get(cData.categoryCode);
        let competency = await competencyRepo.findOne({
          where: { companyId: company.id, name: cData.name },
        });
        if (!competency) {
          competency = await competencyRepo.save(
            competencyRepo.create({
              code: cData.code,
              name: cData.name,
              description: cData.description,
              companyId: company.id,
              competencyCategoryId: category?.id,
            }),
          );
          this.logger.log(
            `  [${company.name}] Created competency: ${cData.name}`,
          );
        } else if (!competency.competencyCategoryId && category) {
          // Update existing competencies to link to category
          competency.competencyCategoryId = category.id;
          await competencyRepo.save(competency);
        }
        competencyMap.set(cData.code, competency);
      }

      // ── Seed Employee Skills & Competencies ───────────────────────
      const employees = await employeeRepo.find({
        where: { company: { id: company.id } },
        take: 10, // Seed for first 10 employees
      });

      // Sample skill assignments
      const skillAssignments: Array<{
        skillName: string;
        proficiency: ProficiencyLevel;
        years: number;
        isPrimary?: boolean;
      }> = [
        {
          skillName: 'TypeScript',
          proficiency: ProficiencyLevel.ADVANCED,
          years: 4,
          isPrimary: true,
        },
        {
          skillName: 'React',
          proficiency: ProficiencyLevel.INTERMEDIATE,
          years: 3,
        },
        {
          skillName: 'English',
          proficiency: ProficiencyLevel.EXPERT,
          years: 10,
        },
        { skillName: 'Git', proficiency: ProficiencyLevel.ADVANCED, years: 5 },
      ];

      // Sample competency assignments
      const competencyAssignments: Array<{
        competencyCode: string;
        rating: number;
        source: AssessmentSource;
      }> = [
        {
          competencyCode: 'TECH_EXP',
          rating: 4,
          source: AssessmentSource.MANAGER,
        },
        {
          competencyCode: 'COLLABORATION',
          rating: 5,
          source: AssessmentSource.HR,
        },
        {
          competencyCode: 'PROBLEM_SOLVE',
          rating: 4,
          source: AssessmentSource.SELF,
        },
      ];

      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];

        // Assign 2-4 skills per employee (rotate through assignments)
        const numSkills = 2 + (i % 3);
        for (let j = 0; j < numSkills; j++) {
          const assignment =
            skillAssignments[(i + j) % skillAssignments.length];
          const skill = skillMap.get(assignment.skillName);
          if (!skill) continue;

          const existing = await employeeSkillRepo.findOne({
            where: {
              companyId: company.id,
              employeeId: employee.id,
              skillId: skill.id,
            },
          });

          if (!existing) {
            await employeeSkillRepo.save(
              employeeSkillRepo.create({
                companyId: company.id,
                employeeId: employee.id,
                skillId: skill.id,
                proficiencyLevel: assignment.proficiency,
                yearsOfExperience: assignment.years + (i % 3),
                isPrimary: assignment.isPrimary && j === 0,
                lastUsedAt: new Date(),
              }),
            );
          }
        }

        // Assign 1-3 competencies per employee
        const numCompetencies = 1 + (i % 3);
        for (let j = 0; j < numCompetencies; j++) {
          const assignment =
            competencyAssignments[(i + j) % competencyAssignments.length];
          const competency = competencyMap.get(assignment.competencyCode);
          if (!competency) continue;

          const existing = await employeeCompetencyRepo.findOne({
            where: {
              companyId: company.id,
              employeeId: employee.id,
              competencyId: competency.id,
            },
          });

          if (!existing) {
            await employeeCompetencyRepo.save(
              employeeCompetencyRepo.create({
                companyId: company.id,
                employeeId: employee.id,
                competencyId: competency.id,
                rating: Math.min(5, assignment.rating + (i % 2)),
                assessmentSource: assignment.source,
                assessedAt: new Date(),
              }),
            );
          }
        }
      }

      this.logger.log(
        `  [${company.name}] Seeded employee skills and competencies for ${employees.length} employees.`,
      );
    }
  }
}
