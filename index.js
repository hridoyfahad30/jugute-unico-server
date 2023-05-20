const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json());
require('dotenv').config();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.duvqeeu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.USER_ACCESS_TOKEN, (error, decoded) => {
    if(error){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const toyCollection = client.db('toyDB').collection('toys');


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.USER_ACCESS_TOKEN, {expiresIn: '1h'});
      res.send({token});
    })


    app.get('/toys', async (req, res) => {

        const result = await toyCollection.find().toArray();
        res.send(result)
    });

    app.get('/toyDetails/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await toyCollection.findOne(query)
      res.send(result)
    });

    // app.get('/myToys', async (req, res) => {
    //   let query = {};
    //   if(req.query?.email){
    //     query = {email: req.query.email}
    //   }
    //   const result = await bookingCollection.find(query).toArray();
    //   res.send(result)
    // })  

    app.get('/myToys', verifyJWT, async(req, res) => {
      const decoded = req.decoded;
      console.log(req.query.email);

      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {sellerEmail: req.query.email}
      }
      const result = await toyCollection.find(query).toArray();
      res.send(result)
    });

    app.delete('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await toyCollection.deleteOne(query)
      res.send(result)
    })



    app.post('/toys', async (req, res) => {
        const newToy = req.body;
        const result = await toyCollection.insertOne(newToy);
        res.send(result)
    });



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res) => {
    res.send("Toy Server is Running")
});

app.listen(port, ()=> {
    console.log(`Toy server is running on port: ${port}`);
});