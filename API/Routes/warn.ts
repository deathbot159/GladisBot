import express from "express";

var router = express.Router();

router.get('/', (req,res)=>{
    res.send("warn_ok");
})

export default router;