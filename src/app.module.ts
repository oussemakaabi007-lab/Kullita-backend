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
  useFactory: async (configService: ConfigService) => {
    const user = configService.get('MAIL_USER');
    const clientId = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const refreshToken = configService.get('GOOGLE_REFRESH_TOKEN');

    // DEBUG: This will show in Render logs if a key is missing
    if (!user || !clientId || !clientSecret || !refreshToken) {
      console.error('MAILER ERROR: One or more Google Environment Variables are MISSING!');
    }

    return {
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: user,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
        },
      },
      defaults: {
        from: `"Kullita Support" <${user}>`,
      },
    };
  },
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
