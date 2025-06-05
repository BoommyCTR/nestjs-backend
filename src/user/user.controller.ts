import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findOne(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User already existed');
    }

    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    const user = await this.userService.findOne(req.user.email);
    if (!user) {
      return { message: 'User not found' };
    }
    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
  }
}
