import { Controller, Delete, Get, UseGuards, Req, Patch, Body,Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
@Controller('favorite')
export class FavoriteController{
    constructor(private readonly favoriteService: FavoritesService) {}
    @UseGuards(AuthGuard('jwt'))
    @Delete('del')
    remove(@Req() req,@Body("songId") songId:number){
        return this.favoriteService.remove(req.user.userId,songId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Post('add')
    add(@Req() req,@Body("songId") songId:number){
        return this.favoriteService.add(req.user.userId,songId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('fav')
    allFav(@Req() req){
        return this.favoriteService.allFav(req.user.userId);
    }

}