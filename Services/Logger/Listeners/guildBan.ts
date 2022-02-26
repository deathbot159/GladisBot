import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function guildBanListener(service: LoggerService){
    Logger.log("Listening to guildBan event.", "LoggerService | guildBanListener()");
    service.discordInstance.on("guildBanAdd", (ban)=>{
        if(service.channelsCreated){
            setTimeout(()=>{}, 900);
            ban.guild.fetchAuditLogs({type: "MEMBER_BAN_ADD", limit: 1}).then(logs=>{
                logs.entries.forEach(log=>{
                    if(log.target instanceof Discord.User){
                        if(log.target.id === ban.user.id){
                            service.database.run("INSERT INTO guildban (type, bannedId, bannedTag, executorId, executorTag, reason, timestamp) VALUES (?,?,?,?,?,?,?);",
                            ["ADD", log.target.id, `${log.target.username}#${log.target.discriminator}`, log.executor?.id, `${log.executor?.username}#${log.executor?.discriminator}`, log.reason, new Date().getTime()],
                            (err)=>{
                                if(err) console.error(err);
                                else{
                                    (service.getLogChannel("guild-ban-add") as Discord.TextChannel).send({embeds: [
                                        new EmbedTemplate(
                                            `Użytkownik ${ban.user.tag} został zbanowany.`,
                                            log.executor, 
                                            new Date().getTime(),
                                            `Data banicji: `,
                                            {name: "Powód", value: log.reason? log.reason: "Brak powodu"},
                                            {name: "Identyfikatory", value: "```markdown\n[Executor]: "+log.executor?.id+"\n[BannedId]: "+ban.user.id+"\n```"}
                                        )
                                    ]});
                                }
                            });
                        }
                    }
                })
            })
        }
    });
}