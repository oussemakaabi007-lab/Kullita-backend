import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as e from 'express';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET not defined in .env');
    }

    const opts: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: e.Request) => {
          let token : string|null = null;
          if (request && request.cookies) {
            token = request.cookies['token'];
          }
          if (!token && request.headers.authorization) {
        token = request.headers.authorization.split(' ')[1];
      }
      
      return token;
        },
      ]),
      secretOrKey: secret,
    };
    super(opts);
  }

  async validate(payload: any) {
    return { userId: payload.sub, role: payload.role };
  }
}
