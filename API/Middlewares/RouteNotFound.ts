import express from "express";

export default function routeNotFound(req:express.Request, res:express.Response, next:express.NextFunction){
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
}