class ApiError extends Error {
    constructor(

        //this all are same as variables,so dont get confused on statuscode (name anything you want) 
        statuscode,
        message = "something went wrong",
        errors = [], //to give multiple errors in array format
        stack =  ""    
    ){
        super(message)
        this.statuscode = statuscode 
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
}

}

export {ApiError}


         // error.captureStackTrace is a Node.js method
//          Key Takeaways:
// 1. if (stack) preserves existing stack traces (useful for error wrapping)
// 2. Error.captureStackTrace() generates clean traces for new errors
// 3. The this.constructor argument hides the ApiError constructor from the trace
// 4. This matches how built-in errors behave, making your custom errors more professional
// This pattern is considered a best practice for custom error classes in Node.js.
  