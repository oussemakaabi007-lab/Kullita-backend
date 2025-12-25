import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements  OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      host: configService.get('DB_HOST'),
      port: Number(configService.get('DB_PORT')),
      user: configService.get('DB_USER'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_NAME'),
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }
}
