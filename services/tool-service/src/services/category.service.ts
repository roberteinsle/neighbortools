import { PrismaClient } from '@prisma/client';
import type { Language } from '@neighbortools/shared-types';

const prisma = new PrismaClient();

interface CreateCategoryDto {
  key: string;
  nameEn: string;
  nameDe?: string;
  nameEs?: string;
  nameFr?: string;
  emoji?: string;
  parentId?: string;
  googleId?: number;
  sortOrder?: number;
}

interface UpdateCategoryDto {
  nameEn?: string;
  nameDe?: string;
  nameEs?: string;
  nameFr?: string;
  emoji?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface CategoryWithChildren {
  id: string;
  key: string;
  name: string;
  emoji: string | null;
  toolCount: number;
  children: CategoryWithChildren[];
}

// Default categories for tool sharing with emojis
const DEFAULT_CATEGORIES = [
  {
    key: 'HAND_TOOLS',
    nameEn: 'Hand Tools',
    nameDe: 'Handwerkzeuge',
    nameEs: 'Herramientas Manuales',
    nameFr: 'Outils à Main',
    emoji: '🔨',
    sortOrder: 1,
    children: [
      { key: 'HAMMERS', nameEn: 'Hammers', nameDe: 'Hämmer', nameEs: 'Martillos', nameFr: 'Marteaux', emoji: '🔨' },
      { key: 'SCREWDRIVERS', nameEn: 'Screwdrivers', nameDe: 'Schraubendreher', nameEs: 'Destornilladores', nameFr: 'Tournevis', emoji: '🪛' },
      { key: 'WRENCHES', nameEn: 'Wrenches & Spanners', nameDe: 'Schraubenschlüssel', nameEs: 'Llaves', nameFr: 'Clés', emoji: '🔧' },
      { key: 'PLIERS', nameEn: 'Pliers', nameDe: 'Zangen', nameEs: 'Alicates', nameFr: 'Pinces', emoji: '🪚' },
      { key: 'SAWS_HAND', nameEn: 'Hand Saws', nameDe: 'Handsägen', nameEs: 'Sierras de Mano', nameFr: 'Scies à Main', emoji: '🪚' },
      { key: 'MEASURING', nameEn: 'Measuring Tools', nameDe: 'Messwerkzeuge', nameEs: 'Herramientas de Medición', nameFr: 'Outils de Mesure', emoji: '📏' },
    ],
  },
  {
    key: 'POWER_TOOLS',
    nameEn: 'Power Tools',
    nameDe: 'Elektrowerkzeuge',
    nameEs: 'Herramientas Eléctricas',
    nameFr: 'Outils Électriques',
    emoji: '⚡',
    sortOrder: 2,
    children: [
      { key: 'DRILLS', nameEn: 'Drills', nameDe: 'Bohrmaschinen', nameEs: 'Taladros', nameFr: 'Perceuses', emoji: '🔌' },
      { key: 'SAWS_POWER', nameEn: 'Power Saws', nameDe: 'Elektrosägen', nameEs: 'Sierras Eléctricas', nameFr: 'Scies Électriques', emoji: '⚡' },
      { key: 'SANDERS', nameEn: 'Sanders', nameDe: 'Schleifmaschinen', nameEs: 'Lijadoras', nameFr: 'Ponceuses', emoji: '🔧' },
      { key: 'GRINDERS', nameEn: 'Grinders', nameDe: 'Schleifer', nameEs: 'Amoladoras', nameFr: 'Meuleuses', emoji: '⚙️' },
      { key: 'ROUTERS', nameEn: 'Routers', nameDe: 'Oberfräsen', nameEs: 'Fresadoras', nameFr: 'Défonceuses', emoji: '🔧' },
    ],
  },
  {
    key: 'GARDEN_OUTDOOR',
    nameEn: 'Garden & Outdoor',
    nameDe: 'Garten & Außen',
    nameEs: 'Jardín y Exteriores',
    nameFr: 'Jardin et Extérieur',
    emoji: '🌿',
    sortOrder: 3,
    children: [
      { key: 'LAWN_CARE', nameEn: 'Lawn Care', nameDe: 'Rasenpflege', nameEs: 'Cuidado del Césped', nameFr: 'Entretien de Pelouse', emoji: '🌱' },
      { key: 'PRUNING', nameEn: 'Pruning & Cutting', nameDe: 'Schneiden', nameEs: 'Poda', nameFr: 'Taille', emoji: '✂️' },
      { key: 'DIGGING', nameEn: 'Digging Tools', nameDe: 'Grabwerkzeuge', nameEs: 'Herramientas de Excavación', nameFr: 'Outils de Creusage', emoji: '⛏️' },
      { key: 'WATERING', nameEn: 'Watering', nameDe: 'Bewässerung', nameEs: 'Riego', nameFr: 'Arrosage', emoji: '💧' },
      { key: 'LEAF_BLOWERS', nameEn: 'Leaf Blowers', nameDe: 'Laubbläser', nameEs: 'Sopladores de Hojas', nameFr: 'Souffleurs de Feuilles', emoji: '🍂' },
    ],
  },
  {
    key: 'AUTOMOTIVE',
    nameEn: 'Automotive',
    nameDe: 'Automobil',
    nameEs: 'Automotriz',
    nameFr: 'Automobile',
    emoji: '🚗',
    sortOrder: 4,
    children: [
      { key: 'CAR_JACKS', nameEn: 'Car Jacks & Stands', nameDe: 'Wagenheber', nameEs: 'Gatos de Coche', nameFr: 'Crics', emoji: '🔧' },
      { key: 'TIRE_TOOLS', nameEn: 'Tire Tools', nameDe: 'Reifenwerkzeuge', nameEs: 'Herramientas de Neumáticos', nameFr: 'Outils pour Pneus', emoji: '🛞' },
      { key: 'DIAGNOSTIC', nameEn: 'Diagnostic Tools', nameDe: 'Diagnosewerkzeuge', nameEs: 'Herramientas de Diagnóstico', nameFr: 'Outils de Diagnostic', emoji: '🔍' },
    ],
  },
  {
    key: 'CLEANING',
    nameEn: 'Cleaning',
    nameDe: 'Reinigung',
    nameEs: 'Limpieza',
    nameFr: 'Nettoyage',
    emoji: '🧹',
    sortOrder: 5,
    children: [
      { key: 'PRESSURE_WASHERS', nameEn: 'Pressure Washers', nameDe: 'Hochdruckreiniger', nameEs: 'Hidrolimpiadoras', nameFr: 'Nettoyeurs Haute Pression', emoji: '💦' },
      { key: 'VACUUMS', nameEn: 'Vacuums', nameDe: 'Staubsauger', nameEs: 'Aspiradoras', nameFr: 'Aspirateurs', emoji: '🧹' },
      { key: 'STEAM_CLEANERS', nameEn: 'Steam Cleaners', nameDe: 'Dampfreiniger', nameEs: 'Limpiadores de Vapor', nameFr: 'Nettoyeurs Vapeur', emoji: '♨️' },
    ],
  },
  {
    key: 'PAINTING',
    nameEn: 'Painting & Decorating',
    nameDe: 'Malen & Dekorieren',
    nameEs: 'Pintura y Decoración',
    nameFr: 'Peinture et Décoration',
    emoji: '🎨',
    sortOrder: 6,
    children: [
      { key: 'PAINT_SPRAYERS', nameEn: 'Paint Sprayers', nameDe: 'Farbsprühgeräte', nameEs: 'Pulverizadores de Pintura', nameFr: 'Pistolets à Peinture', emoji: '🎨' },
      { key: 'BRUSHES_ROLLERS', nameEn: 'Brushes & Rollers', nameDe: 'Pinsel & Rollen', nameEs: 'Pinceles y Rodillos', nameFr: 'Pinceaux et Rouleaux', emoji: '🖌️' },
      { key: 'WALLPAPER', nameEn: 'Wallpaper Tools', nameDe: 'Tapetenwerkzeuge', nameEs: 'Herramientas para Papel Tapiz', nameFr: 'Outils pour Papier Peint', emoji: '📜' },
    ],
  },
  {
    key: 'PLUMBING',
    nameEn: 'Plumbing',
    nameDe: 'Sanitär',
    nameEs: 'Fontanería',
    nameFr: 'Plomberie',
    emoji: '🔧',
    sortOrder: 7,
    children: [
      { key: 'PIPE_TOOLS', nameEn: 'Pipe Tools', nameDe: 'Rohrwerkzeuge', nameEs: 'Herramientas de Tuberías', nameFr: 'Outils pour Tuyaux', emoji: '🔧' },
      { key: 'DRAIN_TOOLS', nameEn: 'Drain Tools', nameDe: 'Abflusswerkzeuge', nameEs: 'Herramientas de Desagüe', nameFr: 'Outils de Drainage', emoji: '🚿' },
    ],
  },
  {
    key: 'ELECTRICAL',
    nameEn: 'Electrical',
    nameDe: 'Elektrik',
    nameEs: 'Eléctrico',
    nameFr: 'Électricité',
    emoji: '💡',
    sortOrder: 8,
    children: [
      { key: 'TESTERS', nameEn: 'Testers & Meters', nameDe: 'Prüfgeräte', nameEs: 'Probadores y Medidores', nameFr: 'Testeurs et Compteurs', emoji: '📊' },
      { key: 'WIRE_TOOLS', nameEn: 'Wire Tools', nameDe: 'Kabelwerkzeuge', nameEs: 'Herramientas de Cable', nameFr: 'Outils pour Fils', emoji: '🔌' },
    ],
  },
  {
    key: 'LADDERS_SCAFFOLDING',
    nameEn: 'Ladders & Scaffolding',
    nameDe: 'Leitern & Gerüste',
    nameEs: 'Escaleras y Andamios',
    nameFr: 'Échelles et Échafaudages',
    emoji: '🪜',
    sortOrder: 9,
    children: [
      { key: 'STEP_LADDERS', nameEn: 'Step Ladders', nameDe: 'Trittleitern', nameEs: 'Escaleras de Mano', nameFr: 'Escabeaux', emoji: '🪜' },
      { key: 'EXTENSION_LADDERS', nameEn: 'Extension Ladders', nameDe: 'Anlegeleitern', nameEs: 'Escaleras Extensibles', nameFr: 'Échelles Coulissantes', emoji: '🪜' },
    ],
  },
  {
    key: 'WOODWORKING',
    nameEn: 'Woodworking',
    nameDe: 'Holzbearbeitung',
    nameEs: 'Carpintería',
    nameFr: 'Travail du Bois',
    emoji: '🪵',
    sortOrder: 10,
    children: [
      { key: 'CLAMPS', nameEn: 'Clamps', nameDe: 'Zwingen', nameEs: 'Abrazaderas', nameFr: 'Serre-joints', emoji: '🔧' },
      { key: 'CHISELS', nameEn: 'Chisels', nameDe: 'Stechbeitel', nameEs: 'Cinceles', nameFr: 'Ciseaux à Bois', emoji: '🪓' },
      { key: 'PLANES', nameEn: 'Planes', nameDe: 'Hobel', nameEs: 'Cepillos', nameFr: 'Rabots', emoji: '🪵' },
    ],
  },
  {
    key: 'CONSTRUCTION',
    nameEn: 'Construction',
    nameDe: 'Bauwesen',
    nameEs: 'Construcción',
    nameFr: 'Construction',
    emoji: '🏗️',
    sortOrder: 11,
    children: [
      { key: 'CONCRETE_TOOLS', nameEn: 'Concrete Tools', nameDe: 'Betonwerkzeuge', nameEs: 'Herramientas de Concreto', nameFr: 'Outils à Béton', emoji: '🧱' },
      { key: 'TILE_TOOLS', nameEn: 'Tile Tools', nameDe: 'Fliesenwerkzeuge', nameEs: 'Herramientas de Azulejos', nameFr: 'Outils pour Carrelage', emoji: '🔲' },
      { key: 'LEVELS', nameEn: 'Levels', nameDe: 'Wasserwaagen', nameEs: 'Niveles', nameFr: 'Niveaux', emoji: '📐' },
    ],
  },
  {
    key: 'MOVING_LIFTING',
    nameEn: 'Moving & Lifting',
    nameDe: 'Transport & Heben',
    nameEs: 'Transporte y Elevación',
    nameFr: 'Déménagement et Levage',
    emoji: '📦',
    sortOrder: 12,
    children: [
      { key: 'DOLLIES', nameEn: 'Dollies & Hand Trucks', nameDe: 'Sackkarren', nameEs: 'Carretillas', nameFr: 'Diables', emoji: '🛒' },
      { key: 'HOISTS', nameEn: 'Hoists & Winches', nameDe: 'Hebezeuge', nameEs: 'Polipastos', nameFr: 'Palans', emoji: '⛓️' },
    ],
  },
  {
    key: 'SAFETY_EQUIPMENT',
    nameEn: 'Safety Equipment',
    nameDe: 'Sicherheitsausrüstung',
    nameEs: 'Equipo de Seguridad',
    nameFr: 'Équipement de Sécurité',
    emoji: '🦺',
    sortOrder: 13,
    children: [
      { key: 'PROTECTIVE_GEAR', nameEn: 'Protective Gear', nameDe: 'Schutzausrüstung', nameEs: 'Equipo de Protección', nameFr: 'Équipement de Protection', emoji: '🥽' },
      { key: 'FIRST_AID', nameEn: 'First Aid', nameDe: 'Erste Hilfe', nameEs: 'Primeros Auxilios', nameFr: 'Premiers Secours', emoji: '🩹' },
    ],
  },
  {
    key: 'OTHER',
    nameEn: 'Other',
    nameDe: 'Sonstiges',
    nameEs: 'Otros',
    nameFr: 'Autres',
    emoji: '📎',
    sortOrder: 99,
    children: [],
  },
];

export class CategoryService {
  async listCategories(language: Language = 'EN'): Promise<any[]> {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
      include: {
        parent: true,
        _count: {
          select: { tools: true },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      key: cat.key,
      name: this.getNameByLanguage(cat, language),
      emoji: cat.emoji,
      parentId: cat.parentId,
      level: cat.level,
      path: cat.path,
      sortOrder: cat.sortOrder,
      toolCount: cat._count.tools,
    }));
  }

  async getTopLevelCategories(language: Language = 'EN'): Promise<any[]> {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { tools: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { tools: true },
            },
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      key: cat.key,
      name: this.getNameByLanguage(cat, language),
      emoji: cat.emoji,
      sortOrder: cat.sortOrder,
      toolCount: cat._count.tools,
      children: cat.children.map((child) => ({
        id: child.id,
        key: child.key,
        name: this.getNameByLanguage(child, language),
        emoji: child.emoji,
        sortOrder: child.sortOrder,
        toolCount: child._count.tools,
      })),
    }));
  }

  async getCategoryWithChildren(id: string, language: Language = 'EN'): Promise<any | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { tools: true },
            },
          },
        },
        _count: {
          select: { tools: true },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      key: category.key,
      name: this.getNameByLanguage(category, language),
      names: {
        en: category.nameEn,
        de: category.nameDe,
        es: category.nameEs,
        fr: category.nameFr,
      },
      emoji: category.emoji,
      parentId: category.parentId,
      parent: category.parent
        ? {
            id: category.parent.id,
            key: category.parent.key,
            name: this.getNameByLanguage(category.parent, language),
            emoji: category.parent.emoji,
          }
        : null,
      level: category.level,
      path: category.path,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      toolCount: category._count.tools,
      children: category.children.map((child) => ({
        id: child.id,
        key: child.key,
        name: this.getNameByLanguage(child, language),
        emoji: child.emoji,
        sortOrder: child.sortOrder,
        toolCount: child._count.tools,
      })),
    };
  }

  async getCategoryById(id: string): Promise<any | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        _count: {
          select: { tools: true },
        },
      },
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
      emoji: category.emoji,
      parentId: category.parentId,
      level: category.level,
      path: category.path,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      toolCount: category._count.tools,
    };
  }

  async createCategory(dto: CreateCategoryDto): Promise<any> {
    let level = 0;
    let path = dto.nameEn;

    if (dto.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (parent) {
        level = parent.level + 1;
        path = parent.path ? `${parent.path} > ${dto.nameEn}` : dto.nameEn;
      }
    }

    const category = await prisma.category.create({
      data: {
        key: dto.key.toUpperCase(),
        nameEn: dto.nameEn,
        nameDe: dto.nameDe || dto.nameEn,
        nameEs: dto.nameEs || dto.nameEn,
        nameFr: dto.nameFr || dto.nameEn,
        emoji: dto.emoji,
        parentId: dto.parentId,
        googleId: dto.googleId,
        level,
        path,
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
        ...(dto.emoji !== undefined && { emoji: dto.emoji }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category has tools
    const toolCount = await prisma.tool.count({
      where: { categoryId: id },
    });

    if (toolCount > 0) {
      throw new Error('Cannot delete category with associated tools');
    }

    // Delete children first
    await prisma.category.deleteMany({
      where: { parentId: id },
    });

    await prisma.category.delete({
      where: { id },
    });
  }

  async seedDefaultCategories(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const categoryData of DEFAULT_CATEGORIES) {
      // Check if top-level category exists
      const existing = await prisma.category.findUnique({
        where: { key: categoryData.key },
      });

      if (existing) {
        skipped++;
        // Still check and create children if missing
        for (const childData of categoryData.children) {
          const existingChild = await prisma.category.findUnique({
            where: { key: childData.key },
          });

          if (!existingChild) {
            await prisma.category.create({
              data: {
                key: childData.key,
                nameEn: childData.nameEn,
                nameDe: childData.nameDe,
                nameEs: childData.nameEs,
                nameFr: childData.nameFr,
                emoji: childData.emoji,
                parentId: existing.id,
                level: 1,
                path: `${categoryData.nameEn} > ${childData.nameEn}`,
                sortOrder: categoryData.children.indexOf(childData) + 1,
              },
            });
            created++;
          } else {
            skipped++;
          }
        }
        continue;
      }

      // Create top-level category
      const parent = await prisma.category.create({
        data: {
          key: categoryData.key,
          nameEn: categoryData.nameEn,
          nameDe: categoryData.nameDe,
          nameEs: categoryData.nameEs,
          nameFr: categoryData.nameFr,
          emoji: categoryData.emoji,
          level: 0,
          path: categoryData.nameEn,
          sortOrder: categoryData.sortOrder,
        },
      });
      created++;

      // Create children
      for (let i = 0; i < categoryData.children.length; i++) {
        const childData = categoryData.children[i];
        await prisma.category.create({
          data: {
            key: childData.key,
            nameEn: childData.nameEn,
            nameDe: childData.nameDe,
            nameEs: childData.nameEs,
            nameFr: childData.nameFr,
            emoji: childData.emoji,
            parentId: parent.id,
            level: 1,
            path: `${categoryData.nameEn} > ${childData.nameEn}`,
            sortOrder: i + 1,
          },
        });
        created++;
      }
    }

    return { created, skipped };
  }

  async getToolsByCategory(
    categoryId: string,
    neighborhoodId: string,
    pagination: { page: number; pageSize: number }
  ): Promise<{ tools: any[]; total: number }> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Get the category and all its children
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (!category) {
      return { tools: [], total: 0 };
    }

    const categoryIds = [categoryId, ...category.children.map((c) => c.id)];

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where: {
          categoryId: { in: categoryIds },
          neighborhoodId,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          category: true,
        },
      }),
      prisma.tool.count({
        where: {
          categoryId: { in: categoryIds },
          neighborhoodId,
        },
      }),
    ]);

    return { tools, total };
  }

  private getNameByLanguage(category: any, language: Language): string {
    switch (language) {
      case 'DE':
        return category.nameDe || category.nameEn;
      case 'ES':
        return category.nameEs || category.nameEn;
      case 'FR':
        return category.nameFr || category.nameEn;
      default:
        return category.nameEn;
    }
  }
}
