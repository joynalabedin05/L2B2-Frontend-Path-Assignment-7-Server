const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');
        const supplyCollection = db.collection('supplyCollection');
        const donateCollection = db.collection('donateCollection');

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // ==============================================================
        // WRITE YOUR CODE HERE
        app.get('/api/v1/users', async(req, res)=>{
            // const users = req.body;
            const result = await collection.find().toArray();
            res.send(result);
        })
        app.get('/api/v1/all-supply', async(req, res)=>{
            // const users = req.body;
            const result = await supplyCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/all-supply/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await supplyCollection.findOne(query);
            res.send(result) ;
            // console.log(id);
          });

        app.post('/api/v1/create-supply', async(req,res)=>{
            const newItem = req.body;
            const result = await supplyCollection.insertOne(newItem);
            res.send(result);
          });
        app.post('/api/v1/donate-amount', async(req,res)=>{
            const newItem = req.body;
            const result = await donateCollection.insertOne(newItem);
            res.send(result);
          });

          app.put('/api/v1/update-supply/:id', async(req, res)=>{
            const id = req.params.id;
            const items = req.body;
            // console.log(id,items);
            const filter = {_id: new ObjectId(id)}
            const options = {upsert: true}
            const updatedUser = {
              $set:{
                title: items.title,
                category: items.category,
                quantity: items.quantity,
                description: items.description,
                
              }
            }
            const result = await supplyCollection.updateOne(filter, updatedUser,options);
            res.send(result);
          });

          app.delete('/api/v1/all-supply/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await supplyCollection.deleteOne(query);
            res.send(result);
          })
        //==============================================================


        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});