import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class FavoritesService{
    constructor(private db: DatabaseService, private jwt: JwtService) {}
    async remove(userId:number ,songId :number){
        await this.db.query(`delete from "Favorite" where "songId"=$2 and "userId"=$1`,[userId,songId]);
        return {deleted:true}
    }
    async add(userId:number ,songId :number){
        await this.db.query(`insert into "Favorite" ("userId","songId","createdAt") values($1,$2,now()) RETURNING *`,[userId,songId]);
        return {added:true}
    }
    async allFav(userId:number){
        const res=await this.db.query(`SELECT 
      T2.id, 
      T2.title, 
      T4.name AS artist, 
      T2."coverUrl", 
      T2."audioUrl", 
      T2."createdAt",
      TRUE AS "isFavorite"
    FROM "Song" T2
    JOIN "User" T4 ON T2."artistId" = T4.id
    INNER JOIN "Favorite" T3 ON T2.id = T3."songId"
    WHERE T3."userId" = $1
    ORDER BY T3."createdAt" DESC;
  `, [userId]);
        const usernames=await this.db.query(`SELECT name FROM "User" where id=$1`, [userId]);

        return {username:usernames.rows[0].name,
            songs:res.rows};
    }
}