import { SlashCommandBuilder } from "@discordjs/builders";
import Discord, { Message, MessageEmbed, Permissions } from "discord.js";
import ServiceManager from "../../../Managers/ServiceManager";
import WarnService from "../../Warn/WarnService";
import CommandService from "../CommandService";

export default class warnCommand extends SlashCommandBuilder{
    public Name: string = "warn";
    public Subcommands: string[] = ["add", "check", "remove"];

    private service: CommandService;
    // /warn add <user> <reason>
    constructor(service: CommandService){
        super();
        this.service = service;
        this.setName(this.Name);
        this.setDescription("Komenda administracyjna.");
        this.addSubcommand(subcommand =>
            subcommand
            .setName("add")
            .setDescription("Dodaj ostrzezenie")
            .addUserOption(option=>
                option.setName("dla_kogo")
                .setDescription("Osoba ktorej chcesz nadac warna")
                .setRequired(true)
            ).addStringOption(option=>
                option.setName("powod")
                .setDescription("Powód dla którego chcesz nadać ostrzeżenie")
                .setRequired(false))
        ).addSubcommandGroup(scmdg=>
            scmdg.setName("check")
            .setDescription("Sprawdz ostrzezenia")
            .addSubcommand(subcmd=>
                subcmd.setName("user")
                .setDescription("Pobierz ostrzeżenia uzytkownika")
                .addUserOption(option=>
                    option.setName("czyje")
                    .setDescription("Czyje ostrzezenia chesz pobrać?")
                    .setRequired(true)
                )
            ).addSubcommand(subcmd=>
                subcmd.setName("last")
                .setDescription("Pobierz ostatnie x ostrzeżeń")
                .addIntegerOption(option=>
                    option.setName("ilosc")
                    .setDescription("Podaj ilosc ostrzezen do pobrania.")
                    .setRequired(true)
                )
            )
        )
        this.handle();
    }

    private handle(){
        this.service.discordInstance.on("interactionCreate", async interaction=>{
            if (!interaction.isCommand()) return;
            if(interaction.options.getSubcommand() == "add"){
                if(interaction.guild?.roles.cache.find(role=>role.name == process.env.WARNING_SYSTEM_ROLE_NAME)?.members.find(member=>member.id == interaction.member?.user.id) 
                || (interaction.member?.permissions as Permissions).has(Permissions.FLAGS.ADMINISTRATOR)){
                    if(interaction.member?.user.id != interaction.options.getUser("dla_kogo")?.id){
                        let user = interaction.options.getUser("dla_kogo") as Discord.User;
                        let warnedMember = await this.service.discordInstance.guilds.cache.get(process.env.GUILD_ID as string)?.members.cache.get(user.id);
                        if(!warnedMember?.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
                            await (this.service.ServiceManager.getService("WarnService") as WarnService).database.run('INSERT INTO warn (executorId, executorTag, warnedId, warnedTag, reason, timestamp) VALUES (?,?,?,?,?,?);',
                            [interaction.member?.user.id, interaction.member?.user.username+"#"+interaction.member?.user.discriminator, user.id, user.tag, interaction.options.getString("powod"), new Date().getTime()],
                            (err)=>{
                                if(err){
                                    console.error(err);
                                    interaction.reply({embeds:[new MessageEmbed().setDescription("Internal server error 🤡")], ephemeral:true});
                                    return;
                                }else{
                                    this.service.ServiceManager.emit("warningAdd", interaction.member?.user, user, interaction.options.getString("powod"));
                                    interaction.reply({embeds:[new MessageEmbed().setDescription(`Nałożono ostrzeżenie dla ${user.username}.`)], ephemeral:true})
                                }
                            })
                        }else
                            interaction.reply({embeds:[new MessageEmbed().setDescription("Nie możesz nadać ostrzeżenia administratorowi.")], ephemeral:true})
                    }else
                        interaction.reply({ embeds: [new MessageEmbed().setDescription("Nie możesz sam sobie nadać ostrzeżenia.")], ephemeral: true })
                }
                else
                    interaction.reply({ embeds: [new MessageEmbed().setDescription("Nie posiadasz uprawnień do użycia tej komendy.")], ephemeral: true });
            }else if(interaction.options.getSubcommandGroup() == "check"){
                await interaction.reply("kox2");
            }
        })
    }

    public getCommand(): this{
        return this;
    }
}
