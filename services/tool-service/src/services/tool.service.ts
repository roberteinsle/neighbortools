import { PrismaClient } from '@prisma/client';
import type { Tool, CreateToolDto, ToolCategory, ToolCondition, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

interface ToolFilters {
  neighborhoodId?: string;
  ownerId?: string;
  category?: string; // Can be categoryId or legacy category key
  condition?: ToolCondition;
  isAvailable?: boolean;
  search?: string;
}

interface UpdateToolDto {
  name?: string;
  description?: string;
  category?: string; // categoryId
  condition?: ToolCondition;
}

export class ToolService {
  async listTools(
    filters: ToolFilters,
    params: PaginationParams
  ): Promise<{ tools: Tool[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const where: any = {};

    if (filters.neighborhoodId) {
      where.neighborhoodId = filters.neighborhoodId;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.category) {
      // Check if it's a UUID (categoryId) or a legacy category key
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.category);
      if (isUuid) {
        // Filter by categoryId - include the category and its children
        const category = await prisma.category.findUnique({
          where: { id: filters.category },
          include: { children: true },
        });
        if (category) {
          const categoryIds = [category.id, ...category.children.map((c) => c.id)];
          where.categoryId = { in: categoryIds };
        }
      } else {
        // Legacy category enum filter
        where.categoryLegacy = filters.category;
      }
    }
    if (filters.condition) {
      where.condition = filters.condition;
    }
    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
          category: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tool.count({ where }),
    ]);

    return {
      tools: tools.map(this.mapToResponse),
      total,
    };
  }

  async createTool(ownerId: string, dto: CreateToolDto): Promise<Tool> {
    // Check if category is a UUID (new categoryId) or legacy enum
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.category);

    const tool = await prisma.tool.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: isUuid ? dto.category : null,
        categoryLegacy: !isUuid ? (dto.category as ToolCategory) : null,
        condition: dto.condition,
        neighborhoodId: dto.neighborhoodId,
        ownerId,
      },
      include: {
        images: true,
        category: true,
      },
    });

    return this.mapToResponse(tool);
  }

  async getToolById(id: string): Promise<Tool | null> {
    const tool = await prisma.tool.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        category: true,
      },
    });

    if (!tool) return null;

    return this.mapToResponse(tool);
  }

  async updateTool(id: string, dto: UpdateToolDto): Promise<Tool> {
    const updateData: any = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.condition) updateData.condition = dto.condition;

    if (dto.category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.category);
      if (isUuid) {
        updateData.categoryId = dto.category;
        updateData.categoryLegacy = null;
      } else {
        updateData.categoryLegacy = dto.category;
        updateData.categoryId = null;
      }
    }

    const tool = await prisma.tool.update({
      where: { id },
      data: updateData,
      include: {
        images: true,
        category: true,
      },
    });

    return this.mapToResponse(tool);
  }

  async deleteTool(id: string): Promise<void> {
    await prisma.tool.delete({
      where: { id },
    });
  }

  async toggleAvailability(id: string, isAvailable: boolean): Promise<Tool> {
    const tool = await prisma.tool.update({
      where: { id },
      data: { isAvailable },
      include: {
        images: true,
        category: true,
      },
    });

    return this.mapToResponse(tool);
  }

  async getToolsByNeighborhood(
    neighborhoodId: string,
    params: PaginationParams
  ): Promise<{ tools: Tool[]; total: number }> {
    return this.listTools({ neighborhoodId, isAvailable: true }, params);
  }

  async getToolsByUser(
    userId: string,
    params: PaginationParams
  ): Promise<{ tools: Tool[]; total: number }> {
    return this.listTools({ ownerId: userId }, params);
  }

  async isOwner(toolId: string, userId: string): Promise<boolean> {
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { ownerId: true },
    });

    return tool?.ownerId === userId;
  }

  async getToolOwnerId(toolId: string): Promise<string | null> {
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { ownerId: true },
    });

    return tool?.ownerId || null;
  }

  private mapToResponse(tool: any): Tool {
    const primaryImage = tool.images?.find((img: any) => img.isPrimary);
    const imageUrl = primaryImage
      ? `/uploads/${primaryImage.filename}`
      : tool.images?.[0]
        ? `/uploads/${tool.images[0].filename}`
        : undefined;

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      // Return both new categoryId/categoryData and legacy category for backwards compatibility
      category: tool.categoryLegacy || (tool.category?.key || 'OTHER'),
      categoryId: tool.categoryId,
      categoryData: tool.category ? {
        id: tool.category.id,
        key: tool.category.key,
        name: tool.category.nameEn,
        emoji: tool.category.emoji,
      } : undefined,
      condition: tool.condition,
      ownerId: tool.ownerId,
      neighborhoodId: tool.neighborhoodId,
      imageUrl,
      images: tool.images,
      isAvailable: tool.isAvailable,
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt,
    };
  }
}
