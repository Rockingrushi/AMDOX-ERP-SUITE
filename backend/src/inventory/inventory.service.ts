import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './inventory.dto';
import { SearchService } from '../search/search.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  async findAll(userId: string, search?: string) {
    const products = await this.searchService.searchProducts(userId, search || '');

    return {
      success: true,
      count: products.length,
      data: products,
    };
  }

  async findOne(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return { success: true, data: product };
  }

  async create(userId: string, dto: CreateProductDto) {
    const { productName, category, price, quantity, supplier } = dto;

    if (!productName || !category || price === undefined || quantity === undefined || !supplier) {
      throw new BadRequestException('Please provide all fields');
    }

    const product = await this.prisma.product.create({
      data: {
        userId,
        productName,
        category,
        price: Number(price),
        quantity: Number(quantity),
        supplier,
      },
    });

    await this.searchService.indexProduct(product);

    return { success: true, data: product };
  }

  async update(id: string, userId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        productName: dto.productName,
        category: dto.category,
        price: dto.price !== undefined ? Number(dto.price) : undefined,
        quantity: dto.quantity !== undefined ? Number(dto.quantity) : undefined,
        supplier: dto.supplier,
      },
    });

    await this.searchService.indexProduct(updatedProduct);

    return { success: true, data: updatedProduct };
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    await this.searchService.removeProduct(id);

    return { success: true, message: 'Product removed successfully' };
  }
}
