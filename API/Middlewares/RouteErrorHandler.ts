import express from "express";

export default function routeErrorHandler(err:Error, req:express.Request, res:express.Response, next:express.NextFunction){
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
}