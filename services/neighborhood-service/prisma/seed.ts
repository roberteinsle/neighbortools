import { PrismaClient } from '@prisma/client';
import { generateInviteCode } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding neighborhood database...');

  // Create sample neighborhoods
  // Note: User IDs would typically come from the user service
  // These are placeholder UUIDs for testing

  const neighborhoods = [
    {
      name: 'Sunny Valley',
      description: 'A friendly neighborhood in the sunny part of town',
      inviteCode: generateInviteCode(8),
      createdBy: '00000000-0000-0000-0000-000000000001', // Placeholder admin user ID
    },
    {
      name: 'Green Hills',
      description: 'Eco-friendly community with lots of gardens',
      inviteCode: generateInviteCode(8),
      createdBy: '00000000-0000-0000-0000-000000000002', // Placeholder user ID
    },
    {
      name: 'Downtown Central',
      description: 'Urban neighborhood in the city center',
      inviteCode: generateInviteCode(8),
      createdBy: '00000000-0000-0000-0000-000000000003', // Placeholder user ID
    },
  ];

  for (const data of neighborhoods) {
    const neighborhood = await prisma.neighborhood.upsert({
      where: { inviteCode: data.inviteCode },
      update: {},
      create: {
        ...data,
        members: {
          create: {
            userId: data.createdBy,
            role: 'OWNER',
          },
        },
      },
    });
    console.log(`Created neighborhood: ${neighborhood.name} (Code: ${neighborhood.inviteCode})`);
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
