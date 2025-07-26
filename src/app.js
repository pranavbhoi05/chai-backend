import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({
    limit : "20kb"
}))

app.use(express.urlencoded({
    extended : true,
    limit : "20kb"
}))

app.use(express.static("public"))

app.use(cookieParser()) 

//import routes
import userRoutes from "./routes/user.routes.js" 
import videoRoutes from "./routes/video.routes.js"

 
//routes declaration.
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/videos", videoRoutes)

// http://localhost:8000/api/v1/users/register
export default app