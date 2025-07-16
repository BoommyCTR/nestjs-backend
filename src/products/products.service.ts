import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productModel
      .find({ name: createProductDto.name })
      .exec();

    if (!existingProduct) {
      throw new BadRequestException('Product already exists');
    }

    // user is injected in controller, but fallback for safety
    const result = new this.productModel({
      ...createProductDto,
      user: createProductDto.user,
    });
    return result.save();
  }

  async findAll(user: string): Promise<Product[]> {
    return this.productModel.find({ user: user }).exec();
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Product not found');
    }
    return { message: 'Product deleted successfully' };
  }
}
