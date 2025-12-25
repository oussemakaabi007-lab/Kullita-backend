// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseService } from './common/database/database.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          }
        },connectionTimeout: 10000,
      greetingTimeout: 10000,
        defaults: {
          from: `"Kullita Support" <${configService.get('MAIL_USER')}>`,
        },
      }),
    }),
    UsersModule,
    AuthModule,
    SongsModule,
    PlaylistsModule,
    FavoritesModule,
  ],
  controllers: [AppController],
  providers: [DatabaseService],
})
export class AppModule {}
