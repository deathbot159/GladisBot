import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function messageUpdateListener(service: LoggerService){
    Logger.log("Listening to messageUpdate event.", "LoggerService | messageUpdateListener()");
    service.discordInstance.on("messageUpdate", (oldMessage, newMessage)=>{
        if(service.channelsCreated){
            if((oldMessage.channel instanceof Discord.TextChannel) && (newMessage.channel instanceof Discord.TextChannel)){
                service.database.run("INSERT INTO messageupdate (messageId, channelId, channelName, authorId, authorTag, oldMessageContent, newMessageContent, timestamp) VALUES (?,?,?,?,?,?,?,?);",
                [oldMessage.id, oldMessage.channel.id, oldMessage.channel.name, newMessage.author?.id, newMessage.author?.tag, oldMessage.content, newMessage.content, new Date().getTime()],
                (err)=>{
                    if(err) console.error(err);
                    else{
                        (service.getLogChannel("message-update") as Discord.TextChannel).send({embeds: [
                            new EmbedTemplate(
                                `Wiadomość na kanale <#${newMessage.channelId}> została zedytowana.`,
                                newMessage.author, 
                                new Date().getTime(),
                                `Data edycji: `,
                                {name: "Stara treść", value: (oldMessage.content as string)},
                                {name: "Nowa treść", value: (newMessage.content as string)}, 
                                {name: "Identyfikatory", value: "```markdown\n[Author]: "+newMessage.author?.id+"\n[Message]: "+newMessage.id+"\n```"}
                            )
                        ]});
                    }
                })
            }
        }
    });
}