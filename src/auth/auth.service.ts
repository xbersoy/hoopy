import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
import { CompanyService } from '../company/services/company.service';
import { EmployeeService } from '../employee/employee.service';
import { PermissionsService } from '../permissions/services/permissions.service';
import { Permission } from '../permissions/entities/permission.entity';

export interface JWT_CONFIG {
  accessSecret: string;
  refreshSecret: string;
  accessTokenExpirationTime: string;
  refreshTokenExpirationTime: string;
}

@Injectable()
export class AuthService {
  private config: JWT_CONFIG;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly accountService: AccountService,
    private readonly contactService: ContactService,
    private readonly companyService: CompanyService,
    private readonly employeeService: EmployeeService,
    private readonly permissionsService: PermissionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<JWT_CONFIG>(JWT_CONFIG);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const {
      email,
      password,
      account,
      company,
      firstName,
      lastName,
      phoneNumber,
    } = registerDto;

    if (
      !email ||
      !password ||
      !account ||
      !company ||
      !firstName ||
      !lastName
    ) {
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

    // 1. Create Account (user is owner)
    const savedAccount = await this.accountService.create(
      account.name,
      account.type,
      savedUser,
      account.settings,
    );

    // 2. Create Company (belongs to account, user is owner)
    const savedCompany = await this.companyService.create(
      company.name,
      company.sector,
      savedUser,
      undefined,
      savedAccount,
    );

    // 3. Create Employee (belongs to company, linked to user)
    const savedEmployee = await this.employeeService.create({
      firstName,
      lastName,
      email: email.trim(),
      companyId: savedCompany.id,
      userId: savedUser.id,
    });

    // 4. Link user back to employee
    await this.userRepository.update(savedUser.id, {
      employee: { id: savedEmployee.id } as any,
    });

    // 5. Create contacts
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

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userRepository.findOne({
      where: { email: email.trim() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.refreshSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
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

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const company = await this.companyService.findByOwner(user.id);

    let accountId: string | undefined = company?.account?.id;

    // Fallback: resolve account directly from user (e.g. seeded users without a company)
    if (!accountId) {
      const userWithAccount = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['account'],
      });
      accountId = userWithAccount?.account?.id;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      ...(company ? { companyId: company.id } : {}),
      ...(accountId ? { accountId } : {}),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.accessSecret,
      // Cast to satisfy typings from jsonwebtoken/ms while keeping string config values
      expiresIn: this.config.accessTokenExpirationTime as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.refreshSecret,
      // Cast to satisfy typings from jsonwebtoken/ms while keeping string config values
      expiresIn: this.config.refreshTokenExpirationTime as any,
    });

    await this.userRepository.update(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getUserPermissions(
    userId: string,
    companyId: string,
  ): Promise<Permission[]> {
    if (!companyId) return [];
    return this.permissionsService.getUserPermissions(userId, companyId);
  }
}
