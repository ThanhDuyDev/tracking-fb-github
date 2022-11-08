import {MongoClient} from 'mongodb'

const uri = "mongodb+srv://duypt0410:abc123@mycluster.yaht33f.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const dbName = 'tracking-fb';
const collectionName = 'articles';

// Function to connect to the server
async function run() {
    try {
        await client.connect()
      // Establish and verify connection
      console.log("Connected successfully to server");

      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);