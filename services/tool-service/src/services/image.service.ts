import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const THUMBNAIL_SIZE = 300;

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export class ImageService {
  async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadImages(toolId: string, files: UploadedFile[]): Promise<any[]> {
    await this.ensureUploadDir();

    const images = [];

    // Check if tool already has a primary image
    const existingPrimary = await prisma.toolImage.findFirst({
      where: { toolId, isPrimary: true },
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Process and save image
      await sharp(file.buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      // Create thumbnail
      const thumbFilename = `thumb_${filename}`;
      const thumbPath = path.join(UPLOAD_DIR, thumbFilename);
      await sharp(file.buffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: 'cover',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);

      // Get file size after processing
      const stats = await fs.stat(filepath);

      // Save to database
      const image = await prisma.toolImage.create({
        data: {
          toolId,
          filename,
          originalName: file.originalname,
          mimeType: 'image/jpeg',
          size: stats.size,
          isPrimary: !existingPrimary && i === 0,
        },
      });

      images.push({
        ...image,
        url: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/${thumbFilename}`,
      });
    }

    return images;
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await prisma.toolImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Delete files
    const filepath = path.join(UPLOAD_DIR, image.filename);
    const thumbPath = path.join(UPLOAD_DIR, `thumb_${image.filename}`);

    try {
      await fs.unlink(filepath);
    } catch (e) {
      console.error('Failed to delete image file:', e);
    }

    try {
      await fs.unlink(thumbPath);
    } catch (e) {
      console.error('Failed to delete thumbnail file:', e);
    }

    // If this was the primary image, make another one primary
    if (image.isPrimary) {
      const nextImage = await prisma.toolImage.findFirst({
        where: {
          toolId: image.toolId,
          id: { not: imageId },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (nextImage) {
        await prisma.toolImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    // Delete from database
    await prisma.toolImage.delete({
      where: { id: imageId },
    });
  }

  async setPrimaryImage(toolId: string, imageId: string): Promise<void> {
    // Verify image belongs to tool
    const image = await prisma.toolImage.findFirst({
      where: { id: imageId, toolId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Remove primary from all images of this tool
    await prisma.toolImage.updateMany({
      where: { toolId },
      data: { isPrimary: false },
    });

    // Set new primary
    await prisma.toolImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async getImagesByToolId(toolId: string): Promise<any[]> {
    const images = await prisma.toolImage.findMany({
      where: { toolId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return images.map((img) => ({
      ...img,
      url: `/uploads/${img.filename}`,
      thumbnailUrl: `/uploads/thumb_${img.filename}`,
    }));
  }

  async getImageToolId(imageId: string): Promise<string | null> {
    const image = await prisma.toolImage.findUnique({
      where: { id: imageId },
      select: { toolId: true },
    });

    return image?.toolId || null;
  }
}
