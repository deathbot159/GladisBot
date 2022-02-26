import "dotenv/config"
import Discord from "discord.js";
import sqlite from "sqlite3";
import path from "path";
import fs from "fs";

import LoggerTables from "../../Discord/SQLs/loggerTables";
import DiscordInstance from "../../Discord/Client";
import ServiceManager from "../../Managers/ServiceManager";
import Logger from "../../Utils/Logger";
import channelCreateListener from "./Listeners/channelCreate";

export default class LoggerService{
    public Name: string = "LoggerService";

    //Discord
    private LogCategory: Discord.CategoryChannel|undefined = undefined;
    private LogChannelNames: string[] = 
    ["channel-create", "channel-delete", "channel-update", "message-delete", "message-update", "guild-ban-add", "guild-ban-remove", "warning-add", "warning-remove", "warning-update"];
    private LogChannels: Discord.TextChannel[] = [];
    public messageCreateBuffer: Discord.Message[] = [];
    public channelsCreated: boolean = false;

    //Utils
    private db!:sqlite.Database;
    private _manager: ServiceManager;
    private _bot!: DiscordInstance;

    //Constructor
    constructor(serviceMgr: ServiceManager){
        this._manager = serviceMgr;
        Logger.log("Trying to initialize...", "LoggerService");
        this._manager.once("discordInstanceReady", async (dInstance)=>{
            this._bot = dInstance;
            this.db = new (sqlite.verbose()).Database(path.join(__dirname, "../../Databases", "logger.sqlite"), (err)=>{
                if(err){
                    Logger.error("Cannot initialize service. Database connection error: "+err.message, "LoggerService");
                    return;
                }else{
                    this.createTables();
                    Logger.log("Discord instance provided. Fetching channels...", "LoggerService");
                    this.initializeChannels((done=>{
                        if(done){
                            this.channelsCreated = done;
                            Logger.log("Starting intervals.", "LoggerService");
                            this.messageAddingInterval();
                            Logger.log("Fetching event listeners...", "LoggerService");
                            this.fetchEventListener();
                        }
                    }));
                }
            })
        })
    }

    //Utils
    private fetchEventListener(){
        let listeners = path.join(__dirname, "Listeners");
        fs.readdirSync(listeners).forEach(file=>{
            if(file.includes(".ts")||file.includes(".js")){
                let filePath = path.join(listeners, file);
                (require(filePath).default)(this);
            }
        })
    }

    private async initializeChannels(callback: (arg0: boolean) => void){
        if(this.channelsCreated) {callback(true); return;}
        let guild = await this._bot.guilds.fetch(process.env.GUILD_ID as string);
        let channels = (await guild.channels.fetch()).map(channels=>channels);
        for (const channel of channels) {
            if(channel.type == "GUILD_CATEGORY" && channel.name == process.env.LOG_CATEGORY_NAME){
                this.LogCategory = channel;
                let found_channels: string[] = [];
                for await (const child of channel.children.values()){
                    if(child.type == "GUILD_TEXT" && this.LogChannelNames.includes(child.name)) found_channels.push(child.name);
                }
                if(found_channels.length != this.LogChannelNames.length){
                    for (const channelName of this.LogChannelNames) {
                        if(!found_channels.includes(channelName)){
                            await this.LogCategory.createChannel(channelName);
                            Logger.log(`Created ${channelName} channel.`, "LoggerService");
                        }
                    }
                }
                break;
            }else{
                let category = await guild.channels.create(
                    (process.env.LOG_CATEGORY_NAME as string), 
                    {
                        type: "GUILD_CATEGORY",
                        permissionOverwrites:[{
                            id: guild.roles.everyone.id,
                            deny: [Discord.Permissions.FLAGS.VIEW_CHANNEL]
                        }]
                    });
                this.LogCategory = category;
                for (const channelName of this.LogChannelNames) {
                    let newChannel = await category.createChannel(channelName);
                }
                break;
            }
        }
        for (const channel of this.LogCategory?.children.values()!) {
            if(channel.type == "GUILD_TEXT" && this.LogChannelNames.includes(channel.name))
                this.LogChannels.push(channel);
        }
        callback(true);
    }

    private messageAddingInterval(){
        setInterval(()=>{
            if(this.messageCreateBuffer.length != 0){
                let tempBuffor = this.messageCreateBuffer;
                this.messageCreateBuffer = [];
                let serialized: any[] = [];
                let query = "INSERT INTO messagecreate (messageId, channelId, channelName, authorId, authorTag, messageContent, timestamp) VALUES (?,?,?,?,?,?,?);"
                tempBuffor.forEach(message=>{
                    serialized.push([message.id, message.channel.id, (message.channel as Discord.GuildChannel).name, message.author.id, message.author.tag, message.content, message.createdTimestamp]);
                });
                if(serialized.length>0){
                    let statement = this.db.prepare(query);
                    for (let index = 0; index < serialized.length; index++) {
                        const ins = serialized[index];
                        statement.run(ins, (err)=>{
                            if(err) console.error(err);
                        });
                    }
                    statement.finalize();
                }
            }
        }, 10000);
    }

    //Database
    private createTables(){
        for (const sql of LoggerTables) {
            this.db.run(sql, (err)=>{
                if(err) Logger.error("Got error while creating table: "+err.message, "LoggerService");
            })
        }
    }


    //Get/Set
    public getLogChannel(channelName: "channel-create" | "channel-delete"| "channel-update"| "message-delete"| "message-update"| "guild-ban-add"| "guild-ban-remove" | "warning-add" | "warning-remove" | "warning-update"): Discord.TextChannel|undefined{
        for (const channel of this.LogChannels) {
            if(channel.name == channelName){
                return channel;
            }
        }
        return undefined;
    }

    public get serviceManager(): ServiceManager {
        return this._manager;
    }
    public get discordInstance(): DiscordInstance{
        return this._bot;
    }
    public get database(): sqlite.Database{
        return this.db;
    }
}