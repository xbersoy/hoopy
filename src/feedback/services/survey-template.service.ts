import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SurveyTemplate } from '../entities/survey-template.entity';
import { SurveyQuestion } from '../entities/survey-question.entity';
import {
  SurveyTemplateRepository,
  SurveyQuestionRepository,
  SurveyQuestionOptionRepository,
} from '../survey.repository';
import {
  CreateSurveyTemplateDto,
  UpdateSurveyTemplateDto,
  CreateSurveyQuestionDto,
} from '../dto/survey-template.dto';

@Injectable()
export class SurveyTemplateService {
  constructor(
    @Inject('SurveyTemplateRepository')
    private readonly templateRepository: SurveyTemplateRepository,

    @Inject('SurveyQuestionRepository')
    private readonly questionRepository: SurveyQuestionRepository,

    @Inject('SurveyQuestionOptionRepository')
    private readonly optionRepository: SurveyQuestionOptionRepository,
  ) {}

  async create(
    companyId: string,
    dto: CreateSurveyTemplateDto,
  ): Promise<SurveyTemplate> {
    const template = this.templateRepository.create({
      companyId,
      name: dto.name,
      description: dto.description || null,
      defaultTitle: dto.defaultTitle || null,
      defaultInstructions: dto.defaultInstructions || null,
      defaultAnonymous: dto.defaultAnonymous ?? true,
      category: dto.category || null,
    });

    const savedTemplate = await this.templateRepository.save(template);

    if (dto.questions?.length) {
      await this.saveQuestions(savedTemplate.id, null, dto.questions);
    }

    return this.findOne(savedTemplate.id);
  }

  async findAll(companyId: string): Promise<SurveyTemplate[]> {
    return this.templateRepository.findByCompany(companyId);
  }

  async findOne(id: string): Promise<SurveyTemplate> {
    const template = await this.templateRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Survey template with ID "${id}" not found`);
    }
    return template;
  }

  async update(id: string, dto: UpdateSurveyTemplateDto): Promise<SurveyTemplate> {
    const template = await this.findOne(id);

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description || null;
    if (dto.defaultTitle !== undefined)
      template.defaultTitle = dto.defaultTitle || null;
    if (dto.defaultInstructions !== undefined)
      template.defaultInstructions = dto.defaultInstructions || null;
    if (dto.defaultAnonymous !== undefined)
      template.defaultAnonymous = dto.defaultAnonymous;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;
    if (dto.category !== undefined) template.category = dto.category || null;

    await this.templateRepository.save(template);

    // Replace questions if provided
    if (dto.questions !== undefined) {
      await this.questionRepository.deleteByTemplateId(template.id);
      if (dto.questions.length) {
        await this.saveQuestions(template.id, null, dto.questions);
      }
    }

    return this.findOne(template.id);
  }

  async remove(id: string): Promise<SurveyTemplate> {
    const template = await this.findOne(id);
    const removed = await this.templateRepository.remove(template);
    return { ...removed, id };
  }

  async duplicateTemplate(id: string, newName: string): Promise<SurveyTemplate> {
    const original = await this.findOne(id);

    const questions = original.questions?.map((q) => ({
      questionType: q.questionType,
      questionText: q.questionText,
      helpText: q.helpText,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      section: q.section,
      config: q.config,
      options: q.options?.map((o) => ({
        value: o.value,
        label: o.label,
        sortOrder: o.sortOrder,
      })),
    }));

    return this.create(original.companyId, {
      name: newName,
      description: original.description,
      defaultTitle: original.defaultTitle,
      defaultInstructions: original.defaultInstructions,
      defaultAnonymous: original.defaultAnonymous,
      category: original.category,
      questions,
    });
  }

  private async saveQuestions(
    templateId: string | null,
    surveyId: string | null,
    questions: CreateSurveyQuestionDto[],
  ): Promise<SurveyQuestion[]> {
    const savedQuestions: SurveyQuestion[] = [];

    for (let i = 0; i < questions.length; i++) {
      const qDto = questions[i];
      const question = this.questionRepository.create({
        surveyTemplateId: templateId,
        surveyId,
        questionType: qDto.questionType,
        questionText: qDto.questionText,
        helpText: qDto.helpText || null,
        isRequired: qDto.isRequired ?? false,
        sortOrder: qDto.sortOrder ?? i,
        section: qDto.section || null,
        config: qDto.config || null,
      });

      const savedQuestion = await this.questionRepository.save(question);

      if (qDto.options?.length) {
        const options = qDto.options.map((o, idx) =>
          this.optionRepository.create({
            questionId: savedQuestion.id,
            value: o.value,
            label: o.label,
            sortOrder: o.sortOrder ?? idx,
          }),
        );
        await this.optionRepository.saveAll(options);
      }

      savedQuestions.push(savedQuestion);
    }

    return savedQuestions;
  }
}
