import "dotenv/config"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose, { mongo } from "mongoose"

/*-----------*/
let userEmail = ""

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

const listingSchema = new mongoose.Schema({
    name: String,
    location: String,
    // address: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const userSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date, 
        required: true
    }
})

const Listing = mongoose.model("Listing", listingSchema)
const User = mongoose.model("User", userSchema)

// app.post("/listings/add", async (req, res) => {
//     const listing = req.body
//     // const user = req.body
//     const user = req.body.userEmail

//     const newListing = new Listing({name: listing.name, location: listing.location, user: user.userEmail})
//     newListing.save()
//     .then(() => {
//         // console.log(userEmail)
//         console.log(`New listing ${listing.name}, location: ${listing.location}, user: ${user.userEmail} was added to the database`)
//         res.sendStatus(200)
//     })
//     .catch(error => console.error(error))
// })

app.post("/listings/add", async (req, res) => {
    // if ( await User.countDocuments({"userEmail": req.body.userEmail}) > 0) {
        addListing(req.body.userEmail)
    // }
    async function addListing(reqUser) {
        const user = await User.findOne({"userEmail": reqUser})
        // userEmail = req.body.userEmail
        console.log(req.body)
        const listing = new Listing({
            name: req.body.name,
            location: req.body.location,
            user: user,
        })
        listing.save()
        .then(() => {
            console.log(`New listing ${listing.name}, location: ${listing.location}, user: ${user.userEmail} added`)
            res.sendStatus(200)
        })
        .catch(err => console.error(err))
    }
})

app.get("/listings/:id", async (req, res) => {
    const listing = await Listing.findById(req.params.id)
    res.json(listing)
})

app.put("/listings/:id", (req, res) => {
    Listing.updateOne({"_id": req.params.id}, {name: req.body.name, location: req.body.location})
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

app.post("/user/login", async (req, res) => {
    const now = new Date()

    if ( await User.countDocuments({"userEmail": req.body.userEmail}) === 0 ) {
        const newUser = new User({
            userEmail: req.body.userEmail,
            lastLogin: now
        })
        newUser.save()
        .then(() => {
            res.sendStatus(200)
        })
        .catch(err => {
            res.sendStatus(500)
        })
    } else {
        await User.findOneAndUpdate({"UserEmail": req.body.userEmail}, {lastLogin: now})
        res.sendStatus(200)
    }
})


