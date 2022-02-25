import Discord from "discord.js";
import EmbedTemplate from "../../../Discord/Templates/EmbedTemplate";
import Logger from "../../../Utils/Logger";
import LoggerService from "../LoggerService";

//todo: add embed
//todo: fix move channel crash
export default function channelUpdateListener(service: LoggerService){
    Logger.log("Listening to channelUpdate event.", "LoggerService | channelUpdateListener()");
    service.discordInstance.on("channelUpdate", (oldChannel, newChannel)=>{
        if(oldChannel instanceof Discord.GuildChannel && newChannel instanceof Discord.GuildChannel){
            let type = "UPDATE";
            let timestamp = new Date().getTime();
            let channelId = oldChannel.id;
            let executorId: string | undefined;
            let executorTag: string | undefined;
            let additionalInfo: any[] = [];

            if(oldChannel instanceof Discord.TextChannel && newChannel instanceof Discord.TextChannel){
                //Overview
                newChannel.guild.fetchAuditLogs({limit: 1, type: "CHANNEL_UPDATE"}).then(overviewChange=>{
                    let log = overviewChange.entries.first();
                    if(newChannel.id == log?.target.id){
                        let target = log.target as Discord.TextChannel;
                        if(oldChannel.name != target.name 
                            || oldChannel.rateLimitPerUser != target.rateLimitPerUser
                            || oldChannel.topic != target.topic
                            || oldChannel.nsfw != target.nsfw
                            || oldChannel.defaultAutoArchiveDuration != target.defaultAutoArchiveDuration){
                                executorId = overviewChange.entries.first()?.executor?.id;
                                executorTag = overviewChange.entries.first()?.executor?.tag;
                                log.changes?.forEach(change=>{
                                    additionalInfo.push({type:"overview", key: change.key, old: change.old, new: change.new});
                                })
                        }
                    }
                }).then(()=>{
                    newChannel.guild.fetchAuditLogs({limit: 1, type:"CHANNEL_OVERWRITE_CREATE"}).then(overwriteChange=>{
                        let log = overwriteChange.entries.first();
                        if(newChannel.id == log?.target.id){
                            if(log.changes){
                                let permGroup = log.extra;
                                for (const change of log.changes) {
                                    if(change.key == "id"){
                                        if(oldChannel.permissionOverwrites.cache.get(change.new as string)){
                                            break;
                                        }
                                    }
                                    if(change.key != "allow" && change.key != "deny")
                                        additionalInfo.push({type: "overwrite_create", permHolder: permGroup instanceof Discord.Role?"role":"user", permHolderId: permGroup.id, key: change.key, old: change.old, new: change.new});
                                }
                                executorId = overwriteChange.entries.first()?.executor?.id;
                                executorTag = overwriteChange.entries.first()?.executor?.tag;
                            }
                        }
                    }).then(()=>{
                        newChannel.guild.fetchAuditLogs({limit: 1, type:"CHANNEL_OVERWRITE_DELETE"}).then(overwriteChange=>{
                            let log = overwriteChange.entries.first();
                            if(newChannel.id == log?.target.id){
                                if(log.changes){
                                    let permGroup = log.extra;
                                    for (const change of log.changes) {
                                        if(change.key == "id"){
                                            if(!oldChannel.permissionOverwrites.cache.get(change.old as string)){
                                                break;
                                            }
                                        }
                                        if(change.key != "allow" && change.key != "deny")
                                            additionalInfo.push({type: "overwrite_delete", permHolder: permGroup instanceof Discord.Role?"role":"user", permHolderId: permGroup.id, key: change.key, old: change.old, new: change.new});
                                    }
                                    executorId = overwriteChange.entries.first()?.executor?.id;
                                    executorTag = overwriteChange.entries.first()?.executor?.tag;
                                }
                            }
                        }).then(()=>{
                            newChannel.guild.fetchAuditLogs({limit: 1, type:"CHANNEL_OVERWRITE_UPDATE"}).then(overwriteChange=>{
                                let log = overwriteChange.entries.first();
                                if(newChannel.id == log?.target.id){
                                    if(log.changes){
                                        let permGroup = log.extra;
                                        let allowLog = [];
                                        let denyLog = [];
                                        let breaks = false;
                                        if(!oldChannel.permissionOverwrites.cache.get(permGroup.id)){
                                            breaks=true;
                                        }
                                        for (const change of log.changes) {
                                            change.key == "allow"? allowLog.push(change): denyLog.push(change);
                                        }
                                        if(allowLog.length>0 && denyLog.length >0){
                                            if((oldChannel.permissionOverwrites.cache.get(permGroup.id)?.allow.bitfield 
                                                        == BigInt(allowLog[allowLog.length-1].new as string))
                                                && (oldChannel.permissionOverwrites.cache.get(permGroup.id)?.deny.bitfield 
                                                        == BigInt(denyLog[denyLog.length-1].new as string))
                                                ){
                                                    breaks = true;
                                                }
                                        }else if(allowLog.length == 0 && denyLog.length >0){
                                            if(oldChannel.permissionOverwrites.cache.get(permGroup.id)?.deny.bitfield 
                                            == BigInt(denyLog[denyLog.length-1].new as string))
                                            {
                                                breaks = true;
                                            }
                                        }else if(allowLog.length>0 && denyLog.length == 0){
                                            if(oldChannel.permissionOverwrites.cache.get(permGroup.id)?.allow.bitfield 
                                            == BigInt(allowLog[allowLog.length-1].new as string))
                                            {
                                                breaks = true;
                                            }
                                        }
                                        if(!breaks){
                                            for(const change of log.changes){
                                                additionalInfo.push({type:"overwrite_update", permHolder: permGroup instanceof Discord.Role?"role":"user", permHolderId: permGroup.id, key: change.key, old: change.old, new: change.new});
                                            }
                                        }  
                                        executorId = overwriteChange.entries.first()?.executor?.id;
                                        executorTag = overwriteChange.entries.first()?.executor?.tag;
                                    }
                                }
                            }).finally(()=>{
                                service.database.run(`INSERT INTO channel(type, channelId, channelName, executorId, executorTag, additionalInfo, timestamp) VALUES ("${type}", ${channelId}, "${newChannel.name}", ${executorId}, "${executorTag}", '{"info":${JSON.stringify(additionalInfo)}}', ${timestamp});`, (_err:any)=>{
                                    if(_err) console.error(_err);
                                });
                            })
                        })
                    });
                });
            }      
        }
    });
}