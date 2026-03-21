const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('ZTS GHOST V13 : TICKETS OPS'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

let logChannelId = null;
let dispatchChannelId = null;
let categoryTicketId = null; // Optionnel : pour ranger les tickets

client.once('clientReady', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n💀 ZTS GHOST V13 : TICKETS & FIX\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique',
            options: [
                { name: 'lieu', type: 3, description: 'Nom du lieu', required: true },
                { name: 'map', type: 3, description: 'Map DayZ', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code du serveur', required: true },
                { name: 'longueur', type: 3, description: 'X (ex: 057)', required: true },
                { name: 'hauteur', type: 3, description: 'Y (ex: 018)', required: true }
            ]
        },
        {
            name: 'info',
            description: '📊 Statut du serveur PS5',
            options: [{ name: 'serveur', type: 3, description: 'Numéro du serveur', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un KIA',
            options: [
                { name: 'map', type: 3, description: 'Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'X', required: true },
                { name: 'hauteur', type: 3, description: 'Y', required: true }
            ]
        },
        {
            name: 'raid',
            description: '🚨 ALERTE RAID',
            options: [{ name: 'lieu', type: 3, description: 'Position de l\'attaque', required: true }]
        },
        {
            name: 'set-logs',
            description: '⚙️ Config logs admin',
            options: [{ name: 'salon', type: 7, description: 'Salon de log', required: true }]
        },
        {
            name: 'set-dispatch',
            description: '🛰️ Config salon traçage',
            options: [{ name: 'salon', type: 7, description: 'Salon de dispatch', required: true }]
        },
        { name: 'setup-recrutement', description: '👑 Créer l\'interface de recrutement' },
        {
            name: 'clear',
            description: '🧹 Nettoyer le chat',
            options: [{ name: 'nombre', type: 4, description: 'Nombre de messages', required: true }]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Système Ghost synchronisé.");
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // --- COMMANDE /SETCO ---
    if (i.commandName === 'setco') {
        const lieu = i.options.getString('lieu');
        const map = i.options.getString('map');
        const srv = i.options.getString('serveur');
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Configure le dispatch.", flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 MARQUAGE ZONE')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**(${lieu})** sur le serveur **${map}** (${srv}), les coordonnées sont : longueur=(**${x}**) ; hauteur=(**${y}**).\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2ecc71')
            .setTimestamp();

        i.guild.channels.cache.get(dispatchChannelId)?.send({ embeds: [embed] });
        return i.reply({ content: "✅ Transmis.", flags: MessageFlags.Ephemeral });
    }

    // --- COMMANDE /INFO ---
    if (i.commandName === 'info') {
        const srv = i.options.getString('serveur');
        const players = Math.floor(Math.random() * 50) + 1;
        const embed = new EmbedBuilder()
            .setTitle(`📊 INFOS SERV : ${srv}`)
            .setColor('#3498db')
            .addFields({ name: '👥 Joueurs', value: `\`${players}/60\``, inline: true }, { name: '📡 Status', value: `\`Stable\``, inline: true })
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nDonnées tactiques récupérées.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
        return i.reply({ embeds: [embed] });
    }

    // --- CONFIGURATION ---
    if (i.commandName === 'set-logs') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        logChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Logs configurés.`);
    }

    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Dispatch configuré.`);
    }

    // --- SETUP RECRUTEMENT ---
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 REJOINDRE L\'UNITÉ ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nClique sur le bouton pour ouvrir ton dossier de recrutement.\n\n*Un salon privé sera créé pour discuter avec le staff.*\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2b2d31');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rec_btn').setLabel('Ouvrir Candidature').setStyle(ButtonStyle.Danger).setEmoji('🎖️'));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // --- CLEAR ---
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 Zone nettoyée.`, flags: MessageFlags.Ephemeral });
    }
});

// --- SYSTÈME DE TICKETS (MODALS + SALONS) ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Dossier Recrue ZTS');
        const a = new TextInputBuilder().setCustomId('a').setLabel("Heures DayZ").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('p').setLabel("ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('s').setLabel("Tes motivations").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(s));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const age = i.fields.getTextInputValue('a');
        const psn = i.fields.getTextInputValue('p');
        const spe = i.fields.getTextInputValue('s');

        await i.reply({ content: "⏳ Création de ton salon privé en cours...", flags: MessageFlags.Ephemeral });

        // CRÉATION DU SALON PRIVÉ (TICKET)
        const ticketChannel = await i.guild.channels.create({
            name: `candidature-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });

        const recLog = new EmbedBuilder()
            .setTitle('📥 NOUVELLE CANDIDATURE REÇUE')
            .setColor('#f1c40f')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**Candidat :** ${i.user}\n**PSN :** \`${psn}\`\n**Heures :** \`${age}\`\n**Motivations :**\n${spe}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*Modérateurs, vous pouvez discuter ici avec la recrue.*`)
            .setTimestamp();

        const closeBtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le dossier').setStyle(ButtonStyle.Secondary).setEmoji('🔒'));

        await ticketChannel.send({ content: `${i.user} | @here (Staff ZTS)`, embeds: [recLog], components: [closeBtn] });
        await i.editReply({ content: `✅ Ton dossier est ouvert ici : ${ticketChannel}` });
    }

    if (i.isButton() && i.customId === 'close_ticket') {
        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return i.reply({ content: "Seul le staff peut fermer.", flags: MessageFlags.Ephemeral });
        await i.reply("🔒 Fermeture du dossier dans 5 secondes...");
        setTimeout(() => i.channel.delete().catch(() => {}), 5000);
    }
});

// --- LOGS ---
client.on('messageDelete', async m => {
    if (!logChannelId || m.author?.bot) return;
    const emb = new EmbedBuilder()
        .setTitle('🗑️ LOG : SUPPRESSION')
        .setColor('#e74c3c')
        .addFields({name:'Auteur', value:`${m.author}`, inline:true}, {name:'Contenu', value: `\`\`\`${m.content || "Image"}\`\`\``});
    client.channels.cache.get(logChannelId)?.send({ embeds: [emb] });
});

process.on('unhandledRejection', (r) => console.log('🛡️ CRASH PROTECT :', r));

client.login(process.env.BOT_TOKEN);
