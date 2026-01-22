import { PrismaClient } from '@prisma/client';
import type { Language } from '@neighbortools/shared-types';

const prisma = new PrismaClient();

interface CreateCategoryDto {
  key: string;
  nameEn: string;
  nameDe: string;
  nameEs: string;
  nameFr: string;
  icon?: string;
  sortOrder?: number;
}

interface UpdateCategoryDto {
  nameEn?: string;
  nameDe?: string;
  nameEs?: string;
  nameFr?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class CategoryService {
  async listCategories(language: Language = 'EN'): Promise<any[]> {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      key: cat.key,
      name: this.getNameByLanguage(cat, language),
      icon: cat.icon,
      sortOrder: cat.sortOrder,
    }));
  }

  async getCategoryById(id: string): Promise<any | null> {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) return null;

    return {
      id: category.id,
      key: category.key,
      names: {
        en: category.nameEn,
        de: category.nameDe,
        es: category.nameEs,
        fr: category.nameFr,
      },
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }

  async createCategory(dto: CreateCategoryDto): Promise<any> {
    const category = await prisma.category.create({
      data: {
        key: dto.key.toUpperCase(),
        nameEn: dto.nameEn,
        nameDe: dto.nameDe,
        nameEs: dto.nameEs,
        nameFr: dto.nameFr,
        icon: dto.icon,
        sortOrder: dto.sortOrder || 0,
      },
    });

    return this.getCategoryById(category.id);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<any> {
    await prisma.category.update({
      where: { id },
      data: {
        ...(dto.nameEn && { nameEn: dto.nameEn }),
        ...(dto.nameDe && { nameDe: dto.nameDe }),
        ...(dto.nameEs && { nameEs: dto.nameEs }),
        ...(dto.nameFr && { nameFr: dto.nameFr }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id },
    });
  }

  private getNameByLanguage(category: any, language: Language): string {
    switch (language) {
      case 'DE':
        return category.nameDe;
      case 'ES':
        return category.nameEs;
      case 'FR':
        return category.nameFr;
      default:
        return category.nameEn;
    }
  }
}
