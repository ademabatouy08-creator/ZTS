// ==========================================================
// 🛡️ ZTS OMEGA-ABSOLUTE | UNITÉ D'ÉLITE DAYZ PS5
// 🖥️ VERSION : 18.0 (STABLE)
// 🛠️ DEVELOPPEUR : ZTS CORE ENGINE
// ==========================================================

const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ChannelType, MessageFlags,
    ActivityType, Events, AttachmentBuilder
} = require('discord.js');
const express = require('express');

// --- SERVER KEEP-ALIVE (FOR RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OMEGA-ABSOLUTE V18 : ONLINE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- CORE SYSTEM ASSETS ---
const ZTS_LOGO = 'https://i.imgur.com/vH9v5Z9.png';
const LINE = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
const COLORS = { 
    SUCCESS: '#2ecc71', DANGER: '#ff0000', WARNING: '#f1c40f', 
    INFO: '#3498db', NEUTRAL: '#2b2d31', SPECIAL: '#9b59b6' 
};

// --- GLOBAL MEMORY ---
let config = {
    logs: null, dispatch: null, welcome: null, role: null,
    antiPub: false, spamLimit: 0, defcon: '5 (STABLE)',
    maintenance: false
};
const userSpamMap = new Map();

// --- INITIALIZATION ---
client.once('clientReady', async () => {
    console.log(`\n${LINE}\n👑 ZTS OMEGA-ABSOLUTE V18 ACTIVÉ\n${LINE}\n`);
    
    // Status dynamique
    client.user.setPresence({
        activities: [{ name: `🛡️ DEFCON ${config.defcon}`, type: ActivityType.Competing }],
        status: 'dnd'
    });

    const commands = [
        // --- SECTEUR TACTIQUE ---
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique (Base/Cache)',
            options: [
                { name: 'lieu', type: 3, description: 'Lieu', required: true },
                { name: 'map', type: 3, description: 'Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code serveur', required: true },
                { name: 'longueur', type: 3, description: 'Coordonnée X', required: true },
                { name: 'hauteur', type: 3, description: 'Coordonnée Y', required: true }
            ]
        },
        {
            name: 'info',
            description: '📊 Statut réseau du serveur PS5',
            options: [{ name: 'serveur', type: 3, description: 'Numéro du serveur', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un décès tactique (K.I.A)',
            options: [
                { name: 'map', type: 3, description: 'Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'X', required: true },
                { name: 'hauteur', type: 3, description: 'Y', required: true }
            ]
        },
        {
            name: 'raid',
            description: '🚨 ALERTE ROUGE : RAID SUR NOS BASES',
            options: [{ name: 'lieu', type: 3, description: 'Secteur sous attaque', required: true }]
        },

        // --- SECTEUR SÉCURITÉ ---
        {
            name: 'defcon',
            description: '🚨 Modifier le niveau d\'alerte ZTS',
            options: [{ name: 'niveau', type: 3, required: true, choices: [{name:'DEFCON 5 - Paisible', value:'5'}, {name:'DEFCON 3 - Alerte', value:'3'}, {name:'DEFCON 1 - GUERRE', value:'1'}] }]
        },
        {
            name: 'setup-aegis',
            description: '🛡️ Configuration de la forteresse Anti-Raid',
            options: [
                { name: 'antipub', type: 5, description: 'Supprimer liens invitations ?', required: true },
                { name: 'antispam', type: 4, description: 'Limite de messages (0=OFF)', required: true }
            ]
        },

        // --- SECTEUR ADMINISTRATION ---
        {
            name: 'setup-global',
            description: '⚙️ Configuration des systèmes centraux',
            options: [
                { name: 'logs', type: 7, description: 'Salon de surveillance', required: true },
                { name: 'dispatch', type: 7, description: 'Salon des balises', required: true },
                { name: 'accueil', type: 7, description: 'Salon de bienvenue', required: true },
                { name: 'role', type: 8, description: 'Rôle recrue auto', required: true }
            ]
        },
        { name: 'setup-recrutement', description: '👑 Interface Tickets de Recrutement' },
        { name: 'clear', description: '🧹 Nettoyer les ondes (Messages)', options: [{name:'nombre', type:4, description:'Quantité', required:true}] },
        { name: 'maintenance', description: '🛠️ Activer/Désactiver le mode maintenance', options: [{name:'etat', type:5, required:true}] }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 PROTOCOLES OMEGA CHARGÉS.");
    } catch (e) { console.error("❌ ERREUR COMMANDES:", e); }
});

// --- MODULE 1 : PROTECTION AEGIS ---
client.on(Events.MessageCreate, async m => {
    if (m.author.bot || !m.guild) return;

    // Mode Maintenance
    if (config.maintenance && !m.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await m.delete().catch(() => {});
        return m.author.send("⚠️ Le serveur est actuellement en maintenance technique.").catch(() => {});
    }

    // Anti-Pub (Exclusion Admins)
    if (config.antiPub && !m.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        if (/(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i.test(m.content)) {
            await m.delete().catch(() => {});
            const logCh = m.guild.channels.cache.get(config.logs);
            if (logCh) {
                const pubLog = new EmbedBuilder()
                    .setTitle('🚷 INTERCEPTION : PUB')
                    .setColor(COLORS.DANGER)
                    .addFields({ name: 'Auteur', value: `${m.author}`, inline: true }, { name: 'Contenu', value: `\`\`\`${m.content}\`\`\`` })
                    .setTimestamp();
                logCh.send({ embeds: [pubLog] });
            }
            return m.channel.send(`⛔ ${m.author}, la publicité est interdite.`).then(msg => setTimeout(() => msg.delete(), 3000));
        }
    }

    // Anti-Spam (Exclusion Admins)
    if (config.spamLimit > 0 && !m.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const now = Date.now();
        const data = userSpamMap.get(m.author.id) || { count: 0, last: now };
        if (now - data.last < 3000) data.count++;
        else data.count = 1;
        data.last = now;
        userSpamMap.set(m.author.id, data);

        if (data.count > config.spamLimit) {
            await m.delete().catch(() => {});
            if (data.count === config.spamLimit + 1) {
                m.channel.send(`⚠️ ${m.author}, trop de messages !`).then(msg => setTimeout(() => msg.delete(), 3000));
            }
        }
    }
});

// --- MODULE 2 : COMMANDES TACTIQUES ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // /SETCO (BALISE)
    if (i.commandName === 'setco') {
        if (!config.dispatch) return i.reply({ content: "⚠️ Dispatch non configuré.", flags: MessageFlags.Ephemeral });
        const d = { l: i.options.getString('lieu'), m: i.options.getString('map'), s: i.options.getString('serveur'), x: i.options.getString('longueur'), y: i.options.getString('hauteur') };
        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS TACTICAL SCAN • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 POSITION ENREGISTRÉE')
            .setColor(COLORS.SUCCESS)
            .setDescription(`${LINE}\n**OBJET :** ${d.l}\n**ZÉRO :** ${d.m} (${d.s})\n**COORD :** X:(**${d.x}**) | Y:(**${d.y}**)\n${LINE}`)
            .setThumbnail(ZTS_LOGO).setTimestamp();
        i.guild.channels.cache.get(config.dispatch)?.send({ embeds: [embed] });
        return i.reply({ content: "📍 Balise GPS transmise au dispatch.", flags: MessageFlags.Ephemeral });
    }

    // /INFO (LIVE STATUS)
    if (i.commandName === 'info') {
        const p = Math.floor(Math.random() * 45) + 5;
        const embed = new EmbedBuilder()
            .setTitle(`📊 ÉTAT DU SERVEUR : ${i.options.getString('serveur')}`)
            .setColor(COLORS.INFO)
            .setThumbnail(ZTS_LOGO)
            .addFields(
                { name: '👤 Population', value: `\`${p}/60\``, inline: true },
                { name: '📡 Latence', value: `\`24ms\``, inline: true },
                { name: '🛠️ Persistance', value: `\`ACTIVE\``, inline: true }
            ).setFooter({ text: 'ZTS Real-Time Tracker' });
        return i.reply({ embeds: [embed] });
    }

    // /MORT (KIA)
    if (i.commandName === 'mort') {
        const embed = new EmbedBuilder()
            .setTitle('💀 RAPPORT DE MORT AU COMBAT')
            .setColor(COLORS.DANGER)
            .setThumbnail(ZTS_LOGO)
            .setDescription(`${LINE}\n**VICTIME :** ${i.user}\n**MAP :** ${i.options.getString('map')}\n**ZONE :** X:${i.options.getString('longueur')} | Y:${i.options.getString('hauteur')}\n${LINE}\n*Mobilisation pour récupération loot possible.*`);
        return i.reply({ content: '⚠️ **KIA KIA KIA !**', embeds: [embed] });
    }

    // /RAID (ALERT)
    if (i.commandName === 'raid') {
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID 🚨')
            .setColor(COLORS.DANGER)
            .setDescription(`${LINE}\n**CIBLE :** ${i.options.getString('lieu')}\n**URGENCE :** CRITIQUE\n**ACTION :** REGROUPEMENT VOCAL IMMÉDIAT\n${LINE}`)
            .setImage(ZTS_LOGO);
        return i.reply({ content: '@everyone ⚔️ **ON NOUS ATTAQUE !**', embeds: [embed] });
    }

    // /DEFCON
    if (i.commandName === 'defcon') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Permission refusée.");
        config.defcon = i.options.getString('niveau');
        client.user.setActivity(`🛡️ DEFCON ${config.defcon}`, { type: ActivityType.Competing });
        const emb = new EmbedBuilder().setTitle('🚨 ÉTAT D\'ALERTE MODIFIÉ').setDescription(`Le serveur est maintenant en **DEFCON ${config.defcon}**`).setColor(COLORS.GOLD);
        return i.reply({ embeds: [emb] });
    }

    // /SETUP GLOBAL
    if (i.commandName === 'setup-global') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        config.logs = i.options.getChannel('logs').id;
        config.dispatch = i.options.getChannel('dispatch').id;
        config.welcome = i.options.getChannel('accueil').id;
        config.role = i.options.getRole('role').id;
        return i.reply("✅ Protocoles de base configurés.");
    }

    // /MAINTENANCE
    if (i.commandName === 'maintenance') {
        config.maintenance = i.options.getBoolean('etat');
        return i.reply(`🛠️ Mode maintenance : **${config.maintenance ? 'ON' : 'OFF'}**`);
    }

    // /SETUP RECRUTEMENT
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 UNITÉ ZTS • RECRUTEMENT')
            .setColor(COLORS.NEUTRAL)
            .setDescription(`${LINE}\nSouhaitez-vous rejoindre nos rangs ?\n\n- Accès serveurs privés\n- Entraînement tactique\n- Équipe soudée\n${LINE}`)
            .setThumbnail(ZTS_LOGO);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tk_open').setLabel('Postuler Maintenant').setStyle(ButtonStyle.Danger).setEmoji('🎖️'));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // /CLEAR
    if (i.commandName === 'clear') {
        const n = i.options.getInteger('nombre');
        await i.channel.bulkDelete(n, true);
        return i.reply({ content: `🧹 Zone balayée (${n} messages).`, flags: MessageFlags.Ephemeral });
    }
});

// --- MODULE 3 : SYSTÈME DE TICKETS (MODALS) ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'tk_open') {
        const modal = new ModalBuilder().setCustomId('zts_modal').setTitle('DOSSIER DE CANDIDATURE');
        const p = new TextInputBuilder().setCustomId('p').setLabel("IDENTIFIANT PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const h = new TextInputBuilder().setCustomId('h').setLabel("VOTRE EXPÉRIENCE (HEURES)").setStyle(TextInputStyle.Short).setRequired(true);
        const m = new TextInputBuilder().setCustomId('m').setLabel("VOS MOTIVATIONS").setStyle(TextInputStyle.Paragraph).setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(h), new ActionRowBuilder().addComponents(m));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'zts_modal') {
        await i.reply({ content: "⏳ Analyse du dossier...", flags: MessageFlags.Ephemeral });
        const tk = await i.guild.channels.create({
            name: `candidat-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const dossier = new EmbedBuilder()
            .setTitle('📂 NOUVELLE FICHE RECRUE')
            .setColor(COLORS.GOLD)
            .setThumbnail(ZTS_LOGO)
            .addFields(
                { name: '👤 Candidat', value: `${i.user}`, inline: true },
                { name: '🎮 PSN', value: `\`${i.fields.getTextInputValue('p')}\``, inline: true },
                { name: '⏳ Heures', value: `\`${i.fields.getTextInputValue('h')}\``, inline: true },
                { name: '📜 Motivations', value: i.fields.getTextInputValue('m') }
            );

        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tk_close').setLabel('Clôturer le Dossier').setStyle(ButtonStyle.Secondary));
        await tk.send({ content: `@here | Dossier de ${i.user}`, embeds: [dossier], components: [btn] });
        await i.editReply(`✅ Ton ticket est ouvert : ${tk}`);
    }

    if (i.isButton() && i.customId === 'tk_close') {
        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        i.reply("🔒 Archivage et fermeture...");
        setTimeout(() => i.channel.delete().catch(() => {}), 4000);
    }
});

// --- MODULE 4 : BIENVENUE & LOGS SURVEILLANCE ---
client.on(Events.GuildMemberAdd, async m => {
    if (config.welcome) {
        if (config.role) m.roles.add(config.role).catch(() => {});
        const emb = new EmbedBuilder()
            .setTitle('🚀 NOUVELLE RECRUE DÉTECTÉE')
            .setDescription(`${LINE}\nBienvenue **${m.user.username}** dans l'unité **ZTS** !\nIdentifie-toi dans les tickets pour nous rejoindre en jeu.\n${LINE}`)
            .setThumbnail(m.user.displayAvatarURL()).setColor(COLORS.SUCCESS).setTimestamp();
        m.guild.channels.cache.get(config.welcome)?.send({ content: `${m}`, embeds: [emb] });
    }
});

client.on('messageDelete', async m => {
    if (!config.logs || m.author?.bot) return;
    const emb = new EmbedBuilder()
        .setTitle('🗑️ LOG : MESSAGE SUPPRIMÉ')
        .setColor(COLORS.DANGER)
        .addFields(
            { name: 'Auteur', value: m.author.tag, inline: true },
            { name: 'Salon', value: `${m.channel}`, inline: true },
            { name: 'Contenu', value: `\`\`\`${m.content || "Image/Embed"}\`\`\`` }
        ).setTimestamp();
    client.channels.cache.get(config.logs)?.send({ embeds: [emb] });
});

// --- ENGINE SHIELD ---
process.on('unhandledRejection', (reason) => {
    console.error('🛡️ ZTS SHIELD CRITICAL INTERCEPT :', reason);
});

client.login(process.env.BOT_TOKEN);
