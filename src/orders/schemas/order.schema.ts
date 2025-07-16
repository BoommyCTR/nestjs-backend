import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, unique: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
