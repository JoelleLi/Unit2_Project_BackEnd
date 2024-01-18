import "dotenv/config"
import express, { Router } from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose, { mongo } from "mongoose"
import serverless from "serverless-http"

const api = express()

const router = Router()

api.use(cors())
api.use(bodyParser.json())

mongoose.connect(process.env.DATABASE_URL)


router.get("/", (req, res) => {
    res.json({message: "Server running"})
})

router.get("/listings", async (req, res) => {
    const allListings = await Listing.find({}).sort("name")
    res.json(allListings)
})

router.get("/listings/mylistings/:userId", async (req, res) => {
    const userId = req.params.userId
    const myUser = await User.find({
        userEmail: userId
    })
    const myListings = await Listing.find({"user": myUser}).populate("user")
    console.log(userId)
    res.json(myListings)
})

router.get("/categories/city/:city", async (req, res) => {
    const oneCity = req.params.city
    const cityListings = await Listing.find({ city: oneCity })
    res.json(cityListings)
})

router.get("/categories/public", async (req, res) => {
    const publicListings = await Listing.find({ public: true })
    res.json(publicListings)
})

router.get("/categories/private", async (req, res) => {
    const privateListings = await Listing.find({ private: true })
    res.json(privateListings)
})

router.get("/photos/", async (req, res) => {
    const allPhotos = await Photos.find({})
    res.json(allPhotos)
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

const photoSchema = new mongoose.Schema({
    photos: {
        type: [String]
    },
    addedBy: {
        type: mongoose.Schema.ObjectId, ref: "User", required: true
    }
})

const listingSchema = new mongoose.Schema({
    name: String,
    city: String,
    address: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    image: String,
    images: {
        type: [String]
    },
    photos: [photoSchema],
    public: Boolean,
    private: Boolean,
    telephone: String,
    emailAddress: String,
    description: String
})

const User = mongoose.model("User", userSchema)
const Listing = mongoose.model("Listing", listingSchema)
// const Photo = mongoose.model("Listing", photoSchema)

router.post("/listings/add", async (req, res) => {
    
    addListing(req.body.userEmail)

    async function addListing(reqUser) {
        const user = await User.findOne({"userEmail": reqUser})
        console.log(req.body)
        const listing = new Listing({
            name: req.body.name,
            city: req.body.city,
            address: req.body.address,
            user: user,
            image: req.body.image,
            images: req.body.images,
            photos: req.body.photos,
            public: req.body.public,
            private: req.body.private,
            telephone: req.body.telephone,
            emailAddress: req.body.emailAddress,
            description: req.body.description
        })
        listing.save()
        .then(() => {
            console.log(`New listing ${listing.name}, location: ${listing.city}, address: ${listing.address}, user: ${user.userEmail} added`)
            res.sendStatus(200)
        })
        .catch(err => console.error(err))
    }
})

router.post("/listings/:id/photos/add", async (req, res) => {

    addPhotos(req.body.userEmail)

    async function addPhotos(reqUser) {
        const user = await User.findOne({"userEmail": reqUser})
        console.log(user)
        const listing = await Listing.findOne({"_id": req.params.id})
        const createPhotos = listing.photos.create ({ ...req.body, addedBy: user._id })
        listing.photos.push(createPhotos)

        listing.save()
        .then(() => {
            res.sendStatus(200)
        })
        .catch(err => console.error(err))
}})

router.put("/listings/:id/photos/:photoId", async (req, res) => {
    try {
        const user = await User.findOne({"userEmail": req.body.userEmail})
        const listing = await Listing.findOne({"_id": req.params.id})
        const editPhotos = listing.photos.id( req.params.photoId )
        console.log(listing.photos)
        if(!editPhotos.addedBy.equals(user._id)) {
            console.log("unauthorized")
        }
        editPhotos.set(req.body)
        await listing.save()
        return res.status(200).json(listing.photos)
    } catch(error){
        console.log(error)
    }
})

router.get("/listings/:id", async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("user")
    res.json(listing)
})

router.put("/listings/:id", (req, res) => {
    Listing.updateOne({"_id": req.params.id}, {
        name: req.body.name, 
        city: req.body.city, 
        address: req.body.address, 
        image: req.body.image, 
        images: req.body.images, 
        photos: req.body.photos,
        public: req.body.public,
        private: req.body.private,
        telephone: req.body.telephone,
        emailAddress: req.body.emailAddress,
        description: req.body.description
    })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})

router.delete("/listings/:id", (req, res) => {
    Listing.deleteOne({"_id": req.params.id})
    .then(() => {
        console.log(`Listing ID ${req.params.id} was deleted`)
        res.sendStatus(200)
    })
    .catch(error => {
        res.sendStatus(500)
    })
})


// api.delete("/listings/:id/photos/:photoId", (req, res) => {
//     const listing = Listing.findOne({"_id": req.params.id})
//     const deletePhotos = listing.photos.id( req.params.photoId )

//     deletePhotos.deleteOne({"_id": req.params.photoId})

//     .then(() => {
//         console.log(`Photos ID ${req.params.photoId} was deleted`)
//         res.sendStatus(200)
//     })
//     .catch(error => {
//         res.sendStatus(500)
//     })
// })

router.delete("/listings/:id/photos/:photoId", async (req, res) => {
    try {
        // console.log(req.params)
        const listing = await Listing.findOne({ "_id": req.params.id })
        // console.log(listing)

        // Remove the photo from the photos array
        listing.photos = listing.photos.filter(photo => {
            // console.log(photo._id, req.params.photoId)

            // if (photo._id.equals(req.params.photoId)) {
            //     console.log("TRUE")
            // }
            return !photo._id.equals(req.params.photoId)
        })
        await listing.save()
        console.log(`Photo ID ${req.params.photoId} was deleted`)
        res.sendStatus(200)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

router.post("/user/login", async (req, res) => {
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

api.use("/api/", router)

export const handler = serverless(api)


