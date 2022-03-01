import "dotenv/config"
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import fs from "fs";

import Logger from "../Utils/Logger";
import APIResponseStatus from "./ResponceStatus";
import routeNotFound from "./Middlewares/RouteNotFound";
import routeErrorHandler from "./Middlewares/RouteErrorHandler";
import getAllFilesInFolder from "../Utils/fileUtils";

const port = parseInt(process.env.API_PORT as string);

var app = express();
Logger.log("Trying to enable API service...", "API");

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({status: APIResponseStatus.INVALID, message: "Invalid request."});
});

//app.use('/api/v1', api);
var router = express.Router();
var routesPath = path.join(__dirname, "Routes");
for (const file of getAllFilesInFolder(routesPath).map(item=>item.replace(routesPath, "").replace(/\\/g, "/").slice(0,-3))) {
    router.use(file, require(path.join(__dirname, "Routes", file)).default);
}

app.use(`/api/v1`, router);
app.use(routeNotFound);
app.use(routeErrorHandler);

app.listen(port, () => {
    Logger.log("Listening at http://localhost:"+port, "API");
});

