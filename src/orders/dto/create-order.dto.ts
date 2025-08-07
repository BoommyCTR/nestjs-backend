import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

export class CreateApplyDiscountsDto {
  readonly selectedCampaigns: Campaigns;
}

export class Campaign {
  @IsString()
  readonly name: string;

  @IsString()
  readonly type: string;

  @IsNumber()
  readonly discount: number;

  @IsOptional()
  @IsString()
  readonly category?: string;

  @IsOptional()
  @IsNumber()
  readonly every?: number;
}

export class Campaigns {
  @IsOptional()
  readonly Coupon?: Campaign;

  @IsOptional()
  readonly On_Top?: Campaign;

  @IsOptional()
  readonly Seasonal?: Campaign;
}

export class Item {
  @IsOptional()
  @IsMongoId()
  readonly _id?: string;

  @IsString()
  readonly name: string;

  @IsString()
  readonly category: string;

  @IsNumber()
  readonly price: number;

  @IsOptional()
  @IsString()
  readonly user?: string;

  @IsOptional()
  @IsNumber()
  readonly __v?: number;
}
