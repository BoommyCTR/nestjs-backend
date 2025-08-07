import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Campaigns, CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Model } from 'mongoose';
import { ProductsService } from 'src/products/products.service';
import { UpdateOrderDto } from './dto/update-order.dto';

export function numberWithCommas(
  value: number | undefined,
): string | undefined {
  return value?.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly productService: ProductsService,
  ) {}

  totalAmount(items: any[]) {
    return items.reduce((acc, item) => acc + item.product.price, 0);
  }

  async applyDiscounts(user: string, campaigns: Campaigns): Promise<any> {
    const discountCart: {
      campaigns: string;
      discount: string;
    }[] = [];

    // Fetch all orders for the user and populate product details
    const temp = await this.orderModel
      .find({ user: user })
      .populate('product')
      .exec();

    let items = [
      ...temp.map((item) => {
        // Ensure product is populated and has price
        const product: any = item.product;
        if (!product || typeof product.price !== 'number') {
          throw new BadRequestException(
            'Product is not populated or missing price',
          );
        }
        return {
          ...item.toObject(),
          product: {
            ...product.toObject(),
            price: product.price * item.quantity,
          },
          oldPrice: product.price * item.quantity,
        };
      }),
    ];
    let total = this.totalAmount(items);

    let discount = 0;

    // Coupon
    if (campaigns?.Coupon) {
      const coupon = campaigns.Coupon;
      if (coupon.type === 'Amount') {
        if (campaigns.On_Top && campaigns.On_Top.type === 'Percentage') {
          const totalBefore = total;
          items = items.map((item) => {
            const weight = item.product.price / totalBefore;
            const discountAmount = weight * coupon.discount;
            discount += discountAmount;
            return {
              ...item,
              discountFixCoupon: `-${numberWithCommas(
                parseFloat(
                  String(Math.min(item.product.price, discountAmount)),
                ),
              )}`,
              product: {
                ...item.product,
                price: Math.max(0, item.product.price - discountAmount),
              },
            };
          });
          total = this.totalAmount(items);
        } else {
          total -= coupon.discount;
          discount += coupon.discount;
          discountCart.push({
            campaigns: 'Discount Fixed amount',
            discount: `${numberWithCommas(coupon.discount)}`,
          });
        }
      }
      if (coupon.type === 'Percentage') {
        if (campaigns.On_Top && campaigns.On_Top.type === 'Percentage') {
          items = items.map((item) => {
            const discountAmount = item.product.price * (coupon.discount / 100);
            discount += discountAmount;
            return {
              ...item,
              discountPercentCoupon: `-${numberWithCommas(
                Math.min(item.product.price, discountAmount),
              )} (${numberWithCommas(coupon.discount)}%)`,
              product: {
                ...item.product,
                price: Math.max(0, item.product.price - discountAmount),
              },
            };
          });
          total = this.totalAmount(items);
        } else {
          const discountAmount = total * (coupon.discount / 100);
          total -= discountAmount;
          discount += discountAmount;
          discountCart.push({
            campaigns: `Discount Percentage discount (${numberWithCommas(
              coupon.discount,
            )}%)`,
            discount: `${numberWithCommas(discountAmount)}`,
          });
        }
      }
    }

    // On Top
    if (campaigns?.On_Top) {
      const onTop = campaigns.On_Top;
      if (onTop.type === 'Percentage' && onTop.category) {
        items = items.map((item) => {
          if (item.product.category === onTop.category) {
            const discountAmount = item.product.price * (onTop.discount / 100);
            discount += discountAmount;
            return {
              ...item,
              discountPercentOnTop: `-${numberWithCommas(
                Math.min(item.product.price, discountAmount),
              )} (${numberWithCommas(onTop.discount)}%)`,
              product: {
                ...item.product,
                price: Math.max(0, item.product.price - discountAmount),
              },
            };
          }
          return item;
        });
        total = this.totalAmount(items);
      }
      if (onTop.type === 'Points') {
        const maxDiscount = Math.floor(total * 0.2);
        const minDiscount = Math.min(maxDiscount, onTop.discount);
        total -= minDiscount;
        discount += minDiscount;
        discountCart.push({
          campaigns: 'Discount by points (capped at 20%)',
          discount: `${numberWithCommas(minDiscount)}`,
        });
      }
    }

    // Seasonal
    if (campaigns?.Seasonal) {
      const seasonal = campaigns.Seasonal;
      if (seasonal.type === 'Every' && seasonal.every) {
        const times = Math.floor(total / seasonal.every);
        const discountAmount = times * seasonal.discount;
        total -= discountAmount;
        discount += discountAmount;
        discountCart.push({
          campaigns: `Discount Special campaigns (${numberWithCommas(
            seasonal.discount,
          )} at every ${numberWithCommas(seasonal.every)})`,
          discount: `${numberWithCommas(discountAmount)}`,
        });
      }
    }

    return {
      final: parseFloat(Math.max(0, total).toFixed(2)),
      discountCart,
      itemized: items,
      category: campaigns?.On_Top && campaigns.On_Top.category,
      discount: discount,
    };
  }

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
