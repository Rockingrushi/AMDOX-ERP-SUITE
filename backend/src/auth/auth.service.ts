import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateToken(userId: string): string {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: process.env.JWT_SECRET || 'amx_erp_jwt_secret_key_2026',
        expiresIn: '30d',
      },
    );
  }

  async register(dto: RegisterDto) {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new BadRequestException('Please add all fields');
    }

    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin', // Default to admin for seeder consistency
      },
    });

    return {
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: this.generateToken(user.id),
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestException('Please add all fields');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: this.generateToken(user.id),
    };
  }
}
