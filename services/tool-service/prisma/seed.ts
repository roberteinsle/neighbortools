import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tool database...');

  // Create default categories
  const categories = [
    {
      key: 'HAND_TOOLS',
      nameEn: 'Hand Tools',
      nameDe: 'Handwerkzeuge',
      nameEs: 'Herramientas manuales',
      nameFr: 'Outils à main',
      icon: 'hammer',
      sortOrder: 1,
    },
    {
      key: 'POWER_TOOLS',
      nameEn: 'Power Tools',
      nameDe: 'Elektrowerkzeuge',
      nameEs: 'Herramientas eléctricas',
      nameFr: 'Outils électriques',
      icon: 'drill',
      sortOrder: 2,
    },
    {
      key: 'GARDEN',
      nameEn: 'Garden Tools',
      nameDe: 'Gartenwerkzeuge',
      nameEs: 'Herramientas de jardín',
      nameFr: 'Outils de jardin',
      icon: 'shovel',
      sortOrder: 3,
    },
    {
      key: 'AUTOMOTIVE',
      nameEn: 'Automotive',
      nameDe: 'Autowerkzeuge',
      nameEs: 'Herramientas automotrices',
      nameFr: 'Outils automobiles',
      icon: 'car',
      sortOrder: 4,
    },
    {
      key: 'CLEANING',
      nameEn: 'Cleaning Equipment',
      nameDe: 'Reinigungsgeräte',
      nameEs: 'Equipos de limpieza',
      nameFr: 'Équipement de nettoyage',
      icon: 'vacuum',
      sortOrder: 5,
    },
    {
      key: 'PAINTING',
      nameEn: 'Painting Supplies',
      nameDe: 'Malerbedarf',
      nameEs: 'Suministros de pintura',
      nameFr: 'Fournitures de peinture',
      icon: 'paintbrush',
      sortOrder: 6,
    },
    {
      key: 'PLUMBING',
      nameEn: 'Plumbing Tools',
      nameDe: 'Sanitärwerkzeuge',
      nameEs: 'Herramientas de plomería',
      nameFr: 'Outils de plomberie',
      icon: 'wrench',
      sortOrder: 7,
    },
    {
      key: 'ELECTRICAL',
      nameEn: 'Electrical Tools',
      nameDe: 'Elektrowerkzeuge',
      nameEs: 'Herramientas eléctricas',
      nameFr: 'Outils électriques',
      icon: 'zap',
      sortOrder: 8,
    },
    {
      key: 'OTHER',
      nameEn: 'Other',
      nameDe: 'Sonstiges',
      nameEs: 'Otros',
      nameFr: 'Autres',
      icon: 'package',
      sortOrder: 99,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
    console.log(`Created category: ${cat.key}`);
  }

  // Create sample tools
  // Note: These use placeholder IDs - in production, real user/neighborhood IDs would be used
  const tools = [
    {
      name: 'Bosch Hammer Drill',
      description: 'Professional hammer drill, great for concrete and masonry. Includes carrying case.',
      category: 'POWER_TOOLS' as const,
      condition: 'GOOD' as const,
      ownerId: '00000000-0000-0000-0000-000000000001',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
    },
    {
      name: 'Garden Hose 50m',
      description: 'Long garden hose with spray attachment. No leaks.',
      category: 'GARDEN' as const,
      condition: 'GOOD' as const,
      ownerId: '00000000-0000-0000-0000-000000000002',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
    },
    {
      name: 'Pressure Washer',
      description: 'Kärcher pressure washer, 150 bar. Perfect for patios and cars.',
      category: 'CLEANING' as const,
      condition: 'NEW' as const,
      ownerId: '00000000-0000-0000-0000-000000000001',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
    },
    {
      name: 'Paint Sprayer',
      description: 'Electric paint sprayer for walls and fences. Very efficient.',
      category: 'PAINTING' as const,
      condition: 'FAIR' as const,
      ownerId: '00000000-0000-0000-0000-000000000003',
      neighborhoodId: '00000000-0000-0000-0000-000000000002',
    },
    {
      name: 'Socket Wrench Set',
      description: 'Complete socket wrench set in metal case. Metric and imperial sizes.',
      category: 'AUTOMOTIVE' as const,
      condition: 'GOOD' as const,
      ownerId: '00000000-0000-0000-0000-000000000002',
      neighborhoodId: '00000000-0000-0000-0000-000000000002',
    },
  ];

  for (const tool of tools) {
    const created = await prisma.tool.create({
      data: tool,
    });
    console.log(`Created tool: ${created.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
