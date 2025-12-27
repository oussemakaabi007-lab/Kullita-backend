import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { title } from 'process';

@Injectable()
export class SongsService {
  constructor(private db: DatabaseService, private jwt: JwtService) {}
  async home(userId:number){
   const [recent, trending,weekly] = await Promise.all([
    this.findRecentPlays(userId,10,0),
    this.findTrendingPlays(userId,10,0),
    this.weeklySongs(userId,10,0)
  ]);
  return [{id:'week',title:'Released this week',items:weekly}, trending,recent];
  }
  async addPlayHistory(userId:number ,songId :number){
    await this.db.query(`insert into "playhistory" ("user_id","song_id","played_at") values($1,$2,now()) RETURNING *`,[userId,songId]);
    return {added:true}
  }
  async findRecentPlays(userId:number,limit:number=10,offset:number=0){
    const res=await this.db.query(`
    SELECT
    T1.song_id as id,
    T1.played_at,
    T2.title,
    T4.name AS artist_name,
    T2."audioUrl",
    T2."coverUrl",
    T2."createdAt",
    CASE
        WHEN T3."songId" IS NOT NULL THEN TRUE
        ELSE FALSE
    END AS "isFavorite"
FROM (
    SELECT
        ph.*,
        ROW_NUMBER() OVER(
            PARTITION BY ph.song_id 
            ORDER BY ph.played_at DESC
        ) AS rn
    FROM 
        PlayHistory ph
    WHERE
        ph.user_id = $1
) T1
JOIN
    "Song" T2 ON T1.song_id = T2.id
JOIN 
    "User" T4 ON T2."artistId" = T4.id
LEFT JOIN
    "Favorite" T3 ON T1.song_id = T3."songId" 
               AND T3."userId" = $1
WHERE
    T1.rn = 1
ORDER BY
    T1.played_at DESC
LIMIT $2 OFFSET $3;
    `, [userId,limit,offset]);
    return {
    id: 'recent',
    title: 'Recently played',
    items: res.rows 
  };
  }
  async findTrendingPlays(userId: number,limit:number=10, offset:number=0) {
  const res = await this.db.query(`
    SELECT
      T2.id,
      T2.title,
      T4.name AS artist,
      T2."coverUrl",
      T2."audioUrl",
      T2."createdAt",
      COUNT(ph.id) AS play_count,
      CASE
          WHEN T3."songId" IS NOT NULL THEN TRUE
          ELSE FALSE
      END AS "isFavorite"
    FROM "Song" T2
    JOIN PlayHistory ph ON T2.id = ph.song_id
    JOIN "User" T4 ON T2."artistId" = T4.id
    LEFT JOIN "Favorite" T3 ON T2.id = T3."songId" AND T3."userId" = $1
    WHERE ph.played_at > NOW() - INTERVAL '7 days'
    GROUP BY T2.id, T4.name, T3."songId"
    ORDER BY play_count DESC
    LIMIT $2 OFFSET $3;
  `, [userId,limit,offset]);

  return {
    id: 'trending',
    title: 'Trending now',
    items: res.rows
  };
}
async searchSongs(query: string, userId: number) {
  const searchTerm = `%${query}%`;
  
  const sql = `
    SELECT
      T2.id,
      T2.title,
      T4.name AS artist,
      T2."coverUrl",
      T2."audioUrl",
      T2."createdAt",
      CASE
          WHEN T3."songId" IS NOT NULL THEN TRUE
          ELSE FALSE
      END AS "isFavorite"
    FROM "Song" T2
    JOIN "User" T4 ON T2."artistId" = T4.id
    LEFT JOIN "Favorite" T3 ON T2.id = T3."songId" AND T3."userId" = $2
    WHERE T2.title ILIKE $1 OR T4.name ILIKE $1
    LIMIT 30;
  `;

  const res = await this.db.query(sql, [searchTerm, userId]);
  return { songs: res.rows };
}
async weeklySongs(userId: number, limit: number = 10, offset: number = 0) {
  const query = `
    SELECT
    T2.id,
    T2.title,
    T4.name AS artist,
    T2."coverUrl",
    T2."audioUrl",
    T2."createdAt",
    EXISTS (
        SELECT 1 FROM "Favorite" T3 
        WHERE T3."songId" = T2.id AND T3."userId" = $1
    ) AS "isFavorite"
FROM "Song" T2
JOIN "User" T4 ON T2."artistId" = T4.id
WHERE T2."createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY T2."createdAt" DESC
LIMIT $2 OFFSET $3;
  `;
  const res = await this.db.query(query, [userId, limit, offset]);
  return res.rows;
}
  async artistSongs(artistId: number) {
  const res = await this.db.query(`
    SELECT 
      s.id, 
      s.title, 
      s."coverUrl", 
      s."audioUrl",
      s."createdAt",
      COUNT(ph.id)::int AS "listenCount"
    FROM "Song" s
    LEFT JOIN PlayHistory ph ON s.id = ph.song_id
    WHERE s."artistId" = $1
    GROUP BY s.id
    ORDER BY s."createdAt" DESC
  `, [artistId]);
  return res.rows; 
}
  async delteSong(songId:number){
    await this.db.query(`delete from "Song" where id=$1`,[songId]);
    return {deleted:true}
  }
  async createSong(songData: { title: string; audioUrl: string; coverUrl: string; artistId: number }) {
    const { title, audioUrl, coverUrl, artistId } = songData;
    const res = await this.db.query(
      `INSERT INTO "Song" ("title", "audioUrl", "coverUrl", "artistId", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, now(), now()) 
       RETURNING *`,
      [title, audioUrl, coverUrl, artistId]
    );
    return res.rows[0];
  }
  async findOne(songId: number) {
  const query = `
    SELECT id, title, "audioUrl", "coverUrl", "artistId" 
    FROM "Song" 
    WHERE id = $1;
  `;
  const res = await this.db.query(query, [songId]);
  return res.rows.length > 0 ? res.rows[0] : null;
}
async updateSong(id: number, data: any) {
  const fields: string[] = []; 
  const values: any[] = []; 
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      fields.push(`"${key}" = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (fields.length === 0) return;

  values.push(id); 
  const query = `
    UPDATE "Song" 
    SET ${fields.join(', ')} 
    WHERE id = $${i} 
    RETURNING *;
  `;

  const res = await this.db.query(query, values);
  return res.rows[0];
}
}