import "dotenv/config";
import Discord, { CategoryChannel, Collection, VoiceChannel } from "discord.js";

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
        this._manager.once("discordInstanceReady", async (dInstance)=>{
            this._bot = dInstance;
            Logger.log("Discord instance provided. Checking category...", "PrivateVCService");
            this.initializeChannels(done=>{
                if(done){
                    this.channelCreated = done;
                    Logger.log("Cleaning old pvc...", "PrivateVCService");
                    this.clean();
                    Logger.log("Attaching event listeners...", "PrivateVCService");
                    this.listen();
                }
            })
        })
    }
    private async clean(){
        this.Category?.children.filter(channel=>channel.id != (this.JoinChannel as VoiceChannel).id).map(async channel=>channel.deletable?await channel.delete():"");
    }

    private async listen(){
        this._bot.on("voiceStateUpdate", async (oldState, newState)=>{
            if(newState.channel == this.JoinChannel){
                let channel = await this.Category?.createChannel("Kanał "+oldState.member!.user.tag, {
                    type: "GUILD_VOICE",
                    permissionOverwrites:[{
                        type:"member",
                        id:oldState.member!.id,
                        allow:[Discord.Permissions.FLAGS.VIEW_CHANNEL,
                        Discord.Permissions.FLAGS.MANAGE_CHANNELS,
                        Discord.Permissions.FLAGS.CONNECT,
                        Discord.Permissions.FLAGS.SPEAK,
                        Discord.Permissions.FLAGS.STREAM,
                        Discord.Permissions.FLAGS.MUTE_MEMBERS,
                        Discord.Permissions.FLAGS.DEAFEN_MEMBERS
                        ]
                    }]
                });
                oldState.member!.voice.setChannel(channel as VoiceChannel);
            }else {
                if(oldState.channel)
                if(this.Category?.children.some(row=>(row.id==oldState.channel!.id)) && oldState.channel.name != (process.env.PVC_DEFAULT_CHANNEL_NAME)){
                //leave pvc
                    if(oldState.channel.members.size == 0){
                        oldState.channel.deletable?oldState.channel.delete():"";
                    }
                }
            }
        })
    }

    private async initializeChannels(callback: (done: boolean)=>void){
        if(this.channelCreated) {callback(true); return;}
        let guild = await this._bot.guilds.fetch(process.env.GUILD_ID as string);
        let channels = (await guild.channels.fetch()).map(channels=>channels);
        if(channels.map(channel=>[channel.name]).some(row=>row.includes(process.env.PVC_CATEGORY_NAME as string))){
            this.Category = channels.filter(channel=>channel.name==(process.env.PVC_CATEGORY_NAME as string))[0] as CategoryChannel;
            if(this.Category.children.some(row=>row.name==(process.env.PVC_DEFAULT_CHANNEL_NAME as string))){
                this.JoinChannel = this.Category.children.find(row=>row.name==(process.env.PVC_DEFAULT_CHANNEL_NAME as string)) as VoiceChannel;
            }else{
                this.JoinChannel = await this.Category.createChannel(process.env.PVC_DEFAULT_CHANNEL_NAME as string, {
                    type: "GUILD_VOICE",
                    userLimit: 1
                });
            }
        }else{
            this.Category = await guild.channels.create((process.env.PVC_CATEGORY_NAME as string), {
                type: "GUILD_CATEGORY"
            });
            this.JoinChannel = await this.Category.createChannel(process.env.PVC_DEFAULT_CHANNEL_NAME as string, {
                type: "GUILD_VOICE",
                userLimit: 1
            });
        }
        callback(true);
    }
}
