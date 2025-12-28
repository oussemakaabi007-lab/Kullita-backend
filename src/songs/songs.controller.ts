import { Controller, Delete, Get, UseGuards, Req, Patch, Body ,Post, Query, UseInterceptors, UploadedFiles, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SongsService } from './songs.service';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Controller('songs')

export class SongsController {
    constructor(private readonly songsService: SongsService ,private readonly cloudinaryService: CloudinaryService) {}
    @UseGuards(AuthGuard('jwt'))
    @Get('home')
    findAll(@Req() req:any) {
        return this.songsService.home(req.user.userId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Post('add_playhistory')
    addPlayHistory(@Req() req:any, @Body('songId') songId:number) {
        return this.songsService.addPlayHistory(req.user.userId, songId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('recent')
    showRecent(
  @Req() req, 
  @Query('limit') limit: number = 10, 
  @Query('offset') offset: number = 0
) {
        return this.songsService.findRecentPlays(req.user.userId,limit,offset);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('trending')
    showTrends(
  @Req() req, 
  @Query('limit') limit: number = 10, 
  @Query('offset') offset: number = 0
) {
        return this.songsService.findTrendingPlays(req.user.userId,limit,offset);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('search')
   async search(
  @Query('q') query: string, 
  @Query('limit') limit: number = 30, 
  @Query('offset') offset: number = 0, 
  @Req() req: any
) {
  if (!query) return { songs: [] };

  return this.songsService.searchSongs(
    query, 
    req.user.userId, 
    Number(limit), 
    Number(offset)
  );
}
    @UseGuards(AuthGuard('jwt'))
    @Get('thisweek')
    showThisWeek( @Req() req, 
  @Query('limit') limit: number = 10, 
  @Query('offset') offset: number = 0
) {
        return this.songsService.weeklySongs(req.user.userId,limit,offset);
    }
    @UseGuards(AuthGuard('jwt'))
    @Get('mysongs')
    showMySongs(@Req() req:any) {
        return this.songsService.artistSongs(req.user.userId);
    }
    @UseGuards(AuthGuard('jwt'))
    @Delete('deletemysong')
    async deleteMySong(@Req() req,@Body('songId') songId: number) {
    const song = await this.songsService.findOne(songId);
    if (!song) throw new NotFoundException('Song not found');
    if (song.artistId !== req.user.userId) {
    throw new ForbiddenException("You don't own this song!");
}
    const getPublicId = (url: string) => {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        return `music_app/${fileName.split('.')[0]}`;
    };

    try {
        const audioId = getPublicId(song.audioUrl);
        const coverId = getPublicId(song.coverUrl);
        await this.cloudinaryService.deleteFile(audioId, 'video');
        await this.cloudinaryService.deleteFile(coverId, 'image');
        return this.songsService.delteSong(songId);
    } catch (err) {
        console.error("Cloudinary delete failed, but proceeding with DB delete", err);
        return this.songsService.delteSong(songId);
    }
}
    @UseGuards(AuthGuard('jwt'))
    @Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]))
async uploadSong(
  @UploadedFiles() files: { audio?: Express.Multer.File[], cover?: Express.Multer.File[] },
  @Body('title') title: string,@Req() req:any
) {
  if (!files.audio || !files.cover) {
    throw new BadRequestException('Both audio and cover image are required');
  }
try {
            const audioUrl = await this.cloudinaryService.uploadFile(files.audio[0], 'video');
            const coverUrl = await this.cloudinaryService.uploadFile(files.cover[0], 'image');
            return await this.songsService.createSong({
                title,
                audioUrl,
                coverUrl,
                artistId: req.user.userId,
            });
        } catch (error) {
            throw new BadRequestException('Upload failed: ' + error.message);
        }
}
@UseGuards(AuthGuard('jwt'))
@Patch('edit')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]))
async editSong(
  @UploadedFiles() files: { audio?: Express.Multer.File[], cover?: Express.Multer.File[] },
  @Body() body: { title: string; songId: string }
) {
  const id = parseInt(body.songId);
  const existingSong = await this.songsService.findOne(id);
  if (!existingSong) throw new NotFoundException('Song not found');

  const updateData: any = { title: body.title };
    const getPublicId = (url: string) => {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        return `music_app/${fileName.split('.')[0]}`;
    };
  if (files?.audio?.[0]) {
    const oldAudioId = getPublicId(existingSong.audioUrl);
    await this.cloudinaryService.deleteFile(oldAudioId, 'video');
    const newAudio = await this.cloudinaryService.uploadFile(files.audio[0], 'video');
    updateData.audioUrl = newAudio;
  }
  if (files?.cover?.[0]) {
    const oldCoverId = getPublicId(existingSong.coverUrl);
    await this.cloudinaryService.deleteFile(oldCoverId, 'image');
    const newCover = await this.cloudinaryService.uploadFile(files.cover[0], 'image');
    updateData.coverUrl = newCover;
  }
  return this.songsService.updateSong(id, updateData);
}
}