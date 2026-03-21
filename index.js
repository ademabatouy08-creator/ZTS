const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, StringSelectMenuBuilder
} = require('discord.js');
const express = require('express');

// --- ANTI-CRASH RENDER ---
const app = express();
app.get('/', (req, res) => res.send('ZTS Bot Ultra est en ligne !'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const TOKEN = process.env.BOT_TOKEN;

client.once('ready', async () => {
    console.log(`✅ ZTS Connecté : ${client.user.tag}`);
    
    const commands = [
        {
            name: 'setup-ticket',
            description: 'Créer un menu de tickets multi-options',
            options: [
                { name: 'salon', type: 7, description: 'Salon de l\'annonce', required: true },
                { name: 'titre', type: 3, description: 'Titre de l\'embed', required: true },
                { name: 'description', type: 3, description: 'Texte d\'explication', required: true }
            ]
        },
        {
            name: 'add-option',
            description: 'Ajouter une option à un message de ticket existant',
            options: [
                { name: 'message_id', type: 3, description: 'ID du message de l\'embed', required: true },
                { name: 'nom_option', type: 3, description: 'Nom (ex: Support Staff)', required: true },
                { name: 'role_a_ping', type: 8, description: 'Rôle qui recevra le ticket', required: true },
                { name: 'emoji', type: 3, description: 'Emoji pour le bouton', required: false }
            ]
        },
        {
            name: 'ban',
            description: 'Bannir un membre',
            options: [
                { name: 'membre', type: 6, description: 'Le membre à bannir', required: true },
                { name: 'raison', type: 3, description: 'Raison du ban', required: false }
            ]
        },
        {
            name: 'warn',
            description: 'Avertir un membre (en DM)',
            options: [
                { name: 'membre', type: 6, description: 'Le membre à warn', required: true },
                { name: 'raison', type: 3, description: 'Raison du warn', required: true }
            ]
        },
        {
            name: 'userinfo',
            description: 'Afficher les infos d\'un utilisateur',
            options: [{ name: 'cible', type: 6, description: 'L\'utilisateur', required: false }]
        },
        {
            name: 'botinfo',
            description: 'Infos techniques sur ZTS'
        }
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        
        // --- SETUP TICKET ---
        if (interaction.commandName === 'setup-ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Admin requis.", ephemeral: true });
            
            const channel = interaction.options.getChannel('salon');
            const title = interaction.options.getString('titre');
            const desc = interaction.options.getString('description');

            const embed = new EmbedBuilder()
                .setTitle(`🎫 ${title}`)
                .setDescription(desc)
                .setColor(0x2F3136)
                .setFooter({ text: 'Système ZTS - Utilisez /add-option pour ajouter des boutons' });

            await channel.send({ embeds: [embed] });
            return interaction.reply({ content: "✅ Embed créé ! Copie l'ID du message pour ajouter des options.", ephemeral: true });
        }

        // --- ADD OPTION (MULTI-TICKETS) ---
        if (interaction.commandName === 'add-option') {
            const msgId = interaction.options.getString('message_id');
            const label = interaction.options.getString('nom_option');
            const role = interaction.options.getRole('role_a_ping');
            const emoji = interaction.options.getString('emoji') || '📩';

            const message = await interaction.channel.messages.fetch(msgId);
            if (!message) return interaction.reply("Message introuvable.");

            const row = message.components[0] || new ActionRowBuilder();
            if (row.components.length >= 5) return interaction.reply("Maximum 5 options par message.");

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_${role.id}_${label}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(emoji)
            );

            await message.edit({ components: [row] });
            return interaction.reply({ content: `✅ Option **${label}** ajoutée avec succès !`, ephemeral: true });
        }

        // --- MODERATION : BAN ---
        if (interaction.commandName === 'ban') {
            const user = interaction.options.getUser('membre');
            const reason = interaction.options.getString('raison') || "Aucune raison";
            await interaction.guild.members.ban(user, { reason });
            const embed = new EmbedBuilder().setTitle('🔨 Ban Exécuté').setDescription(`**${user.tag}** a été banni.\n**Raison:** ${reason}`).setColor(0xFF0000);
            return interaction.reply({ embeds: [embed] });
        }

        // --- UTILITAIRE : USERINFO ---
        if (interaction.commandName === 'userinfo') {
            const member = interaction.options.getMember('cible') || interaction.member;
            const embed = new EmbedBuilder()
                .setTitle(`Infos de ${member.user.username}`)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Rejoint le', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Rôles', value: member.roles.cache.map(r => r).join(' ').slice(0, 1024) }
                )
                .setColor(0x5865F2);
            return interaction.reply({ embeds: [embed] });
        }
    }

    // --- LOGIQUE TICKETS (BOUTONS & MODAL) ---
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const modal = new ModalBuilder().setCustomId(`modal_${roleId}_${label}`).setTitle(`Ouverture : ${label}`);
        const input = new TextInputBuilder().setCustomId('reason').setLabel("Détaillez votre demande").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('reason');

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${label}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`Support - ${label}`)
            .setDescription(`Bonjour ${interaction.user}, l'équipe <@&${roleId}> va vous répondre.\n\n**Votre demande :**\n\`\`\`${reason}\`\`\``)
            .setColor(0x2ecc71);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
            new ButtonBuilder().setCustomId('transcript_ticket').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜')
        );

        await ticketChannel.send({ content: `<@&${roleId}> | ${interaction.user}`, embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: `✅ Ticket ouvert : ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply("🔒 Le ticket va être supprimé...");
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

client.login(TOKEN);
