import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

export default function guildUnbanListener(service: LoggerService){
    Logger.log("Listening to guildUnban event.", "LoggerService | guildUnbanListener()");
    service.discordInstance.on("guildBanRemove", (ban)=>{
        setTimeout(()=>{}, 900);
        ban.guild.fetchAuditLogs({type: "MEMBER_BAN_REMOVE", limit: 1}).then(logs=>{
            logs.entries.forEach(log=>{
                if(log.target instanceof Discord.User){
                    if(log.target.id === ban.user.id){
                        service.database.run("INSERT INTO guildban (type, bannedId, bannedTag, executorId, executorTag, reason, timestamp) VALUES (?,?,?,?,?,?,?);",
                        ["REMOVE", log.target.id, `${log.target.username}#${log.target.discriminator}`, log.executor?.id, `${log.executor?.username}#${log.executor?.discriminator}`, "", new Date().getTime()],
                        (err)=>{
                            if(err) console.error(err);
                            else{
                                (service.getLogChannel("guild-ban-remove") as Discord.TextChannel).send({embeds: [
                                    new EmbedTemplate(
                                        `Użytkownik ${ban.user.tag} został odbanowany.`,
                                        log.executor, 
                                        new Date().getTime(),
                                        `Data cofnięcia banicji: `,
                                        {name: "Identyfikatory", value: "```markdown\n[Executor]: "+log.executor?.id+"\n[UnbannedId]: "+ban.user.id+"\n```"}
                                    )
                                ]});
                            }
                        });
                    }
                }
            })
        })
    })
}