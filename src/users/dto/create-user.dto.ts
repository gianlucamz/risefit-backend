import { Type } from 'class-transformer';
import {
    IsDate,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Cargo } from '../../generated/prisma/enums.js';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nome: string;

    @IsEmail()
    @MaxLength(150)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    senha: string;

    @Type(() => Date)
    @IsDate()
    dataNascimento: Date;

    @IsString()
    @MaxLength(20)
    @Matches(/^[0-9+()\-\s]+$/, { message: 'telefone inválido' })
    telefone: string;

    @IsOptional()
    @IsEnum(Cargo)
    cargo?: Cargo;
}