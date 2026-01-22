import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding lending database...');

  // Create sample lendings
  // Note: These use placeholder IDs - in production, real IDs would be used
  const lendings = [
    {
      toolId: '00000000-0000-0000-0000-000000000001',
      toolName: 'Bosch Hammer Drill',
      borrowerId: '00000000-0000-0000-0000-000000000002',
      lenderId: '00000000-0000-0000-0000-000000000001',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
      status: 'RETURNED' as const,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-15'),
      returnedAt: new Date('2024-01-14'),
      message: 'Need to drill some holes in the wall',
    },
    {
      toolId: '00000000-0000-0000-0000-000000000002',
      toolName: 'Garden Hose 50m',
      borrowerId: '00000000-0000-0000-0000-000000000003',
      lenderId: '00000000-0000-0000-0000-000000000002',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
      status: 'ACTIVE' as const,
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-01-25'),
      message: 'Watering my garden this weekend',
    },
    {
      toolId: '00000000-0000-0000-0000-000000000003',
      toolName: 'Pressure Washer',
      borrowerId: '00000000-0000-0000-0000-000000000002',
      lenderId: '00000000-0000-0000-0000-000000000001',
      neighborhoodId: '00000000-0000-0000-0000-000000000001',
      status: 'PENDING' as const,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-03'),
      message: 'Want to clean my patio',
    },
  ];

  for (const data of lendings) {
    const lending = await prisma.lending.create({
      data: {
        ...data,
        history: {
          create: {
            status: data.status,
            changedBy: data.borrowerId,
            note: `Initial status: ${data.status}`,
          },
        },
      },
    });
    console.log(`Created lending: ${lending.toolName} - ${lending.status}`);
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
