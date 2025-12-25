import { Module } from "@nestjs/common";
import { SongsService } from "./songs.service";     // 1. IMPORT the service
import { SongsController } from "./songs.controller";
import { DatabaseService } from '../common/database/database.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

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
     controllers: [SongsController],
     providers: [SongsService, DatabaseService, CloudinaryService],
     exports: [SongsService],
})
export class SongsModule {}