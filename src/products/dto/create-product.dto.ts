import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly category: string;

  @IsNumber()
  readonly price: number;

  @IsOptional()
  @IsMongoId()
  readonly user?: string;
}
