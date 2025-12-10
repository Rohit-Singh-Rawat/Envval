import { migrate } from 'drizzle-orm/node-postgres/migrator';
import dotenv from 'dotenv';
import { db } from '@envval/db';

// Load .env file before importing db
dotenv.config();

async function runDatabaseMigrations() {
	try {
		await migrate(db, { migrationsFolder: '../../packages/db/drizzle' });
		console.log('Migration completed! ✅');
		process.exit();
	} catch (error) {
		console.error('Migration failed! ❌');
		console.error(error);
	}
}

runDatabaseMigrations();
