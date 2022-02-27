import "dotenv/config";
import Discord from "discord.js";

import ServiceManager from "../../Managers/ServiceManager";
import Logger from "../../Utils/Logger";
import DiscordInstance from "../../Discord/Client";

export default class PrivateVCService{
    public Name: string = "PrivateVC";

    //Discord
    private channelCreated: boolean = false;
    private Category: Discord.CategoryChannel|undefined = undefined;
    private JoinChannel: Discord.VoiceChannel|undefined = undefined;

    //Utils
    private _manager: ServiceManager;
    private _bot!: DiscordInstance;
    constructor(serviceMgr: ServiceManager){
        this._manager = serviceMgr;
        Logger.log("Trying to initialize...", "PrivateVCService");
        this._manager.on("discordInstanceReady", async (dInstance)=>{
            this._bot = dInstance;
            Logger.log("Discord instance provided. Checking category...", "PrivateVCService");
            this.initializeChannels(done=>{
                if(done){
                    this.channelCreated = done;
                    Logger.log("Fetching event listeners...", "PrivateVCService");
                    
                }
            })
        })
    }

    private async initializeChannels(callback: (done: boolean)=>void){
        if(channelCreated) {callback(true); return;}
        let guild = await this._bot.guilds.fetch(process.env.GUILD_ID as string);
        let channels = (await guild.channels.fetch()).map(channels=>channels);
        if(channels.map(channel=>[channel.name]).some(row=>row.includes(process.env.PVC_CATEGORY_NAME as string))){
            this.Category = channels.filter(channel=>channel.name==(process.env.PVC_CATEGORY_NAME as string));
            if(this.Category.children.values().some(row=>row.name==(process.env.PVC_DEFAULT_CHANNEL_NAME as string))){
                this.JoinChannel = this.Category.children.values().filter(row=>row.name==(process.env.PVC_DEFAULT_CHANNEL_NAME as string));
            }else{
                this.JoinChannel = await this.Category.createChannel(process.env.PVC_DEFAULT_CHANNEL_NAME, {
                    type: "GUILD_VOICE",
                    userLimit: 1
                });
            }
        }else{
            this.Category = await guild.channels.createChannel((process.env.PVC_CATEGORY_NAME as string), {
                type: "GUILD_CATEGORY"
            });
            this.JoinChannel = await this.Category.createChannel(process.env.PVC_DEFAULT_CHANNEL_NAME, {
                type: "GUILD_VOICE",
                userLimit: 1
            });
        }
        console.log(this.Category, this.JoinChannel)
        callback(true);
    }
}
