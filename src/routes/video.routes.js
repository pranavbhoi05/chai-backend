import { Router } from "express";
import { 
    getAllVideos, 
    publishAVideo, 
    getVideoById, 
    updateVideo, 
    deleteVideo, 
    togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router
    .route("/")
    .get(getAllVideos)
    .post(verifyJWT,
        upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }     // video is the field name which is used in the form-data
    ]),
     publishAVideo)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT,deleteVideo)
    .patch(verifyJWT,
          upload.single("thumbnail"),
          updateVideo) 

router
    .route("/toggle/publish/:videoId")
    .patch(verifyJWT, togglePublishStatus)    
    

export default router;


