import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
app.use(cookieParser());
 const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8081";
  
  app.enableCors({
    origin: [frontendUrl, "http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  });

  app.use(json({ limit: '70mb' }));
  app.use(urlencoded({ extended: true, limit: '70mb' }));
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
