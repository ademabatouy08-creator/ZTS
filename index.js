const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- KEEP-ALIVE RENDER ---
const app = express();
app.get('/', (req, res) => res.send('ZTS TITAN PS5 IS ACTIVE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel, Partials.Message]
});

// --- VARIABLES DE CONFIGURATION ---
let dispatchChannelId = null;
const blacklist = new Map();

client.once('clientReady', async () => {
    console.log(`🎮 ZTS TITAN PS5 CONNECTÉ : ${client.user.tag}`);
    
    const commands = [
        // --- SYSTÈME DE POSITION (SPAWN/DESPAWN) ---
        {
            name: 'position',
            description: '📍 Signaler un Log-In ou Log-Off (ZTS)',
            options: [
                { 
                    name: 'etat', 
                    type: 3, 
                    description: 'Action', 
                    required: true, 
                    choices: [{name: '📥 Connexion (Spawn)', value: 'spawn'}, {name: '📤 Déconnexion (Despawn)', value: 'despawn'}] 
                },
                { 
                    name: 'type', 
                    type: 3, 
                    description: 'Type de lieu', 
                    required: true, 
                    choices: [{name: '👤 Position Perso', value: 'Perso'}, {name: '🏰 Base Team', value: 'Base'}, {name: '📦 Cache / Loot', value: 'Cache'}] 
                },
                { name: 'serveur', type: 3, description: 'Code serv (Max 4 car. ex: DE22)', required: true },
                { name: 'coords', type: 3, description: 'Coordonnées (ex: 045 120)', required: true },
                { name: 'details', type: 3, description: 'Détails (ex: Dans le sapin)', required: false }
            ]
        },
        // --- COMMANDES TACTIQUES ---
        {
            name: 'raid',
            description: '🚨 ALERTE RAID : Mobilisation team ZTS',
            options: [{ name: 'lieu', type: 3, description: 'Où ça pète ?', required: true }]
        },
        {
            name: 'blacklist',
            description: '🚫 Ficher un ennemi ou un traître',
            options: [
                { name: 'nom', type: 3, description: 'Pseudo PSN', required: true },
                { name: 'raison', type: 3, description: 'Pourquoi ?', required: true }
            ]
        },
        {
            name: 'set-dispatch',
            description: '⚙️ Définir le salon où s\'affichent les positions',
            options: [{ name: 'salon', type: 7, description: 'Salon de traçage', required: true }]
        },
        // --- GESTION TICKETS/LOGS ---
        { name: 'setup-recrutement', description: 'Bouton candidature ZTS' },
        {
            name: 'setup-embed',
            description: 'Créer un magnifique embed',
            options: [
                { name: 'salon', type: 7, description: 'Salon', required: true },
                { name: 'titre', type: 3, description: 'Titre', required: true },
                { name: 'desc', type: 3, description: 'Texte', required: true }
            ]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Interface Tactique ZTS Synchronisée.");
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // --- LOGIQUE DE POSITION (L'ÉLÉMENT CENTRAL) ---
    if (i.commandName === 'position') {
        const etat = i.options.getString('etat');
        const type = i.options.getString('type');
        const serv = i.options.getString('serveur').substring(0, 4).toUpperCase();
        const coords = i.options.getString('coords');
        const details = i.options.getString('details') || 'Aucun détail';

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Le salon de dispatch n'est pas configuré. (/set-dispatch)", flags: MessageFlags.Ephemeral });

        const isSpawn = etat === 'spawn';
        const embed = new EmbedBuilder()
            .setAuthor({ name: i.user.username, iconURL: i.user.displayAvatarURL() })
            .setTitle(isSpawn ? `📥 CONNEXION : ${type}` : `📤 DÉCONNEXION : ${type}`)
            .setColor(isSpawn ? '#00FF00' : '#FF4500')
            .addFields(
                { name: '🎮 Serveur', value: `\`${serv}\``, inline: true },
                { name: '📍 Coordonnées', value: `\`${coords}\``, inline: true },
                { name: '📝 Infos', value: details }
            )
            .setThumbnail(isSpawn ? 'https://i.imgur.com/vH9v5Z9.png' : 'https://i.imgur.com/K3Zp8N6.png')
            .setFooter({ text: `ZTS DayZ Unit • PS5 Version` })
            .setTimestamp();

        const channel = i.guild.channels.cache.get(dispatchChannelId);
        if (channel) await channel.send({ embeds: [embed] });

        return i.reply({ content: `✅ Ton **${etat}** a été enregistré dans <#${dispatchChannelId}>.`, flags: MessageFlags.Ephemeral });
    }

    // --- SET DISPATCH ---
    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin seulement.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`🛰️ Le traçage des survivants est maintenant actif dans <#${dispatchChannelId}>.`);
    }

    // --- RAID ALERT ---
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const raidEmb = new EmbedBuilder()
            .setTitle('🚨 ALERTE RAID - UNITÉ ZTS 🚨')
            .setDescription(`**MOBILISATION GÉNÉRALE DEMANDÉE !**\n\n📍 **OBJECTIF :** ${lieu}\n🎮 **PRIORITÉ :** MAXIMALE`)
            .setColor('#FF0000')
            .setImage('https://i.imgur.com/8N7mZ6m.png')
            .setTimestamp();

        return i.reply({ content: '@everyone ⚔️ **CONTACT ENNEMI !**', embeds: [raidEmb] });
    }

    // --- BLACKLIST ---
    if (i.commandName === 'blacklist') {
        const nom = i.options.getString('nom');
        const raison = i.options.getString('raison');
        const blEmb = new EmbedBuilder()
            .setTitle('🚫 BLACKLIST - ENNEMI PUBLIC')
            .addFields({ name: 'PSN ID', value: `\`${nom}\``, inline: true }, { name: 'Crime', value: raison })
            .setColor('#2F3136')
            .setThumbnail('https://i.imgur.com/rN9S7aG.png');
        
        return i.reply({ embeds: [blEmb] });
    }
});

// --- SYSTÈME DE TICKETS / RECRUTEMENT (Le classique ZTS) ---
client.on('interactionCreate', async i => {
    if (i.isButton()) {
        if (i.customId === 'recruit_btn') {
            const modal = new ModalBuilder().setCustomId('rec_m').setTitle('Recrutement ZTS');
            const a = new TextInputBuilder().setCustomId('age').setLabel("Âge / Heures DayZ").setStyle(TextInputStyle.Short).setRequired(true);
            const p = new TextInputBuilder().setCustomId('psn').setLabel("Ton ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
            const s = new TextInputBuilder().setCustomId('spe').setLabel("Ta spécialité").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(s));
            return await i.showModal(modal);
        }
    }

    if (i.isModalSubmit() && i.customId === 'rec_m') {
        const age = i.fields.getTextInputValue('age');
        const psn = i.fields.getTextInputValue('psn');
        const spe = i.fields.getTextInputValue('spe');
        
        const log = new EmbedBuilder()
            .setTitle('📥 NOUVELLE RECRUE ZTS')
            .setColor('Gold')
            .addFields(
                { name: 'Membre', value: `${i.user}`, inline: true },
                { name: 'PSN', value: psn, inline: true },
                { name: 'Expérience', value: age, inline: true },
                { name: 'Spécialité', value: spe }
            );

        await i.reply({ content: "✅ Candidature envoyée !", flags: MessageFlags.Ephemeral });
        const logChan = i.guild.channels.cache.find(c => c.name.includes('recrutement'));
        if (logChan) logChan.send({ embeds: [log] });
    }
});

process.on('unhandledRejection', e => console.log('🛡️ ANTI-CRASH :', e));
client.login(process.env.BOT_TOKEN);
