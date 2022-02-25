import { EventEmitter } from "stream";
import path from "path";
import fs from "fs";
import Discord from "discord.js";

import Logger from "../Utils/Logger";
import DiscordInstance from "../Discord/Client";

declare interface ServiceManager{
    on(event: 'allInitialized', listener: (servicesName: string[]) => void): this;
    emit(event: 'allInitialized', ...args: any[]): boolean;

    on(event: 'serviceInit', listener: (name: string, service: any)=>void): this;
    emit(event: 'serviceInit', ...args: any[]): boolean;

    once(event: 'discordInstanceReady', listener: (instance: DiscordInstance)=> void): this;
    emit(event: 'discordInstanceReady', instance: DiscordInstance): boolean;

    on(event: 'warningAdd', listener: (executor: Discord.User, warned: Discord.User, reason:string)=>void):this;
    emit(event: 'warningAdd', executor: Discord.User, warned: Discord.User, reason:string):boolean;

    emit(event: string, ...args: any[]): boolean;
    on(event: string, listener: Function): this;
    once(event: string, listener: Function): this;
    
}

class ServiceManager extends EventEmitter{
    private _bot!: DiscordInstance;
    private serviceInstances: any[] = [];

    //Constructor
    constructor(){
        super();
        Logger.log("Trying to initialize...", "ServiceManager");
        this.eventHandler();
        this.findServices();
    }

    //Utils
    private eventHandler(){
        this.on("serviceInit", (name, mainFile)=>{
            Logger.log(`Found ${name} service, trying to initialize...`, "ServiceManager")
            this.serviceInstances.push(new (require(mainFile).default)(this));
        }).on("allInitialized", ()=>{
            Logger.log(`Initialized ${this.serviceInstances.length} ${this.serviceInstances.length==1?"instance":"instances"}. Getting discord instance ready.`, "ServiceManager");
            this._bot = new DiscordInstance(this);
        }).once("discordInstanceReady", ()=>{
            this._bot.user?.setActivity({type:"STREAMING", name:`${this.serviceInstances.length} services.`, url:"https://www.youtube.com/watch?v=gk-aCL6eyGc"});
        });
    }

    private findServices(){
        let ServicesPath = path.join(__dirname, "../Services");
        let files = fs.readdirSync(ServicesPath);
        for (const file of files) {
            if(!file.includes(".")){
                let servicePath = path.join(ServicesPath, file);
                let mainFile = path.join(servicePath, file+"Service.ts")
                if(fs.existsSync(mainFile)){
                    this.emit("serviceInit", file, mainFile);
                }else{
                    Logger.error(`Found ${file} service directory, but cannot find main class.`, "ServiceManager");
                }
            }
        }
        this.emit("allInitialized");
    }

    //Get/Set
    public getService(name: string){
        for (const service of this.serviceInstances) {
            if(service.Name == name){
                return service;
            }
        }
    }
}

export default ServiceManager;