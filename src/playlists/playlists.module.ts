import { Module } from "@nestjs/common";
import { DatabaseService } from '../common/database/database.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlaylistsService } from "./playlists.service";
import { PlaylistsController } from "./playlists.controller";

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
     controllers: [PlaylistsController],
     providers: [PlaylistsService, DatabaseService],
     exports: [PlaylistsService],
})
export class PlaylistsModule {}