
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { UsersService } from './users.service.js';
import { createUserSchema } from './dto/create-user.dto.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { updateUserSchema } from './dto/update-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(
    @Body(new ZodValidationPipe(createUserSchema))
    dto: CreateUserDto,
  ) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body(new ZodValidationPipe(updateUserSchema))
    dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
