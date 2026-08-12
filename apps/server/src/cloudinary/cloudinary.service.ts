import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadAvatar(fileBuffer: Buffer, fileName: string): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio/avatars',
          public_id: `${fileName}-${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message}`);
            return reject(new InternalServerErrorException('Image upload failed'));
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      uploadStream.end(fileBuffer);
    });
  }

  async uploadAvatarFromUrl(imageUrl: string): Promise<string | null> {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'portfolio/avatars',
        unique_filename: true,
      });
      this.logger.log(`Avatar uploaded from URL: ${result.secure_url}`);
      return result.secure_url;
    } catch (error: any) {
      this.logger.error(`Failed to upload avatar from URL: ${error.message}`);
      return null;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted image: ${publicId}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete image ${publicId}: ${error.message}`);
    }
  }

  async uploadProjectImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio/projects',
          public_id: `${fileName}-${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message}`);
            return reject(new InternalServerErrorException('Image upload failed'));
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });
  }
  
  async uploadCampaignImage(fileBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'portfolio/campaigns',
        public_id: `${fileName}-${Date.now()}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          this.logger.error(`Cloudinary upload failed: ${error?.message}`);
          return reject(new InternalServerErrorException('Image upload failed'));
        }
        resolve(result.secure_url);
      },
    );
    uploadStream.end(fileBuffer);
  });
}
}