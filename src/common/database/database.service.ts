import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements  OnModuleDestroy {
  private pool: Pool;

 constructor(private configService: ConfigService) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      // Only use SSL if we are NOT on localhost
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }
}
