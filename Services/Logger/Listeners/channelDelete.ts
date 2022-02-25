import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function channelDeleteListener(service: LoggerService){
    Logger.log("Listening to channelDelete event.", "LoggerService | channelDeleteListener()");
    service.discordInstance.on("channelDelete", (channel)=>{
        let type = "DELETE";
            let timestamp = new Date().getTime();
            let channelId = channel.id;
            let executorId: string | undefined;
            let executorTag: string | undefined;
            let executor: Discord.User;
            if(channel instanceof Discord.GuildChannel){
                let channelName = channel.name;
                channel.guild.fetchAuditLogs({limit: 1, type: "CHANNEL_DELETE"}).then(v=>{
                    executorId = v.entries.first()?.executor?.id;
                    executorTag = v.entries.first()?.executor?.tag;
                    executor = (v.entries.first()?.executor as Discord.User);
                }).finally(()=>{
                    service.database.run(`INSERT INTO channel(type, channelId, channelName, executorId, executorTag, additionalInfo, timestamp) VALUES ("${type}", ${channelId}, "${channelName}", ${executorId}, "${executorTag}", "{}", ${timestamp});`, (_err:any)=>{
                        if(_err) console.error(_err);
                        else{
                            (service.getLogChannel("channel-delete") as Discord.TextChannel).send({embeds: [
                                new EmbedTemplate(
                                    `Kanał ${channel.name} został usunięty.`,
                                    executor, 
                                    new Date().getTime(),
                                    `Data usunięcia: `,
                                    {name: "Nazwa", value: channelName},
                                    {name: "Identyfikatory", value: "```markdown\n[Remover]: "+executorId+"\n[ChannelId]: "+channelId+"```"}
                                )
                            ]});
                        }
                    });
                });
            }
    })
}