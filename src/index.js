import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path : `./.env`
})


connectDB()
.then(()=> {
  app.listen(process.env.PORT || 8000, ()=> {
    console.log(`Server is reunning at port : 
      ${process.env.PORT} `);
  })
  // app.on("error",(err) => {
  //   console.log("error",err);
  // })
})
.catch((err) => {
  console.log("MONGO DB CONNECTION FAILED", err);

})













/*

// BY USING EFFIE function

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