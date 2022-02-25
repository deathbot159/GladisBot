import "dotenv/config";
import Discord, { MessageEmbed } from "discord.js";

export default class EmbedTemplate extends MessageEmbed{
    constructor(desc?: string, author?: Discord.User | null, timestamp?:number|Date, footer?:string, ...fields: Discord.EmbedFieldData[]){
        super();
        this.setColor("#fc0362");
        if(desc){
            this.setDescription(desc);
        }
        if(author){
            this.setAuthor({name: author.tag, iconURL: author.avatarURL()!=null? (author.avatarURL() as string): undefined});
        }
        if(fields){
            fields.forEach(field=>{
                this.addField(field.name, field.value!=""?field.value:"-", field.inline);
            })
        }
        if(timestamp){
            this.setTimestamp(timestamp);
        }
        if(footer){
            this.setFooter({text: footer});
        }
    }
}