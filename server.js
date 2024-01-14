import "dotenv/config"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"

const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`listening on port: ${port}`)
})
mongoose.connect(process.env.DATABASE_URL)

app.get("/", (req, res) => {
    res.json({message: "Server running"})
})

app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({}).sort("name")
    res.json(allListings)
})

app.get("/users", async (req, res) => {
    const allUsers = await User.find({}).sort("username")
    res.json(allUsers)
})

const listingSchema = new mongoose.Schema({
    name: String,
    location: String
})

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    userEmail: String,
    listings: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    },
    favouriteListings: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FavouriteListing"
    }
})

const Listing = mongoose.model("Listing", listingSchema)
const User = mongoose.model("User", userSchema)

app.post("/listings/add", (req, res) => {
    const listing = req.body

    const newListing = new Listing({
        name: listing.name, 
        location: listing.location
    })
    newListing.save()
    .then(() => {
        console.log(`New listing ${listing.name}, location: ${listing.location} was added to the database`)
        res.sendStatus(200)
    })
    .catch(error => console.error(error))
})

app.post("/users/add", (req, res) => {
    const user = req.body
    const newUser = new User({
        username: user.username,
        name: user.name,
        userEmail: user.userEmail
    })

    newUser.save()
    .then(() => {
        console.log(`New user ${user.username} was added to the database`)
    })
    .catch(error => console.error(error))
})

app.get("/listings/:id", async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    res.json(listing)
})

app.get("/users/:id", async (req, res) => {
    const user = await User.findById(req.params.id)
    res.json(user)
})

app.put("/listings/:id", (req, res) => {
    Listing.updateOne({"_id": req.params.id}, {name: req.body.name}, {location: req.body.location})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})

app.put("/users/:id", (req, res) => {
    User.updateOne(
        {"_id": req.params.id}, 
        {username: req.body.username}, 
        {name: req.body.username}, 
        {userEmail: req.body.userEmail})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})

app.delete("/listings/:id", (req, res) => {
    Listing.deleteOne({"_id": req.params.id})
    .then(() => {
        console.log(`Listing ID ${req.params.id} was deleted`)
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})

app.delete("/users/:id", (req, res) => {
    User.deleteOne({"_id": req.params.id})
    .then(() => {
        console.log(`User ID ${req.params.id} was deleted`)
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})



