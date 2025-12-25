import { Module } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { FavoriteController } from "./favorites.controller";
import { DatabaseService } from '../common/database/database.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
       ConfigModule,
       JwtModule.registerAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           secret: config.get<string>('JWT_SECRET')!,
           signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
         }),
       }),
     ],
     controllers: [FavoriteController],
     providers: [FavoritesService, DatabaseService],
     exports: [FavoritesService],
})
export class FavoritesModule {}