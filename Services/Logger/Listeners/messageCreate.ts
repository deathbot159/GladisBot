import Discord from "discord.js";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function messageCreateListener(service: LoggerService){
    Logger.log("Listening to messageCreate event.", "LoggerService | messageCreateListener()");
    service.discordInstance.on("messageCreate", (message)=>{
        if(service.channelsCreated){
            if(message.channel instanceof Discord.TextChannel){
                if(!message.author.bot && !message.author.system)
                    service.messageCreateBuffer.push(message);
            }
        }
    })
}