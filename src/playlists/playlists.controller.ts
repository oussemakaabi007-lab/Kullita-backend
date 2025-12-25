import { Controller, Delete, Get, UseGuards, Req, Patch, Body,Post, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlaylistsService } from './playlists.service';
@Controller('playlist')
export class PlaylistsController {
    constructor(private readonly playlistsService: PlaylistsService) {}
     @UseGuards(AuthGuard('jwt'))
    @Post('create')
    createPlaylist(@Req() req,@Body("name") name:string){
        return this.playlistsService.createPlaylist(req.user.userId,name);
    }
     @UseGuards(AuthGuard('jwt'))
    @Get('showAll')
    showPlaylists(@Req() req){
        return this.playlistsService.showAllPlaylist(req.user.userId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Delete('delete')
    deletePlaylist(@Body("playlistId") playlistId:number){
        return this.playlistsService.deletePlaylist(playlistId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Patch('edit')
    editPlaylist(@Body("playlistId") playlistId:number,@Body("newname") name:string){
        return this.playlistsService.editPlaylist(playlistId,name);
    }
    @UseGuards(AuthGuard('jwt'))
    @Post('addsong')
    addSongToPlaylist(@Body("playlistId") playlistId:number,@Body("songId") songId:number){
        return this.playlistsService.addSongToPlaylist(playlistId,songId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('getsongs')
    songsInPlaylist(@Query('playlistId') playlistId:number,@Req() req){
        return this.playlistsService.getSongsInPlaylist(playlistId,req.user.userId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Delete('removesong')
async removeSong(@Body() body: { playlistId: number; songId: number }) {
  return this.playlistsService.removeSongFromPlaylist(body.playlistId, body.songId);
}
}