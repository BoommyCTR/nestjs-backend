import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsMongoId()
  readonly product?: string;

  @IsNumber()
  @Min(1)
  readonly quantity: number = 1;

  @IsOptional()
  @IsMongoId()
  readonly user?: string;
}
