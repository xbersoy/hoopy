import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  SurveyTemplate,
  SurveyQuestion,
  SurveyQuestionOption,
  Survey,
  SurveyAssignment,
  SurveyResponse,
  SurveyAnswer,
} from './entities';
import { SurveyStatus, SurveyResponseStatus } from './enums';

// ─── Interfaces ─────────────────────────────────────────────

export interface SurveyTemplateRepository {
  create(data: Partial<SurveyTemplate>): SurveyTemplate;
  save(entity: SurveyTemplate): Promise<SurveyTemplate>;
  findByCompany(companyId: string): Promise<SurveyTemplate[]>;
  findOne(id: string): Promise<SurveyTemplate | null>;
  remove(entity: SurveyTemplate): Promise<SurveyTemplate>;
}

export interface SurveyQuestionRepository {
  create(data: Partial<SurveyQuestion>): SurveyQuestion;
  save(entity: SurveyQuestion): Promise<SurveyQuestion>;
  saveAll(entities: SurveyQuestion[]): Promise<SurveyQuestion[]>;
  findByTemplate(templateId: string): Promise<SurveyQuestion[]>;
  findBySurvey(surveyId: string): Promise<SurveyQuestion[]>;
  findOne(id: string): Promise<SurveyQuestion | null>;
  deleteByTemplateId(templateId: string): Promise<void>;
  deleteBySurveyId(surveyId: string): Promise<void>;
}

export interface SurveyQuestionOptionRepository {
  create(data: Partial<SurveyQuestionOption>): SurveyQuestionOption;
  saveAll(entities: SurveyQuestionOption[]): Promise<SurveyQuestionOption[]>;
  findByQuestion(questionId: string): Promise<SurveyQuestionOption[]>;
  deleteByQuestionId(questionId: string): Promise<void>;
}

export interface SurveyRepository {
  create(data: Partial<Survey>): Survey;
  save(entity: Survey): Promise<Survey>;
  findPaginated(options: {
    companyId: string;
    status?: SurveyStatus;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Survey[]; total: number }>;
  findOne(id: string): Promise<Survey | null>;
  findScheduledToPublish(beforeDate: Date): Promise<Survey[]>;
  remove(entity: Survey): Promise<Survey>;
}

export interface SurveyAssignmentRepository {
  create(data: Partial<SurveyAssignment>): SurveyAssignment;
  save(entity: SurveyAssignment): Promise<SurveyAssignment>;
  saveAll(entities: SurveyAssignment[]): Promise<SurveyAssignment[]>;
  findBySurvey(surveyId: string): Promise<SurveyAssignment[]>;
  findByEmployee(employeeId: string): Promise<SurveyAssignment[]>;
  findPendingByEmployee(employeeId: string): Promise<SurveyAssignment[]>;
  findOne(id: string): Promise<SurveyAssignment | null>;
  findBySurveyAndEmployee(
    surveyId: string,
    employeeId: string,
  ): Promise<SurveyAssignment | null>;
  countBySurveyAndStatus(
    surveyId: string,
    status: SurveyResponseStatus,
  ): Promise<number>;
  countBySurvey(surveyId: string): Promise<number>;
}

export interface SurveyResponseRepository {
  create(data: Partial<SurveyResponse>): SurveyResponse;
  save(entity: SurveyResponse): Promise<SurveyResponse>;
  findBySurvey(surveyId: string): Promise<SurveyResponse[]>;
  findOne(id: string): Promise<SurveyResponse | null>;
  findBySurveyAndRespondent(
    surveyId: string,
    respondentId: string,
  ): Promise<SurveyResponse | null>;
  countSubmittedBySurvey(surveyId: string): Promise<number>;
}

export interface SurveyAnswerRepository {
  create(data: Partial<SurveyAnswer>): SurveyAnswer;
  save(entity: SurveyAnswer): Promise<SurveyAnswer>;
  saveAll(entities: SurveyAnswer[]): Promise<SurveyAnswer[]>;
  findByResponse(responseId: string): Promise<SurveyAnswer[]>;
  findByQuestion(questionId: string): Promise<SurveyAnswer[]>;
  deleteByResponseId(responseId: string): Promise<void>;
}

// ─── Implementations ────────────────────────────────────────

@Injectable()
export class TypeOrmSurveyTemplateRepository implements SurveyTemplateRepository {
  private readonly repo: Repository<SurveyTemplate>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyTemplate);
  }

  create(data: Partial<SurveyTemplate>): SurveyTemplate {
    return this.repo.create(data);
  }
  save(entity: SurveyTemplate): Promise<SurveyTemplate> {
    return this.repo.save(entity);
  }
  findByCompany(companyId: string): Promise<SurveyTemplate[]> {
    return this.repo.find({
      where: { companyId },
      relations: ['questions', 'questions.options'],
      order: { name: 'ASC' },
    });
  }
  findOne(id: string): Promise<SurveyTemplate | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['questions', 'questions.options'],
    });
  }
  remove(entity: SurveyTemplate): Promise<SurveyTemplate> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmSurveyQuestionRepository implements SurveyQuestionRepository {
  private readonly repo: Repository<SurveyQuestion>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyQuestion);
  }

  create(data: Partial<SurveyQuestion>): SurveyQuestion {
    return this.repo.create(data);
  }
  save(entity: SurveyQuestion): Promise<SurveyQuestion> {
    return this.repo.save(entity);
  }
  saveAll(entities: SurveyQuestion[]): Promise<SurveyQuestion[]> {
    return this.repo.save(entities);
  }
  findByTemplate(templateId: string): Promise<SurveyQuestion[]> {
    return this.repo.find({
      where: { surveyTemplateId: templateId },
      relations: ['options'],
      order: { sortOrder: 'ASC' },
    });
  }
  findBySurvey(surveyId: string): Promise<SurveyQuestion[]> {
    return this.repo.find({
      where: { surveyId },
      relations: ['options'],
      order: { sortOrder: 'ASC' },
    });
  }
  findOne(id: string): Promise<SurveyQuestion | null> {
    return this.repo.findOne({ where: { id }, relations: ['options'] });
  }
  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.repo.delete({ surveyTemplateId: templateId });
  }
  async deleteBySurveyId(surveyId: string): Promise<void> {
    await this.repo.delete({ surveyId });
  }
}

@Injectable()
export class TypeOrmSurveyQuestionOptionRepository
  implements SurveyQuestionOptionRepository
{
  private readonly repo: Repository<SurveyQuestionOption>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyQuestionOption);
  }

  create(data: Partial<SurveyQuestionOption>): SurveyQuestionOption {
    return this.repo.create(data);
  }
  saveAll(entities: SurveyQuestionOption[]): Promise<SurveyQuestionOption[]> {
    return this.repo.save(entities);
  }
  findByQuestion(questionId: string): Promise<SurveyQuestionOption[]> {
    return this.repo.find({
      where: { questionId },
      order: { sortOrder: 'ASC' },
    });
  }
  async deleteByQuestionId(questionId: string): Promise<void> {
    await this.repo.delete({ questionId });
  }
}

@Injectable()
export class TypeOrmSurveyRepository implements SurveyRepository {
  private readonly repo: Repository<Survey>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(Survey);
  }

  create(data: Partial<Survey>): Survey {
    return this.repo.create(data);
  }
  save(entity: Survey): Promise<Survey> {
    return this.repo.save(entity);
  }
  async findPaginated(options: {
    companyId: string;
    status?: SurveyStatus;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Survey[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.template', 'tpl')
      .leftJoinAndSelect('s.createdByUser', 'creator')
      .where('s.companyId = :companyId', { companyId: options.companyId });

    if (options.status)
      qb.andWhere('s.status = :status', { status: options.status });
    if (options.search)
      qb.andWhere('s.title ILIKE :search', { search: `%${options.search}%` });

    qb.orderBy('s.createdAt', 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
  findOne(id: string): Promise<Survey | null> {
    return this.repo.findOne({
      where: { id },
      relations: [
        'template',
        'createdByUser',
        'questions',
        'questions.options',
        'assignments',
      ],
    });
  }
  findScheduledToPublish(beforeDate: Date): Promise<Survey[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SurveyStatus.SCHEDULED })
      .andWhere('s.scheduledPublishAt <= :beforeDate', { beforeDate })
      .getMany();
  }
  remove(entity: Survey): Promise<Survey> {
    return this.repo.remove(entity);
  }
}

@Injectable()
export class TypeOrmSurveyAssignmentRepository implements SurveyAssignmentRepository {
  private readonly repo: Repository<SurveyAssignment>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyAssignment);
  }

  create(data: Partial<SurveyAssignment>): SurveyAssignment {
    return this.repo.create(data);
  }
  save(entity: SurveyAssignment): Promise<SurveyAssignment> {
    return this.repo.save(entity);
  }
  saveAll(entities: SurveyAssignment[]): Promise<SurveyAssignment[]> {
    return this.repo.save(entities);
  }
  findBySurvey(surveyId: string): Promise<SurveyAssignment[]> {
    return this.repo.find({
      where: { surveyId },
      relations: ['employee'],
    });
  }
  findByEmployee(employeeId: string): Promise<SurveyAssignment[]> {
    return this.repo.find({
      where: { employeeId },
      relations: ['survey'],
      order: { createdAt: 'DESC' },
    });
  }
  findPendingByEmployee(employeeId: string): Promise<SurveyAssignment[]> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.survey', 's')
      .where('a.employeeId = :employeeId', { employeeId })
      .andWhere('a.hasCompleted = false')
      .andWhere('s.status = :status', { status: SurveyStatus.ACTIVE })
      .orderBy('s.dueDate', 'ASC')
      .getMany();
  }
  findOne(id: string): Promise<SurveyAssignment | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['survey', 'employee'],
    });
  }
  findBySurveyAndEmployee(
    surveyId: string,
    employeeId: string,
  ): Promise<SurveyAssignment | null> {
    return this.repo.findOne({
      where: { surveyId, employeeId },
      relations: ['survey'],
    });
  }
  countBySurveyAndStatus(
    surveyId: string,
    status: SurveyResponseStatus,
  ): Promise<number> {
    return this.repo.count({ where: { surveyId, status } });
  }
  countBySurvey(surveyId: string): Promise<number> {
    return this.repo.count({ where: { surveyId } });
  }
}

@Injectable()
export class TypeOrmSurveyResponseRepository implements SurveyResponseRepository {
  private readonly repo: Repository<SurveyResponse>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyResponse);
  }

  create(data: Partial<SurveyResponse>): SurveyResponse {
    return this.repo.create(data);
  }
  save(entity: SurveyResponse): Promise<SurveyResponse> {
    return this.repo.save(entity);
  }
  findBySurvey(surveyId: string): Promise<SurveyResponse[]> {
    return this.repo.find({
      where: { surveyId },
      relations: ['answers', 'answers.question'],
    });
  }
  findOne(id: string): Promise<SurveyResponse | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['survey', 'answers', 'answers.question'],
    });
  }
  findBySurveyAndRespondent(
    surveyId: string,
    respondentId: string,
  ): Promise<SurveyResponse | null> {
    return this.repo.findOne({
      where: { surveyId, respondentId },
      relations: ['answers'],
    });
  }
  countSubmittedBySurvey(surveyId: string): Promise<number> {
    return this.repo.count({
      where: { surveyId, status: SurveyResponseStatus.SUBMITTED },
    });
  }
}

@Injectable()
export class TypeOrmSurveyAnswerRepository implements SurveyAnswerRepository {
  private readonly repo: Repository<SurveyAnswer>;
  constructor(@InjectDataSource() ds: DataSource) {
    this.repo = ds.getRepository(SurveyAnswer);
  }

  create(data: Partial<SurveyAnswer>): SurveyAnswer {
    return this.repo.create(data);
  }
  save(entity: SurveyAnswer): Promise<SurveyAnswer> {
    return this.repo.save(entity);
  }
  saveAll(entities: SurveyAnswer[]): Promise<SurveyAnswer[]> {
    return this.repo.save(entities);
  }
  findByResponse(responseId: string): Promise<SurveyAnswer[]> {
    return this.repo.find({
      where: { responseId },
      relations: ['question'],
    });
  }
  findByQuestion(questionId: string): Promise<SurveyAnswer[]> {
    return this.repo.find({ where: { questionId } });
  }
  async deleteByResponseId(responseId: string): Promise<void> {
    await this.repo.delete({ responseId });
  }
}
