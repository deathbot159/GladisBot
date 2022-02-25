import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function messageDeleteListener(service: LoggerService){
    Logger.log("Listening to messageDelete event.", "LoggerService | messageDeleteListener()");
    service.discordInstance.on("messageDelete", (message)=>{
        if(message.channel instanceof Discord.TextChannel){
            service.database.run("INSERT INTO messagedelete (messageId, channelId, channelName, authorId, authorTag, messageContent, timestamp) VALUES (?,?,?,?,?,?,?);",
            [message.id, message.channel.id, (message.channel as Discord.TextChannel).name, message.author?.id, message.author?.tag, message.content, new Date().getTime()],
            (err)=>{
                if(err) console.log(err);
                else{
                    (service.getLogChannel("message-delete") as Discord.TextChannel).send({embeds: [
                        new EmbedTemplate(
                            `Wiadomość na kanale <#${message.channelId}> została usunięta.`,
                            message.author, 
                            new Date().getTime(),
                            `Data usunięcia: `,
                            {name: "Treść", value: (message.content as string)?message.content as string:"[prawdopodobnie jakis embed]"}, 
                            {name: "Identyfikatory", value: "```markdown\n[Author]: "+message.author?.id+"\n[Message]: "+message.id+"\n```"}
                        )
                    ]});
                }
            })
        }
    });
}