import { collection, getDocs } from 'firebase/firestore';
import { firestoreDb } from './src/lib/firebase.js';
import db, { initDb } from './src/lib/db.js';

async function migrateCollection(collectionName: string) {
  console.log(`Migrating ${collectionName}...`);
  try {
    const snapshot = await getDocs(collection(firestoreDb, collectionName));
    console.log(`Found ${snapshot.docs.length} documents in ${collectionName}.`);
    
    if (snapshot.docs.length === 0) return;

    for (const doc of snapshot.docs) {
      let data = doc.data();
      
      // In MySQL, 'users' use string 'uid' as primary key.
      // Other tables use auto-increment 'id'.
      // We will preserve the data fields but let MySQL generate new IDs for non-users,
      // or try to keep them if they are compatible.
      if (collectionName === 'users') {
        data.uid = doc.id; // Ensure UID is set
        if (typeof data.active_task === 'object') {
          data.active_task = JSON.stringify(data.active_task);
        }
      } else if (collectionName === 'shifts') {
        if (typeof data.edit_history === 'object') {
          data.edit_history = JSON.stringify(data.edit_history);
        }
        // Convert firestore timestamps to JS dates if needed
        if (data.clock_in && typeof data.clock_in === 'object' && data.clock_in.toDate) {
          data.clock_in = data.clock_in.toDate();
        }
        if (data.clock_out && typeof data.clock_out === 'object' && data.clock_out.toDate) {
          data.clock_out = data.clock_out.toDate();
        }
      }

      // Remove created_at and updated_at if they exist to let MySQL handle it,
      // or format them. We'll just remove them to avoid strict mode errors.
      delete data.created_at;
      delete data.updated_at;

      try {
        await db(collectionName).insert(data);
      } catch (insertErr: any) {
        // If it's a duplicate entry error (e.g. users), we can update instead
        if (insertErr.code === 'ER_DUP_ENTRY' && collectionName === 'users') {
          await db(collectionName).where({ uid: data.uid }).update(data);
        } else {
          console.error(`Error inserting document into ${collectionName}:`, insertErr.message);
        }
      }
    }
    console.log(`Finished migrating ${collectionName}.`);
  } catch (err: any) {
    console.error(`Error fetching from ${collectionName}:`, err.message);
  }
}

async function runMigration() {
  await initDb();
  console.log('Database initialized.');

  const collections = ['users', 'tasks', 'shifts', 'time_logs', 'approvals'];
  
  for (const col of collections) {
    await migrateCollection(col);
  }

  console.log('Migration complete!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
