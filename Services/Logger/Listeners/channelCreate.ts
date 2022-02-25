import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function channelCreateListener(service: LoggerService){
    Logger.log("Listening to channelCreate event.", "LoggerService | channelCreateListener()");
    service.discordInstance.on("channelCreate", (channel)=>{
        let type = "CREATE";
        let timestamp = new Date().getTime();
        let channelId = channel.id;
        let channelName = channel.name;
        let executorId: string | undefined;
        let executorTag: string | undefined;
        let executor: Discord.User;
        channel.guild.fetchAuditLogs({limit: 1, type: "CHANNEL_CREATE"}).then(v=>{
            executorId = v.entries.first()?.executor?.id;
            executorTag = v.entries.first()?.executor?.tag;
            executor = (v.entries.first()?.executor as Discord.User);
        }).finally(()=>{
            service.database.run(`INSERT INTO channel(type, channelId, channelName, executorId, executorTag, additionalInfo, timestamp) VALUES ("${type}", ${channelId}, "${channelName}", ${executorId}, "${executorTag}", "{}", ${timestamp});`, (_err:any)=>{
                if(_err) console.error(_err);
                else{
                    (service.getLogChannel("channel-create") as Discord.TextChannel).send({embeds: [
                        new EmbedTemplate(
                            `Kanał ${channel.name} został utworzony.`,
                            executor, 
                            new Date().getTime(),
                            `Data utworzenia: `,
                            {name: "Nazwa", value: channelName},
                            {name: "Identyfikatory", value: "```markdown\n[Creator]: "+executorId+"\n[ChannelId]: "+channelId+"```"}
                        )
                    ]});
                }
            });
        });
    })
}