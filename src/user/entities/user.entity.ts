import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { Account } from '../../account/entities/account.entity';
import { Contact } from '../../contact/entities/contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Column({ nullable: false })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true, nullable: false })
  @IsEmail()
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToOne(() => Account, account => account.owner)
  account?: Account;

  @OneToMany(() => Contact, contact => contact.user)
  contacts: Contact[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
