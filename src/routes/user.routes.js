import {Router } from  "express"
import { loginUser, logoutUser, registerUser ,refreshAccessToken,changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middileware.js";



const router =Router()

router.route("/register").post(
    upload.fields([{
        name:"avatar",
        maxCount:1
    },{
        name:"coverImage",
        maxCount:1
    }]) ,
    registerUser)

router.route("/login").post(loginUser)


////secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").post(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").post(verifyJWT,upload.single("coverImage"),updateUserCoverImage)



/////have to do
// route.route("/c/:username").get(verifyJWT,userChannelProfile)
// route.route("/c/:username").get(verifyJWT,userChannelProfile)





export default router;