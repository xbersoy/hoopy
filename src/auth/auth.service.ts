import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JWT_CONFIG } from '@infras/configuration';
import { RegisterDto } from './dto/auth.dto';
import { DataSource } from 'typeorm';
import { Company } from '../company/entities/company.entity';

export interface JWT_CONFIG {
	accessSecret: string
	refreshSecret: string
	accessTokenExpirationTime: string
	refreshTokenExpirationTime: string
}

@Injectable()
export class AuthService {
  private config: JWT_CONFIG

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.config = this.configService.get(JWT_CONFIG)
  }

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, company } = registerDto;

    if (!email || !password || !company) {
      throw new BadRequestException('Email, password, and company information are required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, { where: { email } });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        email: email.trim(),
        password: hashedPassword,
      });

      const savedUser = await queryRunner.manager.save(user);
      
      const companyEntity = this.companyRepository.create({
        name: company.name,
        sector: company.sector,
        owner: savedUser,
      });
      
      await queryRunner.manager.save(companyEntity);
      await queryRunner.commitTransaction();
      
      return this.generateTokens(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Failed to create user and company');
    } finally {
      await queryRunner.release();
    }
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userRepository.findOne({ where: { email: email.trim() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.refreshSecret,
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    await this.userRepository.update(userId, { refreshToken: null });
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessTokenExpirationTime,
    });
    
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.refreshSecret,
      expiresIn: this.config.refreshTokenExpirationTime,
    });

    await this.userRepository.update(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
    };
  }
} 