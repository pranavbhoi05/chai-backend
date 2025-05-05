import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Registration logic here
  // res.status(200).json ({
  //   message : "me and myself"
  // })
   
  // steps :
  //get user details from frontend
  //validation
  //check if user already exists : username ,email
  // check for images, check for avatar (checks our file exists or not)
  //upload them to cloudinary , after we'll check avatar is uploaded or not
  // create user object - (create entry in db)
  //remove password and refresh token feild from response 
  //check for user creation success or failure
  //return response to frontend if successed

  // step 1 :
  const {fullName, email, username, password} = req.body;
//   console.log("email :", email);


  // step 2 : validation
  // if(fullName === ""){
  //   throw new ApiError(400, "fullName is required", "registerUser")
  // }

  //to check multiple errors at once we'll pass array
  if(
    [fullName, email, username, password].some((field) =>
  field?.trim() === "")
){
    throw new ApiError(400, "All feilds are required")
  } 
  //can also create conditon for email format validation  
 

// step 3 : check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }] 
  })

  if(existedUser){
  throw new ApiError(409, "User with email or username already exists")
   
  }
  
 // step 4 : check for images, avatar
 const avatarLocalPath =  req.files?.avatar[0]?.path;
let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
 

 if(!avatarLocalPath){ 
  throw new ApiError(400, "Avatar is required")
 }

// step 5 : upload them to cloudinary 

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
if(!avatar){
  throw new ApiError(400, "Avatar file is required")
}

// step 6 : create user object and 
// step 7 : remove password and refresh token feild from response

const user = await User.create({
  fullName,
  avatar: avatar?.url || "",
  coverImage: coverImage?.url || "",
  email,
  password,
  username : username.toLowerCase()

})

console.log(req.files);

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

//step 8 : check for user creation success or failure

if(!createdUser){
  throw new ApiError(500, "something went wrong while registering the user")
}

// step 9 : return response to frontend if successed
  
  return res.status(201).json(
    new ApiResponse(200, createdUser , "User created successfully")
  )

})

export {registerUser}
