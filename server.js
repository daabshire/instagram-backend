import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import Pusher from "pusher";
import dbModel from "./dbModel.js";

// App Config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
    appId: "1434989",
    key: "e83879cb700e05ac52c2",
    secret: "074381aae86498f9e318",
    cluster: "us2",
    useTLS: true
  });

// Middlewares
app.use(express.json());
app.use(cors());


// DB Config
const connection_url = "mongodb+srv://admin:Elk3SLYeacANVSUS@cluster0.xl4xjt7.mongodb.net/instagramDB?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.once("open", () => {
    console.log("DB Connected");

    const changeStream = mongoose.connection.collection("posts").watch();

    changeStream.on("change", (change) => {
        console.log("ChgStream Triggered on pusher...");
        console.log(change);
        console.log("End of Change");

        if (change.operationType === "insert") {
            console.log("Triggering Pusher ***IMG UPLOAD***");

            const postDetails = change.fullDocument;
            pusher.trigger("posts", "inserted", {
                user: postDetails.user,
                caption: postDetails.caption,
                image: postDetails.image,
            });
        } else {
            console.log("Uknown trigger from Pusher");
        }
    });
});

// API Routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/upload", (req, res) => {
    const body = req.body;



    dbModel.create(body, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});


app.get("/sync", (req, res) => {
    dbModel.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});



// Listener
app.listen(port, () => console.log(`listening on localhost:${port}`));