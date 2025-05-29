import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "somthing went wrong while generating tokens")
  }
}

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

// console.log(req.files);

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

const loginUser = asyncHandler(async (req, res) => {
  //todo's: 
  // 1. get user details from frontend
  // 2. validation username or email
  // 3. check if user exists in db
  // 4. check for password
  // 5.access and refresh token generation
  // 6. set cookies
  // 7. return response to frontend


  const {username , email, password} = req.body
  console.log(email);
  // console.log(req.body);
  
  
  
  
  // 2. validation username or email
  if(!username && !email){
    throw new ApiError(400, "username or email is required")
  }
   // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

  // 3. check if user exists in db
  const user = await User.findOne({
    $or: [{username}, {email}]
  })
  //if user does not exist then
  if(!user){
    throw new ApiError(404, "username or email does not exist") 
  }

// console.log("Plain password:", password);
// console.log("Hashed in DB:", user.password);

  // 4. check for password 
  const isPasswordValid = await user.isPasswordCorrect(password)
  // console.log("Password match:", isPasswordValid);
  if(!isPasswordValid){
    throw new ApiError(401, "invalid password")  
  }

  // 5.access and refresh token generation
  
  const {accessToken , refreshToken} = await
   generateAccessAndRefreshTokens(user._id)

  //we are doing login method, so it's (user) will have its own (user)method, (its same as we previouly created method for register user method)   so  we need to hind refresh token and password. so we'll add another db method  
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // 6. set cookies
 const options = {
   
  httpOnly: true,
  secure : true
 } 

 return res.
 status(200)
 .cookie("accessToken", accessToken , options)
 .cookie("refreshToken", refreshToken, options)
 .json(
  new ApiResponse(
    200,{
      user: loggedInUser,
      accessToken,
      refreshToken
      
    },
    "User logged in successfully")
 )

})

const logoutUser =  asyncHandler(async (req,res) =>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : {
        refreshToken : undefined
      }
    },
    {
      new : true
    }
  )

   const options = { 
  httpOnly: true,
  secure : true
 } 

 return res
 .status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(
  new ApiResponse(
    200,"User logged out successfully"))
}) 

const refreshAccessToken = asyncHandler(async (req , res) =>
  {
  //todo's:
  // 1. get refresh token from cookies or body
  // 2. check if refresh token exists
  // 3. verify refresh token 
  // 4. generate new access token
  // 5. set new access token in cookies
  // 6. return response to frontend

  // 1. get refresh token from cookies or body
  const incomingRefreshToken = req.cookies.
  refreshToken || req.body.refreshToken

   // 2. check if refresh token exists
  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

  // 3. verify incoming refresh token
try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    //we'll find user by id so that we;ll get user details
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "invalid refresh token")
    }
    
  // check if refresh token is same as in db
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "refresh token is expired or used")
     }
  
     const options = {
      httpOnly: true,
      secure: true  
     }
  
    // 4. generate new access token
    const {accessToken , newRefreshToken} = await 
    generateAccessAndRefreshTokens(user._id)
     return res
     .status(200)
     .cookie("accessToken",accessToken, options)
     .cookie("refreshToken",newRefreshToken, options)
     .json(
      new ApiResponse(
        200,
        {accessToken,
          refreshToken:
        newRefreshToken},
        "Access token refreshed successfully"
      )
     )
  
} catch (error) {
  throw new ApiError(401, "invalid refresh token")
}
})



export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken
      }
