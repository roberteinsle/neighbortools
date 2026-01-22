import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding user database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@neighbortools.net' },
    update: {},
    create: {
      email: 'admin@neighbortools.net',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      language: 'EN',
      settings: {
        create: {},
      },
    },
  });
  console.log('Created admin user:', admin.email);

  // Create test users
  const testPassword = await bcrypt.hash('Test1234!', 12);

  const users = [
    { email: 'john@example.com', firstName: 'John', lastName: 'Doe', language: 'EN' as const },
    { email: 'maria@example.com', firstName: 'Maria', lastName: 'Garcia', language: 'ES' as const },
    { email: 'hans@example.com', firstName: 'Hans', lastName: 'Mueller', language: 'DE' as const },
    { email: 'pierre@example.com', firstName: 'Pierre', lastName: 'Dubois', language: 'FR' as const },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: testPassword,
        settings: {
          create: {},
        },
      },
    });
    console.log('Created test user:', user.email);
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
