import {Router} from 'express';

import { loginUser, registerUser ,refreshAccessToken} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { logoutUser } from '../controllers/user.controller.js';

const router = Router()

router.route("/register").post(
  //we use fields so that we can upload multiple files by using array
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
      ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;