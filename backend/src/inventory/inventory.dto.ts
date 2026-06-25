export class CreateProductDto {
  productName!: string;
  category!: string;
  price!: number;
  quantity!: number;
  supplier!: string;
}

export class UpdateProductDto {
  productName?: string;
  category?: string;
  price?: number;
  quantity?: number;
  supplier?: string;
}
