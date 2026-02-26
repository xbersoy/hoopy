import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user/user.service';
import { AccountService } from './account/services/account.service';
import { EmployeeService } from './employee/employee.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const config = app.get(ConfigService);
    const env = config.get<string>('ENV') ?? 'development';
    console.log(`Running seed for environment: ${env}`);

    const userService = app.get(UserService);
    const accountService = app.get(AccountService);
    const employeeService = app.get(EmployeeService);

    // Basic example seed data; adjust to your needs
    const adminEmail = 'admin@admin.com';

    let admin = null;
    try {
      // Try to find existing admin user by email
      // (UserService currently exposes generic methods; if you add a findByEmail later, use that.)
      const users = await userService.findAll();
      admin = users.find((u: any) => u.email === adminEmail) ?? null;
    } catch {
      // ignore if listing users fails
    }

    if (!admin) {
      console.log('Creating initial admin user...');
      const password = 'changeme';
      admin = await userService.create({
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        firstName: 'Admin',
        lastName: 'User',
      } as any);
    } else {
      console.log('Admin user already exists; ensuring password is set to changeme.');
      await userService.update(admin.id, {
        password: await bcrypt.hash('changeme', 10),
      } as any);
    }

    // Ensure admin has an account
    try {
      console.log('Ensuring admin account exists...');
      await accountService.create('Default Account', 'PERSONAL', admin as any);
    } catch (err) {
      console.warn('Account seed step failed or already exists:', (err as Error).message);
    }

    // Optionally, create a sample employee
    try {
      console.log('Ensuring sample employee exists...');
      await employeeService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'employee@example.com',
        position: 'Engineer',
        department: 'Engineering',
      } as any);
    } catch (err) {
      console.warn('Employee seed step failed or already exists:', (err as Error).message);
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();

