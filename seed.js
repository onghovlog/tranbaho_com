require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tran_ba_ho';
const dbPath = path.join(__dirname, 'db.json');

async function seedDatabase() {
  console.log('🚀 Đang đọc dữ liệu từ db.json...');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Không tìm thấy tệp db.json tại:', dbPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dbPath, 'utf-8');
  const dbData = JSON.parse(rawData);

  console.log(`🔌 Đang kết nối tới MongoDB: ${uri}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Đã kết nối thành công tới MongoDB!');

    const db = client.db();

    for (const [key, value] of Object.entries(dbData)) {
      const collection = db.collection(key);
      await collection.deleteMany({});

      if (Array.isArray(value)) {
        if (value.length > 0) {
          const docs = value.map(item => {
            const doc = { ...item };
            if (doc.id !== undefined && doc._id === undefined) {
              doc._id = doc.id;
            }
            return doc;
          });
          await collection.insertMany(docs);
          console.log(`  📦 Collection '${key}': Đã nạp ${value.length} bản ghi.`);
        } else {
          console.log(`  📦 Collection '${key}': Trống, đã làm sạch.`);
        }
      } else if (typeof value === 'object' && value !== null) {
        const doc = { _id: 'single_doc', ...value };
        await collection.insertOne(doc);
        console.log(`  📦 Collection '${key}': Đã nạp dữ liệu object đơn.`);
      }
    }

    // Khởi tạo collection contacts nếu chưa có
    const collections = await db.listCollections({ name: 'contacts' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('contacts');
      console.log("  📦 Collection 'contacts': Đã khởi tạo sẵn sàng cho Form Liên hệ.");
    }

    console.log('\n🎉 Hoàn thành nạp dữ liệu (Seeding) vào MongoDB thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi nạp dữ liệu vào MongoDB:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase();
