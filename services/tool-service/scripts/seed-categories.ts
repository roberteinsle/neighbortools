import { CategoryService } from '../src/services/category.service.js';

async function main() {
  console.log('Seeding default categories...');

  const categoryService = new CategoryService();
  const result = await categoryService.seedDefaultCategories();

  console.log(`Seeding complete: ${result.created} created, ${result.skipped} skipped`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Error seeding categories:', error);
  process.exit(1);
});
