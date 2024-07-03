const Discord = require("discord.js");
const config = require("./config.json");
const { ActivityType } = require("discord.js");
const client = new Discord.Client({
    intents: [3276799]
});

module.exports = client

const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { JsonDatabase } = require("wio.db");
const db1 = new JsonDatabase({ databasePath: "./databases/myJsonRegistro.json" });
const db2 = new JsonDatabase({ databasePath: "./databases/myJsonConfig.json" });
const mysql2 = require('mysql2/promise');

const db3 = new JsonDatabase({ databasePath: ".databases/myJsonWhitelist.json" });
client.on('interactionCreate', (interaction) => {

    if(interaction.type === Discord.InteractionType.ApplicationCommand){
        const cmd = client.slashCommands.get(interaction.commandName);
        if(!cmd) return interaction.reply(`Error`);
        interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);
        cmd.run(client, interaction)
    }
})

client.slashCommands = new Discord.ALLOWED_EXTENSIONS.Collection();

require('./handler/index.js')(client);

client.on('ready', async () => {
    console.clear();
    let ativy = [
        `⚔️| Thug Life RolePlay`,
        `🌐| Versão v${require('discord.js').version.slice(0,6)}`,
    ],
    at = 0;
    await setInterval(() => client.user.setPresence({
        activities: [
            {
                name: `${ativy[at++ % ativy.length]}`,
                type: ActivityType.Watching
            }
        ],
        status: 'dnd'
    }), 1000 * 5)
    await console.log(("\n[info]: ") + `✔️ Bot OnLine ${client.user.username}`)
});

client.on('interactionCreate', async (interaction) => {
    if(interaction.isButton()) {
        if(interaction.customId === 'wl1') {
            const userId = interaction.userId;

            const modal100 = new Discord.ModalBuilder()
                .setCustomId('modal100')
                .setTitle(`$(interaction.guild.name)`);

            const idjogo = new Discord.TextInputBuilder()
                .setCustomId('idjogo')
                .setLabel('Qual seu ID?')
                .setMaxLenght(6)
                .setMinLenght(1)
                .setPlaceholder('Informe seu id-game')
                .setStyle(Discord.TextInputStyle.Short);

            const nomeper = new Discord.TextInputBuilder()
                .setCustomId('nomeper')
                .setLabel('Qual nome do seu Personagem ?')
                .setMaxLength(20)
                .setMinLength(1)
                .setPlaceholder('Informe seu nome in-game')
                .setStyle(Discord.TextInputBuilder.Short);

            const p1 = new Discord.ActionRowBuilder().addComponents(idjogo);
            const p2 = new Discord.ActionRowBuilder().addComponents(nomeper);
            modal100.addComponents(p1,p2);
            await interaction.showModal(modal100);
        }
    } else if(interaction.isModalSubmit()) {
        if(interaction.customId === 'modal100') {
            const idJogo = interaction.fields.getTextInputValue('idjogo');
            const nomePersonagem = interaction.fields.getTextInputValue('nomeper');

            const member = interaction.appPermissions.member;

            const localhostDB = await db.get(`localhostp1.prod`);
            const nameuserDB = await db.get(`nameuserp1.prod`);
            const passwordDB = await db.get(`passwordp1.prod`);
            const name101DB = await db.get(`namedbp1.prod`);
            if(localhostDB && nameuserDB && passwordDB && name101DB) {
                try {
                    const con = await mysql2.createPool({
                        host: `${localhostDB}`,
                        user: `${nameuserDB}`,
                        password: `${passwordDB}`,
                        database: `${name101DB}`,
                    });
                // Verificar Whitlist
                const [whitelistRows] = await con.execute(`SELECT whitelisted FROM vrp_user WHERE id = ?`, [idJogo]);
                const hasWhitelist = whitelistRows.length > 0 && whitelistRows[0].hasWhitelist === 1;

                if(hasWhitelist) {
                    interaction.reply({ content: `O id especificado já possui Whitelist.`, ephemeral: true});
                    return;
                }
                
                const [idExistsRows] = await con.execute(`SELECT COUNT(*) AS count, discord FROM vrp_users WHERE id = ?`, [idJogo]);
                const idExists = idExistsRows[0].count > 0;
                const discordInDatabase = idExistsRows[0].discord;
                if(discordInDatabase && discordInDatabase !== interaction.userId) {
                    interaction.reply({ content: `Você não pode liberar um id que não é seu.`, ephemeral: true });
                    return;
                }

                if(!idExists) {
                    interaction.reply({ content: `O id especificado não existe no nosso banco de dados.`, ephemeral: true });
                    return;
                }

                const sql = `UPDATE vrp_users SET whitelisted = , discord = ? WHERE id = ?`;
                await con.execute(sql, [interaction.userId, idJogo]);
                const cargoAprovadoId = db3.get('whitelistConfig.cargoId');

                const cargoARemoverId = `whitelistConfig.cargoIdRemover`;

                if(cargoAprovadoId) {
                    if(member.roles.cache.has(cargoAprovadoId)) {
                        await member.roles.remove()
                    }
                }
                } catch (error) {
                    
                }
            }
        }
    }
})