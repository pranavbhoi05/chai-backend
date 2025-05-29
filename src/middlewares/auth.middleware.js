import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

 
// why or how someone can export a function directly without assigning it to a const (or function) first.
// 1. JavaScript allows you to export a value directly, and in this case, you're exporting an anonymous arrow function.
// 2. It’s equivalent to assigning it to a variable first, but cleaner for simple cases.



export const verifyJWT = asyncHandler(async (req, _ , 
    next) => { 
     
   try {
     const token = req.cookies?.accessToken || req.header
     ("Authorization")?.replace("Bearer ", "")
     if(!token){
         throw new ApiError(401," unauthorized request")
     }
     const decodedToken = jwt.verify(token, process.env.
         ACCESS_TOKEN_SECRET)
    const user =  await User.findById(decodedToken?._id).
    select("-password -refreshToken")
    if(!user){
     //next_video : discuss about frontend
     throw new ApiError(401," invalid access token")
 }    
     req.user = user
     next()
   } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
   }
    //im giving access of user to req object(user)
})




//❌ req.cookie (singular) does not exist
// If you try it, you'll get undefined

// Property  	     Exists?     	Description
// req.cookies  	✅ Yes   	Object containing all cookies
// req.cookie	    ❌ No	    Not defined — will return undefined

