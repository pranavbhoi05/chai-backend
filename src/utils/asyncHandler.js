//2nd approch

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((err) => next (err))
    }    
 }
 
 export { asyncHandler}
 //higher order function

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {} 
// const asyncHandler = (func) => async () => {} using async

// same thing we do here



// 1st spproch

//  const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.stutus(error.code || 500).json({
//             success : false,
//             message : error.message
//         })
//     }
//  }








//  export { asyncHandler } 