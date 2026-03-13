import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Attachment } from './attachment.entity';

export interface AttachmentRepository {
  create(data: Partial<Attachment>): Attachment;
  save(attachment: Attachment): Promise<Attachment>;
  findById(id: string): Promise<Attachment | null>;
  remove(attachment: Attachment): Promise<Attachment>;
  findByRelated(relatedType: string, relatedId: string): Promise<Attachment[]>;
}

@Injectable()
export class TypeOrmAttachmentRepository implements AttachmentRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(Attachment);
  }

  private readonly repo: Repository<Attachment>;

  create(data: Partial<Attachment>): Attachment {
    return this.repo.create(data);
  }

  save(attachment: Attachment): Promise<Attachment> {
    return this.repo.save(attachment);
  }

  findById(id: string): Promise<Attachment | null> {
    return this.repo.findOne({ where: { id } });
  }

  remove(attachment: Attachment): Promise<Attachment> {
    return this.repo.remove(attachment);
  }

  findByRelated(relatedType: string, relatedId: string): Promise<Attachment[]> {
    return this.repo.find({
      where: { relatedType, relatedId },
    });
  }
}
