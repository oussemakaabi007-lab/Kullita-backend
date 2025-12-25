import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService, private jwt: JwtService) {}

 async createUser(email: string, name: string, password: string, role: 'listener' | 'artist') {
  if (!email || !name || !password || !role) throw new Error('All fields are required');

  const hashedPassword = await bcrypt.hash(password, 10);
  const checkEmail=await this.db.query(`SELECT * FROM "User" WHERE email = $1`, [email]);
  if(checkEmail.rows[0]){
    return {message:"user with this email exist"}
  } 
  const checkname=await this.db.query(`SELECT * FROM "User" WHERE name = $1`, [name]);
  if(checkname.rows[0]){
    return {message:"user with this username exist"}
  }
  const res = await this.db.query(
    'INSERT INTO "User" (email, name, password, role) VALUES ($1,$2,$3,$4) RETURNING *',
    [email, name, hashedPassword, role]
  );

  return {message:"wellcome"}}


  async findByUsername(username: string) {
    const result = await this.db.query(`SELECT * FROM "User" WHERE name = $1`, [username]);
    return result.rows[0];
  }

  async validateUser(username: string, password: string) {
    const user = await this.findByUsername(username);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    return user;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      role: user.role,
    };
  }
  async userDetails(userId:any){
      const user= await this.db.query(`SELECT * FROM "User" WHERE id = $1`, [userId]);
      return user.rows;
  }
  async deleteUser(userId: number) {
    await this.db.query(`DELETE FROM "User" WHERE id = $1`, [userId]);
    return { deleted: true };
  }
  async updateUser(userId:number ,userName:string){
      const checkuser = await this.findByUsername(userName);
      if(checkuser){
        throw new Error("username is taken");
      }
      await this.db.query(`UPDATE "User" SET name = $2 WHERE id = $1`, [userId,userName]);
       const user= await this.db.query(`SELECT * FROM "User" WHERE id = $1`, [userId]);
       const payload = { username: userName, sub: userId, role: user.rows[0].role };
      const newToken = this.jwt.sign(payload);

  return {
    message: "Profile updated",
    user: userName,
    access_token: newToken
  };
  }
  async updatePassword(userId: number, currentPass: string, newPass: string) {
  const res = await this.db.query('SELECT * FROM "User" WHERE id = $1', [userId]);
  const user = res.rows[0];

  if (!user) throw new Error('User not found');
  const isMatch = await bcrypt.compare(currentPass, user.password);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }
  const hashedNewPassword = await bcrypt.hash(newPass,10);
  await this.db.query(
    'UPDATE "User" SET password = $2 WHERE id = $1',
    [userId, hashedNewPassword]
  );

  return { message: 'Password updated successfully' };
}
async getArtistDashboardData(artistId: number) {
  const statsQuery = await this.db.query(`
    SELECT 
        COUNT(DISTINCT ph.user_id) AS "totalListeners",
        COUNT(*) AS "totalPlays"
    FROM PlayHistory ph
    JOIN "Song" s ON ph.song_id = s.id
    WHERE s."artistId" = $1
  `, [artistId]);
  const topTracksQuery = await this.db.query(`
    SELECT 
        s.id, 
        s.title, 
        s."coverUrl", 
        COUNT(ph.id) AS "listenCount"
    FROM "Song" s
    LEFT JOIN PlayHistory ph ON s.id = ph.song_id
    WHERE s."artistId" = $1
    GROUP BY s.id
    ORDER BY "listenCount" DESC
    LIMIT 3
  `, [artistId]);

  return {
    stats: {
      totalListeners: parseInt(statsQuery.rows[0].totalListeners || 0),
      totalPlays: parseInt(statsQuery.rows[0].totalPlays || 0)
    },
    topTracks: topTracksQuery.rows.map(row => ({
      ...row,
      listenCount: parseInt(row.listenCount)
    }))
  };
}
async getArtistGrowth(artistId: number) {
  const currentWeekQuery = await this.db.query(`
    SELECT COUNT(*) FROM PlayHistory ph
    JOIN "Song" s ON ph.song_id = s.id
    WHERE s."artistId" = $1 
    AND ph.played_at >= NOW() - INTERVAL '7 days'
  `, [artistId]);
  const previousWeekQuery = await this.db.query(`
    SELECT COUNT(*) FROM PlayHistory ph
    JOIN "Song" s ON ph.song_id = s.id
    WHERE s."artistId" = $1 
    AND ph.played_at >= NOW() - INTERVAL '14 days' 
    AND ph.played_at < NOW() - INTERVAL '7 days'
  `, [artistId]);

  const current = parseInt(currentWeekQuery.rows[0].count);
  const previous = parseInt(previousWeekQuery.rows[0].count);
  if (previous === 0) return current > 0 ? 25 : 0;
  
  const growth = ((current - previous) / previous);
  return {growth: Math.round(growth)}; 
}
}