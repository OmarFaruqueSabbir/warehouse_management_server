const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');

function tokenVerify(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            email = 'Email is Invalid'
            //console.log(err)
        }
        if (decoded) {
            //console.log(decoded)
            email = decoded
        }
    });
    return email;
}

//middleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3tl4m.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemsCollection = client.db('inventoryItems').collection('items');


        //set accessToken locally by login
        app.post("/login", (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.send({ accessToken })
        })

        // get all items & get items filtering email & verifying with token
        app.get('/item', async (req, res) => {
            let query
            const email = req.query.email
            if (email) {
                const accessToken = req.headers.authorization;
                const decoded = tokenVerify(accessToken)
                if (email === decoded.email) {
                    query = { email: email }
                    const cursor = itemsCollection.find(query);
                    const result = await cursor.toArray();
                    res.send(result);
                } else {
                    res.send({ success: 'Access Denied' })
                }

            } else {
                query = {}
                const cursor = itemsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
        });

        //get single items
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemsCollection.findOne(query);
            res.send(item);
        });

        //update items increment & decrement
        app.put('/item/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity,
                }
            };
            const result = await itemsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //delete Inventory item
        app.delete('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemsCollection.deleteOne(query);
            res.send(result);
        })

        //POST
        app.post('/item', async (req, res) => {
            const newInventoryItem = req.body;
            const result = await itemsCollection.insertOne(newInventoryItem);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})



