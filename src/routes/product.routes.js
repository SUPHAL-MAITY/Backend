import {Router } from  "express"
import {upload} from "../middlewares/multer.middleware.js"
import { getProducts, registerProduct } from "../controllers/product.controller.js"


const router = Router()



////product register
router.route("/product-register").post(upload.single("productImg"),registerProduct)
///product fetch
router.route("/get-product/:name").get(getProducts)


export default router