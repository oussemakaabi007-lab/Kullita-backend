import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dvimfakyh',
      api_key: '651751727725752',
      api_secret: 'N_nc7dgJps8uxn2-kM6Dh8fhz-Q',
    });
  }

  async uploadFile(file: Express.Multer.File, type: 'video' | 'image'): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
          resource_type: type, 
          folder: 'music_app' 
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload result is undefined'));
          resolve(result.secure_url);
        },
      );
      upload.end(file.buffer);
    });
  }
  async deleteFile(publicId: string, type: 'video' | 'image') {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId, 
        { resource_type: type },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Destroy Error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );
    });
  }
}
