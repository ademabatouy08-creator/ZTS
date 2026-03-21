const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('ZTS GENESIS V2 IS ONLINE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

let autoRoleId = null;
let logChannelId = null;

client.once('clientReady', async () => {
    console.log(`🔱 ZTS FIX : ${client.user.tag}`);
    
    const commands = [
        {
            name: 'setup-embed',
            description: 'Créer un socle d\'embed',
            options: [
                { name: 'salon', type: 7, description: 'Salon de l\'annonce', required: true },
                { name: 'titre', type: 3, description: 'Titre de l\'embed', required: true },
                { name: 'desc', type: 3, description: 'Description de l\'embed', required: true }
            ]
        },
        {
            name: 'add-option',
            description: 'Ajouter un bouton Ticket ou Rôle',
            options: [
                { name: 'msg_id', type: 3, description: 'ID du message de l\'embed', required: true },
                { name: 'type', type: 3, description: 'Type de bouton', required: true, choices: [{name:'Ticket', value:'tk'}, {name:'Rôle', value:'rl'}] },
                { name: 'nom', type: 3, description: 'Nom affiché sur le bouton', required: true },
                { name: 'cible', type: 8, description: 'Rôle à donner ou à ping', required: true }
            ]
        },
        {
            name: 'set-logs',
            description: 'Configurer le salon des logs',
            options: [{ name: 'salon', type: 7, description: 'Salon pour les logs admin', required: true }]
        },
        {
            name: 'set-autorole',
            description: 'Configurer le rôle automatique',
            options: [{ name: 'role', type: 8, description: 'Rôle donné à l\'arrivée', required: true }]
        },
        {
            name: 'purge',
            description: 'Réinitialise le salon actuel (Attention !)'
        },
        {
            name: 'kick',
            description: 'Expulser un membre',
            options: [
                { name: 'membre', type: 6, description: 'Le membre à expulser', required: true },
                { name: 'raison', type: 3, description: 'La raison du kick', required: false }
            ]
        },
        {
            name: 'meme',
            description: 'Affiche un meme aléatoire'
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("✅ Commandes synchronisées avec succès !");
    } catch (err) {
        console.error("Erreur de synchro :", err);
    }
});

client.on('interactionCreate', async i => {
    if (i.isChatInputCommand()) {
        
        // --- NUKE ---
        if (i.commandName === 'nuke') {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return i.reply({content: "Permissions insuffisantes.", flags: MessageFlags.Ephemeral});
            const position = i.channel.position;
            const newChan = await i.channel.clone();
            await i.channel.delete();
            await newChan.setPosition(position);
            return newChan.send("☢️ **Salon réinitialisé par ZTS Protection.**");
        }

        if (i.commandName === 'setup-embed') {
            const channel = i.options.getChannel('salon');
            const embed = new EmbedBuilder()
                .setTitle(`💎 ${i.options.getString('titre')}`)
                .setDescription(i.options.getString('desc'))
                .setColor('#2B2D31')
                .setTimestamp();
            await channel.send({ embeds: [embed] });
            return i.reply({ content: "✅ Embed envoyé.", flags: MessageFlags.Ephemeral });
        }
-
        if (i.commandName === 'set-logs') {
            logChannelId = i.options.getChannel('salon').id;
            return i.reply(`✅ Salon de logs défini sur <#${logChannelId}>`);
        }

        if (i.commandName === 'set-autorole') {
            autoRoleId = i.options.getRole('role').id;
            return i.reply(`✅ Auto-role défini sur <@&${autoRoleId}>`);
        }
    }

    if (i.isButton()) {
        if (i.customId.startsWith('tk_')) {
            const [_, roleId, label] = i.customId.split('_');
            const modal = new ModalBuilder().setCustomId(`m_${roleId}_${label}`).setTitle(`Support : ${label}`);
            const input = new TextInputBuilder().setCustomId('r').setLabel("Raison de l'ouverture").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await i.showModal(modal);
        }

        if (i.customId.startsWith('rl_')) {
            const rId = i.customId.split('_')[1];
            if (i.member.roles.cache.has(rId)) {
                await i.member.roles.remove(rId);
                return i.reply({ content: "Rôle retiré ➖", flags: MessageFlags.Ephemeral });
            } else {
                await i.member.roles.add(rId);
                return i.reply({ content: "Rôle ajouté ➕", flags: MessageFlags.Ephemeral });
            }
        }
    }

    if (i.isModalSubmit() && i.customId.startsWith('m_')) {
        const [_, rId, lab] = i.customId.split('_');
        const reason = i.fields.getTextInputValue('r');
        const chan = await i.guild.channels.create({
            name: `ticket-${lab}-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: rId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });
        await chan.send({ content: `<@&${rId}>`, embeds: [new EmbedBuilder().setTitle(lab).setDescription(`Auteur: ${i.user}\nRaison: ${reason}`).setColor('Blue')] });
        return i.reply({ content: `✅ Ticket créé : ${chan}`, flags: MessageFlags.Ephemeral });
    }
});

client.on('messageDelete', async m => {
    if (!logChannelId || m.author?.bot) return;
    const logChan = m.guild.channels.cache.get(logChannelId);
    if (logChan) {
        const logEmb = new EmbedBuilder().setTitle('🗑️ Message Supprimé').setColor('Red').addFields({name:'Auteur', value:`${m.author}`, inline:true}, {name:'Salon', value:`${m.channel}`, inline:true}, {name:'Message', value:`\`\`\`${m.content || "Image"}\`\`\``});
        logChan.send({ embeds: [logEmb] });
    }
});

client.on('guildMemberAdd', member => {
    if (autoRoleId) member.roles.add(autoRoleId).catch(() => {});
});

process.on('unhandledRejection', e => console.log('ANTI-CRASH :', e));
client.login(process.env.BOT_TOKEN);
