const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- SERVEUR KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OMNI-TITAN IS ACTIVE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// --- VARIABLES DE CONFIGURATION ---
let welcomeChannelId = null;
const pollVotes = new Map(); // Stockage des votes pour les sondages

client.once('clientReady', async () => {
    console.log(`🚀 ZTS OMNI-TITAN Connecté : ${client.user.tag}`);
    
    const commands = [
        {
            name: 'setup-embed',
            description: 'Créer un embed pro',
            options: [
                { name: 'salon', type: 7, description: 'Salon', required: true },
                { name: 'titre', type: 3, description: 'Titre', required: true },
                { name: 'description', type: 3, description: 'Texte', required: true }
            ]
        },
        {
            name: 'add-option',
            description: 'Ajouter un bouton (Ticket ou Rôle)',
            options: [
                { name: 'message_id', type: 3, description: 'ID du message', required: true },
                { name: 'type', type: 3, description: 'Type', required: true, choices: [{name:'Ticket', value:'tk'}, {name:'Rôle', value:'rl'}] },
                { name: 'nom', type: 3, description: 'Label', required: true },
                { name: 'cible', type: 8, description: 'Rôle', required: true },
                { name: 'emoji', type: 3, description: 'Emoji', required: false }
            ]
        },
        {
            name: 'set-welcome',
            description: 'Définir le salon de bienvenue',
            options: [{ name: 'salon', type: 7, description: 'Salon', required: true }]
        },
        {
            name: 'server-info',
            description: 'Afficher les stats du serveur'
        },
        {
            name: '8ball',
            description: 'Pose une question à ZTS',
            options: [{ name: 'question', type: 3, description: 'Ta question', required: true }]
        },
        {
            name: 'slowmode',
            description: 'Changer le mode lent du salon',
            options: [{ name: 'secondes', type: 4, description: 'Temps (0 pour off)', required: true }]
        },
        {
            name: 'poll',
            description: 'Lancer un sondage interactif',
            options: [{ name: 'question', type: 3, description: 'La question', required: true }]
        }
    ];

    await client.application.commands.set(commands);
});

// --- SYSTÈME DE BIENVENUE ---
client.on('guildMemberAdd', async member => {
    if (!welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('👋 Bienvenue !')
        .setDescription(`Bienvenue sur le serveur **${member.guild.name}**, ${member} !\nOn est maintenant **${member.guild.memberCount}** membres !`)
        .setColor('#57F287')
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        
        // --- SETUP WELCOME ---
        if (interaction.commandName === 'set-welcome') {
            welcomeChannelId = interaction.options.getChannel('salon').id;
            return interaction.reply(`✅ Salon de bienvenue configuré sur <#${welcomeChannelId}>`);
        }

        // --- SERVER INFO ---
        if (interaction.commandName === 'server-info') {
            const guild = interaction.guild;
            const infoEmbed = new EmbedBuilder()
                .setTitle(`Stats : ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
                    { name: '📅 Création', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
                )
                .setColor('#2B2D31');
            return interaction.reply({ embeds: [infoEmbed] });
        }

        // --- 8BALL ---
        if (interaction.commandName === '8ball') {
            const reponses = ["Oui", "Non", "Peut-être", "C'est certain", "Oublie ça", "Demande plus tard"];
            const rep = reponses[Math.floor(Math.random() * reponses.length)];
            return interaction.reply(`🔮 **Question :** ${interaction.options.getString('question')}\n🎱 **Réponse :** ${rep}`);
        }

        // --- POLL (SONDAGE) ---
        if (interaction.commandName === 'poll') {
            const question = interaction.options.getString('question');
            const pollEmbed = new EmbedBuilder()
                .setTitle('📊 Sondage ZTS')
                .setDescription(`**${question}**\n\n✅ : 0 | ❌ : 0`)
                .setColor('#00AEFF');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('p_yes').setLabel('OUI').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('p_no').setLabel('NON').setStyle(ButtonStyle.Danger)
            );
            return interaction.reply({ embeds: [pollEmbed], components: [row] });
        }

        // --- SLOWMODE ---
        if (interaction.commandName === 'slowmode') {
            const sec = interaction.options.getInteger('secondes');
            await interaction.channel.setRateLimitPerUser(sec);
            return interaction.reply(`⏳ Mode lent réglé sur **${sec}** secondes.`);
        }

        // --- SETUP EMBED & ADD OPTION (Reprise du code d'avant) ---
        if (interaction.commandName === 'setup-embed') {
            const channel = interaction.options.getChannel('salon');
            const embed = new EmbedBuilder()
                .setTitle(interaction.options.getString('titre'))
                .setDescription(interaction.options.getString('description'))
                .setColor('#2B2D31');
            await channel.send({ embeds: [embed] });
            return interaction.reply({ content: "✅ OK", flags: MessageFlags.Ephemeral });
        }

        if (interaction.commandName === 'add-option') {
            const msgId = interaction.options.getString('message_id');
            const type = interaction.options.getString('type');
            const label = interaction.options.getString('nom');
            const role = interaction.options.getRole('cible');
            try {
                const message = await interaction.channel.messages.fetch(msgId);
                let row = message.components[0] ? ActionRowBuilder.from(message.components[0]) : new ActionRowBuilder();
                row.addComponents(new ButtonBuilder().setCustomId(`${type}_${role.id}_${label}`).setLabel(label).setStyle(type === 'tk' ? ButtonStyle.Primary : ButtonStyle.Secondary));
                await message.edit({ components: [row] });
                return interaction.reply({ content: "✅ Bouton ajouté !", flags: MessageFlags.Ephemeral });
            } catch (e) { return interaction.reply({ content: "❌ ID Invalide", flags: MessageFlags.Ephemeral }); }
        }
    }

    // --- GESTION DES BOUTONS (TICKETS, ROLES, SONDAGES) ---
    if (interaction.isButton()) {
        // Sondage interactif
        if (interaction.customId.startsWith('p_')) {
            const isYes = interaction.customId === 'p_yes';
            // On peut ajouter une logique de compteur ici si besoin
            return interaction.reply({ content: "Vote pris en compte ! ✅", flags: MessageFlags.Ephemeral });
        }

        // Auto-rôle
        if (interaction.customId.startsWith('rl_')) {
            const rId = interaction.customId.split('_')[1];
            if (interaction.member.roles.cache.has(rId)) {
                await interaction.member.roles.remove(rId);
                return interaction.reply({ content: "Rôle retiré !", flags: MessageFlags.Ephemeral });
            } else {
                await interaction.member.roles.add(rId);
                return interaction.reply({ content: "Rôle ajouté !", flags: MessageFlags.Ephemeral });
            }
        }

        // Ticket (Correction du modal crash)
        if (interaction.customId.startsWith('tk_')) {
            const [_, rId, lab] = interaction.customId.split('_');
            const modal = new ModalBuilder().setCustomId(`mod_${rId}_${lab}`).setTitle(`Support : ${lab}`);
            const input = new TextInputBuilder().setCustomId('r').setLabel("Raison").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await interaction.showModal(modal);
        }
    }

    // --- LOGIQUE MODAL TICKET ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('mod_')) {
        const [_, rId, lab] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('r');

        const chan = await interaction.guild.channels.create({
            name: `zts-${lab}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: rId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        await chan.send({ content: `<@&${rId}>`, embeds: [new EmbedBuilder().setTitle(lab).setDescription(`Auteur: ${interaction.user}\nRaison: ${reason}`).setColor('Blue')] });
        return interaction.reply({ content: `✅ Ticket ouvert : ${chan}`, flags: MessageFlags.Ephemeral });
    }
});

// --- ANTI-CRASH GLOBAL ---
process.on('unhandledRejection', (reason, promise) => {
    console.error(' [ANTI-CRASH] Erreur détectée :', reason);
});

client.login(process.env.BOT_TOKEN);
