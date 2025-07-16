import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Model } from 'mongoose';
import { ProductsService } from 'src/products/products.service';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly productService: ProductsService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.product) {
      throw new NotFoundException('Product ID is required');
    }
    const productResult = await this.productService.findOne(
      createOrderDto.product,
    );

    if (!productResult) {
      throw new NotFoundException('Product not found');
    }

    const existingProduct = await this.orderModel
      .find({ product: createOrderDto.product })
      .exec();

    if (!existingProduct) {
      throw new BadRequestException('Product already exists');
    }

    // user is injected in controller, but fallback for safety
    const result = new this.orderModel({
      ...createOrderDto,
      user: createOrderDto.user,
    });
    return result.save();
  }

  async findAll(user: string): Promise<Order[]> {
    return this.orderModel.find({ user: user }).populate('product').exec();
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).populate('product').exec();
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order | null> {
    return this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Order not found');
    }
    return { message: 'Order deleted successfully' };
  }
}
