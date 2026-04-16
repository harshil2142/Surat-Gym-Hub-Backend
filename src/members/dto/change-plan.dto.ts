import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty()
  @IsInt()
  planId!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
