const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags,
    ActivityType, Events
} = require('discord.js');
const express = require('express');

// --- SYSTÈME ANTI-DODO (RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS ARCHANGEL V14 : SYSTEM FULL OPERATIONAL'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- BASE DE DONNÉES TEMPORAIRE ---
let logChannelId = null;
let dispatchChannelId = null;
let welcomeChannelId = null;
let welcomeRoleId = null;

// --- INITIALISATION DU BOT ---
client.once('clientReady', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n🛡️ ZTS ARCHANGEL V14 DÉPLOYÉ : ${client.user.tag}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    // Status tournant
    client.user.setActivity('Surveillance DayZ PS5', { type: ActivityType.Watching });

    const commands = [
        // --- POSITIONNEMENT ---
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique (Base/Cache)',
            options: [
                { name: 'lieu', type: 3, description: 'Nom du lieu (ex: Base pby)', required: true },
                { name: 'map', type: 3, description: 'La Map DayZ', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code du serveur (ex: 9273)', required: true },
                { name: 'longueur', type: 3, description: 'X (ex: 057)', required: true },
                { name: 'hauteur', type: 3, description: 'Y (ex: 018)', required: true }
            ]
        },
        // --- INTELLIGENCE ---
        {
            name: 'info',
            description: '📊 Statut réseau du serveur PS5',
            options: [{ name: 'serveur', type: 3, description: 'Numéro du serveur', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un décès (K.I.A)',
            options: [
                { name: 'map', type: 3, description: 'Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'X', required: true },
                { name: 'hauteur', type: 3, description: 'Y', required: true }
            ]
        },
        {
            name: 'raid',
            description: '🚨 ALERTE ROUGE : RAID ENNEMI',
            options: [{ name: 'lieu', type: 3, description: 'Secteur attaqué', required: true }]
        },
        // --- ADMINISTRATION ---
        {
            name: 'setup-bienvenue',
            description: '👋 Configurer le message d\'accueil automatique',
            options: [
                { name: 'salon', type: 7, description: 'Salon de bienvenue', required: true },
                { name: 'role', type: 8, description: 'Rôle automatique pour les nouveaux', required: true }
            ]
        },
        { name: 'set-logs', description: '⚙️ Configurer les logs admin', options: [{ name: 'salon', type: 7, description: 'Salon de log', required: true }] },
        { name: 'set-dispatch', description: '🛰️ Configurer le salon de traçage', options: [{ name: 'salon', type: 7, description: 'Salon de dispatch', required: true }] },
        { name: 'setup-recrutement', description: '👑 Créer l\'interface de candidature (Tickets)' },
        { name: 'clear', description: '🧹 Nettoyer les communications', options: [{ name: 'nombre', type: 4, description: 'Nombre de messages', required: true }] },
        { name: 'zts-help', description: '📖 Afficher le manuel d\'utilisation Titan' }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Modules de Combat Synchronisés.");
    } catch (e) { console.error("❌ Synchro Error:", e); }
});

// --- GESTIONNAIRE D'ÉVÉNEMENTS : BIENVENUE ---
client.on(Events.GuildMemberAdd, async member => {
    if (!welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    if (welcomeRoleId) {
        member.roles.add(welcomeRoleId).catch(() => console.log("Rôle non attribuable."));
    }

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛰️ ARRIVÉE DÉTECTÉE • ZTS UNIT')
        .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nBienvenue Soldat **${member.user.username}** !\n\nL'unité ZTS vient de gagner une nouvelle recrue. \nPrépare ton paquetage et lis les règles.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
        .addFields(
            { name: '👤 Identifiant', value: `${member}`, inline: true },
            { name: '🆔 Membre #', value: `${member.guild.memberCount}`, inline: true }
        )
        .setColor('#2ecc71')
        .setThumbnail(member.user.displayAvatarURL())
        .setImage('https://i.imgur.com/8N7mZ6m.png')
        .setFooter({ text: 'ZTS Automated Welcome System' })
        .setTimestamp();

    channel.send({ content: `Bienvenue dans la garnison ${member} !`, embeds: [welcomeEmbed] });
});

// --- GESTIONNAIRE DE COMMANDES SLASH ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // 1. POSITIONNEMENT /SETCO
    if (i.commandName === 'setco') {
        const { options } = i;
        const lieu = options.getString('lieu');
        const map = options.getString('map');
        const srv = options.getString('serveur');
        const x = options.getString('longueur');
        const y = options.getString('hauteur');

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Dispatch non configuré.", flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS UNIT • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 BALISE STRATÉGIQUE POSÉE')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**(${lieu})** sur le serveur **${map}** (${srv}), les coordonnées sont : longueur=(**${x}**) ; hauteur=(**${y}**).\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2ecc71')
            .setFooter({ text: 'Ghost Recon System' })
            .setTimestamp();

        i.guild.channels.cache.get(dispatchChannelId)?.send({ embeds: [embed] });
        return i.reply({ content: "✅ Transmission réussie.", flags: MessageFlags.Ephemeral });
    }

    // 2. SETUP BIENVENUE
    if (i.commandName === 'setup-bienvenue') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Permission Admin requise.");
        welcomeChannelId = i.options.getChannel('salon').id;
        welcomeRoleId = i.options.getRole('role').id;
        return i.reply(`✅ Système d'accueil configuré dans <#${welcomeChannelId}> avec le rôle <@&${welcomeRoleId}>.`);
    }

    // 3. RAID
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID ZTS 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**OBJECTIF :** ${lieu}\n**URGENCE :** MAXIMALE\n**ORDRE :** Connexion immédiate de toute l'unité.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000')
            .setThumbnail('https://i.imgur.com/8N7mZ6m.png');
        return i.reply({ content: '@everyone ⚔️ **MOBILISATION GÉNÉRALE !**', embeds: [embed] });
    }

    // 4. HELP
    if (i.commandName === 'zts-help') {
        const helpEmb = new EmbedBuilder()
            .setTitle('📖 MANUEL OPÉRATIONNEL ZTS')
            .setColor('#3498db')
            .setDescription(`**Commandes Principales :**\n\n• \`/setco\` : Marquer une base/cache.\n• \`/info\` : Check le statut serveur.\n• \`/mort\` : Signaler un décès pour loot recovery.\n• \`/raid\` : Alerte de défense base.\n• \`/setup-recrutement\` : Lancer le système de tickets.\n• \`/clear\` : Nettoyage rapide.`)
            .setFooter({ text: 'ZTS Titan Engine V14' });
        return i.reply({ embeds: [helpEmb], flags: MessageFlags.Ephemeral });
    }

    // 5. CONFIGURATION GÉNÉRALE
    if (i.commandName === 'set-logs') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        logChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Logs admin activés.`);
    }

    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Dispatch tactique activé.`);
    }

    // 6. SETUP RECRUTEMENT
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 RECRUTEMENT PS5 • ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*Envie de rejoindre une équipe organisée ?*\n\nCliquez ci-dessous pour ouvrir votre dossier.\nUn canal d'entretien privé sera créé.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2b2d31');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rec_btn').setLabel('Ouvrir un Ticket').setStyle(ButtonStyle.Danger).setEmoji('📩')
        );
        return i.reply({ embeds: [embed], components: [row] });
    }

    // 7. CLEAR
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 Communications nettoyées.`, flags: MessageFlags.Ephemeral });
    }
});

// --- SYSTÈME DE TICKETS D'ENTRETIEN ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Dossier de Recrutement ZTS');
        const inputs = [
            new TextInputBuilder().setCustomId('psn').setLabel("ID PSN").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId('xp').setLabel("Heures de jeu DayZ").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId('desc').setLabel("Pourquoi toi ?").setStyle(TextInputStyle.Paragraph).setRequired(true)
        ];
        modal.addComponents(inputs.map(input => new ActionRowBuilder().addComponents(input)));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const psn = i.fields.getTextInputValue('psn');
        const xp = i.fields.getTextInputValue('xp');
        const desc = i.fields.getTextInputValue('desc');

        await i.reply({ content: "🛠️ Préparation du salon d'entretien...", flags: MessageFlags.Ephemeral });

        const ticket = await i.guild.channels.create({
            name: `recrue-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });

        const recEmb = new EmbedBuilder()
            .setTitle('📥 NOUVELLE CANDIDATURE DETECTÉE')
            .setColor('Gold')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**Candidat :** ${i.user}\n**PSN :** \`${psn}\`\n**Heures :** \`${xp}\`\n**Motivations :**\n${desc}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setFooter({ text: 'ZTS Human Resources' });

        const closeBtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_t').setLabel('Archiver le Dossier').setStyle(ButtonStyle.Secondary));

        await ticket.send({ content: `${i.user} | @here (Staff ZTS)`, embeds: [recEmb], components: [closeBtn] });
        await i.editReply({ content: `✅ Ton ticket est prêt ici : ${ticket}` });
    }

    if (i.isButton() && i.customId === 'close_t') {
        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return i.reply({ content: "Privilèges insuffisants.", flags: MessageFlags.Ephemeral });
        await i.reply("🔒 Archivage dans 5 secondes...");
        setTimeout(() => i.channel.delete().catch(() => {}), 5000);
    }
});

// --- LOGGING DES SUPPRESSIONS ---
client.on('messageDelete', async m => {
    if (!logChannelId || m.author?.bot) return;
    const logEmb = new EmbedBuilder()
        .setTitle('🗑️ INTERCEPTION : MESSAGE SUPPRIMÉ')
        .setColor('#e74c3c')
        .addFields(
            { name: '👤 Utilisateur', value: `${m.author.tag}`, inline: true },
            { name: '📍 Salon', value: `${m.channel}`, inline: true },
            { name: '📜 Contenu', value: `\`\`\`${m.content || "Données non-textuelles"}\`\`\`` }
        ).setTimestamp();
    client.channels.cache.get(logChannelId)?.send({ embeds: [logEmb] });
});

// --- PROTECTION CONTRE LES CRASHS ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('🛡️ ZTS SHIELD : Erreur interceptée\n', reason);
});

client.login(process.env.BOT_TOKEN);
