import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private esClient: Client | null = null;
  private isEsAvailable = false;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

    try {
      this.esClient = new Client({
        node,
        maxRetries: 1,
        requestTimeout: 2000,
      });

      // Ping to verify status
      const isAlive = await this.esClient.ping();
      if (isAlive) {
        this.logger.log(`Successfully connected to Elasticsearch at ${node}`);
        this.isEsAvailable = true;
        await this.createProductIndex();
      } else {
        this.isEsAvailable = false;
      }
    } catch (err) {
      this.logger.warn(`Elasticsearch connection failed: ${err.message}. Falling back to standard Prisma DB search.`);
      this.isEsAvailable = false;
    }
  }

  private async createProductIndex() {
    if (!this.isEsAvailable || !this.esClient) return;

    try {
      const exists = await this.esClient.indices.exists({ index: 'products' });
      if (!exists) {
        await this.esClient.indices.create({
          index: 'products',
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              productName: { type: 'text', analyzer: 'standard' },
              category: { type: 'keyword' },
              price: { type: 'double' },
              quantity: { type: 'integer' },
              supplier: { type: 'text' },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index: "products"`);
      }
    } catch (err) {
      this.logger.error(`Error creating Elasticsearch index: ${err.message}`);
    }
  }

  async indexProduct(product: any) {
    if (this.isEsAvailable && this.esClient) {
      try {
        await this.esClient.index({
          index: 'products',
          id: product.id,
          document: {
            id: product.id,
            userId: product.userId,
            productName: product.productName,
            category: product.category,
            price: product.price,
            quantity: product.quantity,
            supplier: product.supplier,
          },
        });
        this.logger.log(`Indexed product in Elasticsearch: ${product.productName}`);
        return;
      } catch (err) {
        this.logger.warn(`Failed to index product in Elasticsearch: ${err.message}`);
      }
    }
  }

  async removeProduct(id: string) {
    if (this.isEsAvailable && this.esClient) {
      try {
        await this.esClient.delete({
          index: 'products',
          id,
        });
        this.logger.log(`Deleted product from Elasticsearch index: ${id}`);
        return;
      } catch (err) {
        this.logger.warn(`Failed to delete product from Elasticsearch index: ${err.message}`);
      }
    }
  }

  async searchProducts(userId: string, queryStr: string) {
    if (this.isEsAvailable && this.esClient && queryStr) {
      try {
        const result = await this.esClient.search({
          index: 'products',
          query: {
            bool: {
              must: [
                { term: { userId } },
                {
                  multi_match: {
                    query: queryStr,
                    fields: ['productName^3', 'category^2', 'supplier'],
                    fuzziness: 'AUTO',
                  },
                },
              ],
            },
          },
        });

        const hits = result.hits.hits;
        return hits.map((hit: any) => hit._source);
      } catch (err) {
        this.logger.warn(`Elasticsearch query failed: ${err.message}. Falling back to standard Prisma DB search.`);
      }
    }

    // Database Fallback
    const whereClause: any = { userId };
    if (queryStr) {
      whereClause.OR = [
        { productName: { contains: queryStr, mode: 'insensitive' } },
        { category: { contains: queryStr, mode: 'insensitive' } },
        { supplier: { contains: queryStr, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }
}
