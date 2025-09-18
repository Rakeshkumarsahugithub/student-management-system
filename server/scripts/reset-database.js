const { MongoClient } = require('mongodb');
require('dotenv').config();

async function resetDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db('student-management');
    
    // Clear all students with inconsistent encryption
    const result = await db.collection('students').deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} students with inconsistent encryption`);
    
    // Clear users if needed
    const userResult = await db.collection('users').deleteMany({});
    console.log(`🗑️ Deleted ${userResult.deletedCount} users`);
    
    console.log('✅ Database reset complete! You can now register fresh data with consistent encryption.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

resetDatabase();
