import dotenv from "dotenv";

import connectDB from "./db/index.js";


dotenv.config({
  path : `./env`
})


connectDB()















/*
import express from "express";
const app = express();

  ( async () => {
try {
    const connection = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
    app.on ("error", (error) => {
        console.error("error", error)
    })

    app.listen(process.env.PORT, () =>{
        console.log(`app listening on port ${process.env.PORT}`);
    })
} catch (error) {
    console.error("error", error)
}
  })()
*/