import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthController } from './auth.controller.js';

@Module({
  controllers: [UsersController, AuthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
