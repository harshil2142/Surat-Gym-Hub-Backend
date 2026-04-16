import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { TrainerSpecialisation } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTrainerDto {
  @ApiProperty()
  @IsOptional()
  @IsEnum(TrainerSpecialisation)
  specialization?: TrainerSpecialisation;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sessionRate?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  shiftEnd?: string;
}
