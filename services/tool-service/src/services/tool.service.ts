import { PrismaClient } from '@prisma/client';
import type { Tool, CreateToolDto, ToolCategory, ToolCondition, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

interface ToolFilters {
  neighborhoodId?: string;
  ownerId?: string;
  category?: ToolCategory;
  condition?: ToolCondition;
  isAvailable?: boolean;
  search?: string;
}

interface UpdateToolDto {
  name?: string;
  description?: string;
  category?: ToolCategory;
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
      where.category = filters.category;
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
    const tool = await prisma.tool.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        condition: dto.condition,
        neighborhoodId: dto.neighborhoodId,
        ownerId,
      },
      include: {
        images: true,
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
      },
    });

    if (!tool) return null;

    return this.mapToResponse(tool);
  }

  async updateTool(id: string, dto: UpdateToolDto): Promise<Tool> {
    const tool = await prisma.tool.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.condition && { condition: dto.condition }),
      },
      include: {
        images: true,
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
      category: tool.category,
      condition: tool.condition,
      ownerId: tool.ownerId,
      neighborhoodId: tool.neighborhoodId,
      imageUrl,
      isAvailable: tool.isAvailable,
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt,
    };
  }
}
