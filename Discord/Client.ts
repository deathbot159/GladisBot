import "dotenv/config";
import Discord from "discord.js";
import { ActivityTypes } from "discord.js/typings/enums";
import ServiceManager from "../Managers/ServiceManager";
import Logger from "../Utils/Logger";

export default class DiscordInstance extends Discord.Client{

    private _serviceManager: ServiceManager;
    constructor(serviceManager: ServiceManager){
        super({
            presence: {
                activities: [
                    {
                        name: "rev. 0.0.1dev", 
                        type: ActivityTypes.PLAYING
                    }
                ]
            }, 
            intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_BANS"]
            }
        );
        this._serviceManager = serviceManager;
        this.login(process.env.TOKEN);
        this.on("ready", ()=>{this._serviceManager.emit("discordInstanceReady", this)});
        Logger.log("Initialized.", "DiscordInstance");
    }
}