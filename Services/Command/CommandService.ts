
import "dotenv/config"
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js/node_modules/discord-api-types/v9";
import path from "path";
import fs from "fs";

import DiscordInstance from "../../Discord/Client";
import ServiceManager from "../../Managers/ServiceManager";
import Logger from "../../Utils/Logger";

export default class CommandService{
    public Name: string = "CommandService";

    //Utils
    private _manager: ServiceManager;
    private _bot!: DiscordInstance;
    private rest!: REST;

    //Constructor
    constructor(serviceMgr: ServiceManager){
        this._manager = serviceMgr;
        Logger.log("Trying to initialize...", "CommandService");
        this._manager.once("discordInstanceReady", (instance)=>{
            this._bot = instance;
            this.rest = new REST({ version: '9' }).setToken(process.env.TOKEN as string);
            this.registerCommands((done)=>{});
        });
    }

    private registerCommands(callback: (done: boolean)=>void){
        let commands: any[] = [];
        for(const file of fs.readdirSync(path.join(__dirname, "Commands"))){
            let cmd = new (require(path.join(__dirname, "Commands", file)).default)(this);
            commands.push(cmd.toJSON());
            console.log(commands);
        }
        try {
            console.log('Started refreshing application (/) commands.');
    
            this.rest.put(
                Routes.applicationGuildCommands(this._bot.user?.id as string, process.env.GUILD_ID as string),
                { body: commands },
            );
    
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    }

    public get discordInstance(): DiscordInstance{
        return this._bot;
    }
    public get ServiceManager(): ServiceManager{
        return this._manager;
    }
}