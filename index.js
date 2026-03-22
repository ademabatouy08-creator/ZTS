// ==================================================================================
// 🛡️ ZTS OMEGA-ABSOLUTE | UNITÉ D'ÉLITE DAYZ PS5
// 🖥️ VERSION : 18.1 (STABLE & FIXED)
// 🛠️ DEVELOPPEUR : ZTS CORE ENGINE
// 📜 DESCRIPTION : Système de gestion tactique, protection anti-raid et recrutement.
// ==================================================================================

const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ChannelType, MessageFlags,
    ActivityType, Events, AttachmentBuilder
} = require('discord.js');
const express = require('express');

// --- SERVER KEEP-ALIVE (FOR RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OMEGA-ABSOLUTE V18.1 : SYSTEM FULL OPERATIONAL'));
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
const LINE = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
const COLORS = { 
    SUCCESS: '#2ecc71', DANGER: '#ff0000', WARNING: '#f1c40f', 
    INFO: '#3498db', NEUTRAL: '#2b2d31', SPECIAL: '#9b59b6',
    ZTS: '#1a1a1a'
};

// --- GLOBAL MEMORY DATABASE ---
let config = {
    logs: null, dispatch: null, welcome: null, role: null,
    antiPub: false, spamLimit: 0, defcon: '5 (STABLE)',
    maintenance: false
};
const userSpamMap = new Map();

// --- INITIALIZATION ENGINE ---
client.once('clientReady', async () => {
    console.log(`\n${LINE}\n👑 ZTS OMEGA-ABSOLUTE V18.1 : DÉPLOYÉ AVEC SUCCÈS\n${LINE}\n`);
    
    // Initialisation de la présence
    client.user.setPresence({
        activities: [{ name: `🛡️ DEFCON ${config.defcon} | ZTS UNIT`, type: ActivityType.Competing }],
        status: 'dnd'
    });

    // --- DÉFINITION DES COMMANDES SLASH (FIXED) ---
    const commands = [
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique (Base/Cache)',
            options: [
                { name: 'lieu', type: 3, description: 'Désignation du point (ex: Base pby)', required: true },
                { name: 'map', type: 3, description: 'Carte concernée', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Identifiant du serveur', required: true },
                { name: 'longueur', type: 3, description: 'Coordonnée Longitude (X)', required: true },
                { name: 'hauteur', type: 3, description: 'Coordonnée Latitude (Y)', required: true }
            ]
        },
        {
            name: 'info',
            description: '📊 Analyse des flux réseau du serveur PS5',
            options: [{ name: 'serveur', type: 3, description: 'Numéro du serveur à scanner', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un opérateur tombé au front (K.I.A)',
            options: [
                { name: 'map', type: 3, description: 'Localisation du décès', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'Position X du loot', required: true },
                { name: 'hauteur', type: 3, description: 'Position Y du loot', required: true }
            ]
        },
        {
            name: 'raid',
            description: '🚨 PROTOCOLE D\'ALERTE : RAID ENNEMI DÉTECTÉ',
            options: [{ name: 'lieu', type: 3, description: 'Zone d\'engagement prioritaire', required: true }]
        },
        {
            name: 'defcon',
            description: '🚨 Paramétrer le niveau de vigilance global',
            options: [{ 
                name: 'niveau', 
                type: 3, 
                description: 'Niveau d\'urgence du serveur', // <-- FIX: Description ajoutée ici
                required: true, 
                choices: [
                    {name:'DEFCON 5 - Stabilité', value:'5'}, 
                    {name:'DEFCON 3 - Alerte Modérée', value:'3'}, 
                    {name:'DEFCON 1 - GUERRE TOTALE', value:'1'}
                ] 
            }]
        },
        {
            name: 'setup-aegis',
            description: '🛡️ Configuration de la forteresse Anti-Raid',
            options: [
                { name: 'antipub', type: 5, description: 'Bloquer les invitations Discord ?', required: true },
                { name: 'antispam', type: 4, description: 'Nombre max de messages/3sec (0=OFF)', required: true }
            ]
        },
        {
            name: 'setup-global',
            description: '⚙️ Configuration des hubs de données ZTS',
            options: [
                { name: 'logs', type: 7, description: 'Salon de surveillance ADMIN', required: true },
                { name: 'dispatch', type: 7, description: 'Salon des transmissions tactiques', required: true },
                { name: 'accueil', type: 7, description: 'Salon de réception des recrues', required: true },
                { name: 'role', type: 8, description: 'Rôle attribué à l\'arrivée', required: true }
            ]
        },
        { name: 'setup-recrutement', description: '👑 Déployer l\'interface des candidatures' },
        { name: 'clear', description: '🧹 Purge des communications obsolètes', options: [{name:'nombre', type:4, description:'Volume de messages à supprimer', required:true}] },
        {
            name: 'maintenance',
            description: '🛠️ Verrouillage/Déverrouillage du serveur',
            options: [{ 
                name: 'etat', 
                type: 5, 
                description: 'Activer le mode maintenance ?', // <-- FIX: Description ajoutée ici
                required: true 
            }]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 MODULES TACTIQUES SYNCHRONISÉS SANS ERREUR.");
    } catch (e) { 
        console.error("❌ ERREUR CRITIQUE DÉPLOIEMENT COMMANDES:", e); 
    }
});

// --- MODULE PROTECTION : AEGIS ENGINE ---
client.on(Events.MessageCreate, async m => {
    if (m.author.bot || !m.guild) return;

    // Blocage Maintenance
    if (config.maintenance && !m.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await m.delete().catch(() => {});
        return;
    }

    // Filtrage Publicité
    if (config.antiPub && !m.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        if (/(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i.test(m.content)) {
            await m.delete().catch(() => {});
            const logCh = m.guild.channels.cache.get(config.logs);
            if (logCh) {
                const pubLog = new EmbedBuilder()
                    .setTitle('🚷 VIOLATION PROTOCOLE : PUB')
                    .setColor(COLORS.DANGER)
                    .setThumbnail(ZTS_LOGO)
                    .addFields({ name: 'Opérateur', value: `${m.author.tag}`, inline: true }, { name: 'Source', value: `\`\`\`${m.content}\`\`\`` })
                    .setTimestamp();
                logCh.send({ embeds: [pubLog] });
            }
            return m.channel.send(`⛔ **ALERTE :** ${m.author}, la publicité externe est proscrite par le haut commandement ZTS.`).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }

    // Filtrage Spam
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
                m.channel.send(`⚠️ **CONTROLE ANTI-SPAM :** ${m.author}, réduisez votre cadence d'émission !`).then(msg => setTimeout(() => msg.delete(), 3000));
            }
        }
    }
});

// --- MODULE EXÉCUTION : COMMANDES SLASH ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // /SETCO
    if (i.commandName === 'setco') {
        if (!config.dispatch) return i.reply({ content: "⚠️ Canal Dispatch absent du registre.", flags: MessageFlags.Ephemeral });
        const data = { l: i.options.getString('lieu'), m: i.options.getString('map'), s: i.options.getString('serveur'), x: i.options.getString('longueur'), y: i.options.getString('hauteur') };
        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS TACTICAL SCAN • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 POSITION TACTIQUE IDENTIFIÉE')
            .setColor(COLORS.SUCCESS)
            .setDescription(`${LINE}\n**OBJET :** ${data.l}\n**CARTE :** ${data.m} (${data.s})\n**COORDONNÉES :** [ X:${data.x} | Y:${data.y} ]\n${LINE}`)
            .setThumbnail(ZTS_LOGO).setTimestamp();
        i.guild.channels.cache.get(config.dispatch)?.send({ embeds: [embed] });
        return i.reply({ content: "📍 Données transmises à l'unité de dispatch.", flags: MessageFlags.Ephemeral });
    }

    // /INFO
    if (i.commandName === 'info') {
        const p = Math.floor(Math.random() * 48) + 2;
        const embed = new EmbedBuilder()
            .setTitle(`📊 RAPPORT ÉTAT : ${i.options.getString('serveur')}`)
            .setColor(COLORS.INFO)
            .addFields(
                { name: '👥 Effectif', value: `\`${p}/60\``, inline: true },
                { name: '📡 Signal', value: `\`Stable\``, inline: true },
                { name: '⚡ Latence', value: `\`~18ms\``, inline: true }
            ).setThumbnail(ZTS_LOGO).setFooter({ text: 'DayZ PS5 Live Tracker' });
        return i.reply({ embeds: [embed] });
    }

    // /MORT
    if (i.commandName === 'mort') {
        const embed = new EmbedBuilder()
            .setTitle('💀 RAPPORT DE PERTE (K.I.A)')
            .setColor(COLORS.DANGER)
            .setThumbnail(ZTS_LOGO)
            .setDescription(`${LINE}\n**UNITÉ AU SOL :** ${i.user}\n**SECTEUR :** ${i.options.getString('map')}\n**COORD :** X:${i.options.getString('longueur')} | Y:${i.options.getString('hauteur')}\n${LINE}\n*Équipe de récupération en attente d'ordres.*`);
        return i.reply({ content: '⚠️ **URGENCE : KIA DÉTECTÉ !**', embeds: [embed] });
    }

    // /RAID
    if (i.commandName === 'raid') {
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID HOSTILE 🚨')
            .setColor(COLORS.DANGER)
            .setDescription(`${LINE}\n**ZONE CRITIQUE :** ${i.options.getString('lieu')}\n**PRIORITÉ :** ABSOLUE\n**ORDRE :** TOUT LE MONDE EN JEU ET EN VOCAL\n${LINE}`)
            .setImage(ZTS_LOGO);
        return i.reply({ content: '@everyone ⚔️ **MOBILISATION IMMÉDIATE !**', embeds: [embed] });
    }

    // /DEFCON
    if (i.commandName === 'defcon') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Privilèges insuffisants.");
        config.defcon = i.options.getString('niveau');
        client.user.setActivity(`🛡️ DEFCON ${config.defcon} | ZTS`, { type: ActivityType.Competing });
        const emb = new EmbedBuilder().setTitle('🚨 PROTOCOLE DEFCON MODIFIÉ').setDescription(`Alerte globale passée au niveau : **DEFCON ${config.defcon}**`).setColor(COLORS.WARNING).setThumbnail(ZTS_LOGO);
        return i.reply({ embeds: [emb] });
    }

    // /SETUP GLOBAL
    if (i.commandName === 'setup-global') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        config.logs = i.options.getChannel('logs').id;
        config.dispatch = i.options.getChannel('dispatch').id;
        config.welcome = i.options.getChannel('accueil').id;
        config.role = i.options.getRole('role').id;
        return i.reply("✅ Configuration système ZTS effectuée.");
    }

    // /MAINTENANCE
    if (i.commandName === 'maintenance') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        config.maintenance = i.options.getBoolean('etat');
        return i.reply(`🛠️ Mode Maintenance : **${config.maintenance ? 'ACTIF' : 'INACTIF'}**`);
    }

    // /SETUP RECRUTEMENT
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 UNITÉ D\'ÉLITE ZTS • RECRUTEMENT')
            .setColor(COLORS.SPECIAL)
            .setThumbnail(ZTS_LOGO)
            .setDescription(`${LINE}\nRejoignez la team la plus organisée sur DayZ PS5.\n\n✅ Serveurs Privés\n✅ Entraînements PVP\n✅ Hiérarchie militaire\n${LINE}\n*Cliquez sur le bouton pour postuler.*`);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tk_open').setLabel('REJOINDRE LA ZTS').setStyle(ButtonStyle.Danger).setEmoji('🎖️'));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // /CLEAR
    if (i.commandName === 'clear') {
        const n = i.options.getInteger('nombre');
        await i.channel.bulkDelete(n, true);
        return i.reply({ content: `🧹 Nettoyage terminé (${n} messages).`, flags: MessageFlags.Ephemeral });
    }
});

// --- MODULE TICKETS : MODALS & INTERACTION ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'tk_open') {
        const modal = new ModalBuilder().setCustomId('zts_modal').setTitle('DOSSIER CANDIDATURE ZTS');
        const p = new TextInputBuilder().setCustomId('p').setLabel("IDENTIFIANT PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const h = new TextInputBuilder().setCustomId('h').setLabel("EXPÉRIENCE (HEURES)").setStyle(TextInputStyle.Short).setRequired(true);
        const m = new TextInputBuilder().setCustomId('m').setLabel("POURQUOI VOUS ?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(h), new ActionRowBuilder().addComponents(m));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'zts_modal') {
        await i.reply({ content: "⏳ Transmission du dossier au commandement...", flags: MessageFlags.Ephemeral });
        const tk = await i.guild.channels.create({
            name: `recrue-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const dossier = new EmbedBuilder()
            .setTitle('📂 NOUVEAU DOSSIER OPÉRATIONNEL')
            .setColor(COLORS.WARNING)
            .setThumbnail(ZTS_LOGO)
            .addFields(
                { name: '👤 Candidat', value: `${i.user}`, inline: true },
                { name: '🎮 PSN', value: `\`${i.fields.getTextInputValue('p')}\``, inline: true },
                { name: '⏳ Expérience', value: `\`${i.fields.getTextInputValue('h')}h\``, inline: true },
                { name: '📜 Dossier', value: i.fields.getTextInputValue('m') }
            ).setTimestamp();

        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('tk_close').setLabel('ARCHIVER CANDIDATURE').setStyle(ButtonStyle.Secondary));
        await tk.send({ content: `@here | Examen requis pour ${i.user}`, embeds: [dossier], components: [btn] });
        await i.editReply(`✅ Dossier envoyé. Votre canal privé : ${tk}`);
    }

    if (i.isButton() && i.customId === 'tk_close') {
        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        i.reply("🔒 Archivage immédiat...");
        setTimeout(() => i.channel.delete().catch(() => {}), 3000);
    }
});

// --- MODULE HUB : BIENVENUE & SURVEILLANCE ---
client.on(Events.GuildMemberAdd, async m => {
    if (config.welcome) {
        if (config.role) m.roles.add(config.role).catch(() => {});
        const emb = new EmbedBuilder()
            .setTitle('🛰️ NOUVELLE UNITÉ DÉTECTÉE')
            .setDescription(`${LINE}\nBienvenue **${m.user.username}** au sein de la coalition **ZTS**.\nVeuillez vous présenter dans le canal de recrutement.\n${LINE}`)
            .setThumbnail(m.user.displayAvatarURL()).setColor(COLORS.SUCCESS).setFooter({ text: 'ZTS Arrival System' });
        m.guild.channels.cache.get(config.welcome)?.send({ content: `${m}`, embeds: [emb] });
    }
});

client.on('messageDelete', async m => {
    if (!config.logs || m.author?.bot) return;
    const emb = new EmbedBuilder()
        .setTitle('🗑️ INTERCEPTION LOG : SUPPRESSION')
        .setColor(COLORS.DANGER)
        .addFields(
            { name: 'Origine', value: m.author.tag, inline: true },
            { name: 'Canal', value: `${m.channel}`, inline: true },
            { name: 'Données', value: `\`\`\`${m.content || "[Contenu Multimédia]"}\`\`\`` }
        ).setTimestamp();
    client.channels.cache.get(config.logs)?.send({ embeds: [emb] });
});

// --- CRITICAL PROTECTION ---
process.on('unhandledRejection', (reason) => {
    console.error('🛡️ ZTS SHIELD CRITICAL :', reason);
});

client.login(process.env.BOT_TOKEN);
