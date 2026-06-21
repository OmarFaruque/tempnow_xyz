
import { db } from '../lib/db';
import { admins } from '../lib/schema.ts';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting admin seeding...');
  try {
    const passwordAdmin = await bcrypt.hash('TempnowAdmin2024!', 10);
    const passwordManager = await bcrypt.hash('TempnowManager2024!', 10);

    const existingAdmins = await db.select().from(admins);
    const existingEmails = existingAdmins.map(a => a.email);

    const recordsToInsert = [];

    if (!existingEmails.includes('admin@monzic.co.uk')) {
      recordsToInsert.push({
        fname: 'Admin',
        lname: 'User',
        email: 'admin@monzic.co.uk',
        phone: '1234567890',
        password: passwordAdmin,
        role: 'Admin',
      });
    } else {
      console.log('Admin user "admin@monzic.co.uk" already exists. Skipping.');
    }

    if (!existingEmails.includes('manager@monzic.co.uk')) {
      recordsToInsert.push({
        fname: 'Manager',
        lname: 'User',
        email: 'manager@monzic.co.uk',
        phone: '0987654321',
        password: passwordManager,
        role: 'Manager',
      });
    } else {
      console.log('Manager user "manager@monzic.co.uk" already exists. Skipping.');
    }

    if (recordsToInsert.length > 0) {
      await db.insert(admins).values(recordsToInsert);
      console.log(`Successfully seeded ${recordsToInsert.length} admin user(s).`);
    } else {
      console.log('All admin users already exist in the database.');
    }

    console.log('Seeding process finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();

