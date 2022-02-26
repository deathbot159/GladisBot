import "dotenv/config"
import Discord from "discord.js";
import sqlite from "sqlite3";
import path from "path";
import moment from "moment";

import UsersTables from "../../Discord/SQLs/usersTables";
import ServiceManager from "../../Managers/ServiceManager";
import Logger from "../../Utils/Logger";
import LoggerService from "../Logger/LoggerService";
import EmbedTemplate from "../../Discord/Templates/EmbedTemplate";

export default class WarnService{
    public Name: string = "WarnService";

    //Utils
    private _manager: ServiceManager;
    private _bot!: Discord.Client;
    private db!: sqlite.Database;

    //Contructor
    constructor(serviceMgr: ServiceManager){
        moment.locale("pl");
        this._manager = serviceMgr;
        Logger.log("Trying to initialize...", "WarnService");
        this._manager.once("discordInstanceReady", (dInstance)=>{
            this._bot = dInstance;
            this.db = new (sqlite.verbose()).Database(path.join(__dirname, "../../Databases/", "users.sqlite"), (err)=>{
                if(err){
                    Logger.error("Cannot initialize service. Database connection error: "+err.message, "WarnService");
                    return;
                }else{
                    this.createTables();
                    Logger.log("Discord instance provided. Checking roles...", "WarnService");
                    this.initializeRoles(done=>{
                        if(done){
                            this._manager.on("warningAdd", async (executor, warned, reason)=>{
                                let warnedMember = await this._bot.guilds.cache.get(process.env.GUILD_ID as string)?.members.cache.get(warned.id);
                                this.db.all("SELECT * FROM warn WHERE warnedId=?", [warned.id],
                                (err, rows)=>{
                                    if(err) console.error(err);
                                    else{
                                        if(rows){
                                            switch (rows.length){
                                                case 1:
                                                    warnedMember?.timeout(10*60000, executor.tag+": "+reason);
                                                    break;
                                                case 2:
                                                    warnedMember?.timeout(1*3600000, executor.tag+": "+reason);
                                                    break;
                                                case 3:
                                                    warnedMember?.timeout(1*86400000, executor.tag+": "+reason);
                                                    break;
                                                case 4:
                                                    warnedMember?.ban({reason: executor.tag+": "+reason});
                                                    break;
                                            }
                                            (this._manager.getService("LoggerService") as LoggerService).getLogChannel("warning-add")?.send({embeds:[
                                                new EmbedTemplate(
                                                    `Użytkownik <@!${warned.id}> dostał ${rows.length==4?"ostateczne": ""} ostrzeżenie.`,
                                                    executor,
                                                    new Date().getTime(),
                                                    `Data dodania: `,
                                                    {name: "Ostrzeżony", value: `<@!${warned.id}> [${warnedMember?.user.tag}]<${warned.id}>`},
                                                    {name: "Administrator", value: `<@!${executor.id}> [${executor.tag}]<${executor.id}>`},
                                                    {name: "Liczba ostrzeżeń", value: `${rows.length}/4`},
                                                    {name: "Nałożono", value: `${(rows.length)<4?"Timeout'a na "+((rows.length)==1?"10 minut":(rows.length)==2?"1 godzinę":(rows.length)==3?"1 dzień":""):"Banicje."}`},
                                                    {name: "Powód: ", value: reason?reason:"Brak podanego powodu."},
                                                    {name: "Identyfikatory", value: "```markdown\n[Executor]: "+executor.id+"\n[Warned]: "+warned.id+"```"}
                                                )
                                            ]})
                                        }
                                    }
                                })
                            })
                        }
                    })
                }
            })
        })
    }

    //Utils
    private initializeRoles(callback: (done: boolean)=>void){
        this._bot.guilds.fetch(process.env.GUILD_ID as string).then((guild)=>{
            let found = false;
            for (const role of guild.roles.cache) {
                if(role[1].name == process.env.WARNING_SYSTEM_ROLE_NAME)
                    found = true;
            }
            if(!found)
                guild.roles.create({name: process.env.WARNING_SYSTEM_ROLE_NAME});
            else callback(true);
        })
    }

    //Database
    private createTables(){
        for (const sql of UsersTables) {
            this.db.run(sql, (err)=>{
                if(err) Logger.error("Got error while creating table: "+err.message, "WarnService");
            })
        }
    }

    public get database():sqlite.Database{
        return this.db;
    }
}