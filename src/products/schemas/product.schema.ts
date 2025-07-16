import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true ,unique: true})
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
