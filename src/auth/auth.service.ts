import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JWT_CONFIG } from '@infras/configuration';
import { RegisterDto } from './dto/auth.dto';
import { ContactType } from '../contact/entities/contact.entity';
import { AccountService } from '../account/services/account.service';
import { ContactService } from '../contact/contact.service';

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
    private readonly accountService: AccountService,
    private readonly contactService: ContactService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<JWT_CONFIG>(JWT_CONFIG)
  }

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, account, firstName, lastName, phoneNumber } = registerDto;

    if (!email || !password || !account || !firstName || !lastName) {
      throw new BadRequestException('Required fields are missing');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: email.trim() },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email: email.trim(),
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);

    await this.accountService.create(account.name, account.type, savedUser);

    await this.contactService.createContact(
      savedUser,
      ContactType.EMAIL,
      email,
      undefined,
      true,
    );

    if (phoneNumber) {
      await this.contactService.createContact(
        savedUser,
        ContactType.PHONE,
        phoneNumber,
        undefined,
        true,
      );
    }

    return this.generateTokens(savedUser);
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