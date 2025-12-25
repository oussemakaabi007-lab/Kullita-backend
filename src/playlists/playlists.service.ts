import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class PlaylistsService{
    constructor(private db: DatabaseService, private jwt: JwtService) {}
    async createPlaylist(userId:number ,name :string){
        const res=await this.db.query(`insert into "Playlist" ("userId","name","createdAt","updatedAt") values($1,$2,now(),now()) RETURNING *`,[userId,name]);
        return {sucsess:true,playlist:res.rows[0]};
    }
    async showAllPlaylist(userId:number){
        const res=await this.db.query(`SELECT * FROM "Playlist" WHERE "userId"=$1`, [userId]);
         const usernames=await this.db.query(`SELECT name FROM "User" where id=$1`, [userId]);
        return {username:usernames.rows[0].name,
            playlists:res.rows};
    }
    async deletePlaylist(playlistId:number){
        await this.db.query(`delete from "Playlist" where id=$1`,[playlistId]);
        return {deleted:true}
    }
    async editPlaylist(playlistId:number ,name :string){
        const res=await this.db.query(`update "Playlist" set "name"=$2,"updatedAt"=now() where id=$1 RETURNING *`,[playlistId,name]);
        return {sucsess:true,playlist:res.rows[0]};
    }
    async addSongToPlaylist(playlistId:number ,songId :number){
    const check = await this.db.query(
        `SELECT 1 FROM "PlaylistSong" WHERE "playlistId" = $1 AND "songId" = $2`,
        [playlistId, songId]
    );

    if (check.rows.length > 0) {
        return { added: false, message: "Song already exists" };
    }
    const res = await this.db.query(
        `INSERT INTO "PlaylistSong" ("playlistId", "songId", "addedAt") 
         VALUES ($1, $2, now()) 
         RETURNING *`,
        [playlistId, songId]
    );
    
    return { added: true, entry: res.rows[0] };
}
async getSongsInPlaylist(playlistId: number, userId: number) {
    const query = `
      SELECT
        T2.id,
        T2.title,
        T4.name AS artist,
        T2."coverUrl",
        T2."audioUrl",
        CASE
            WHEN T3."songId" IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS "isFavorite"
      FROM "PlaylistSong" T1
      JOIN "Song" T2 ON T1."songId" = T2.id
      JOIN "User" T4 ON T2."artistId" = T4.id
      LEFT JOIN "Favorite" T3 ON T2.id = T3."songId" AND T3."userId" = $2
      WHERE T1."playlistId" = $1
      ORDER BY T1."addedAt" DESC;
    `;

    const res = await this.db.query(query, [playlistId, userId]);
    return {songs:res.rows};
}   
async removeSongFromPlaylist(playlistId: number, songId: number) {
    await this.db.query(
        `DELETE FROM "PlaylistSong" 
         WHERE "playlistId" = $1 AND "songId" = $2`,
        [playlistId, songId]
    );
    return { removed: true };
}
    }