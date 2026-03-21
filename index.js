const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType 
} = require('discord.js');
const express = require('express');

// --- ANTI-CRASH RENDER ---
const app = express();
app.get('/', (req, res) => res.send('ZTS Bot est opérationnel !'));
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
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    
    // Configuration des commandes Slash
    const commands = [
        {
            name: 'setup-ticket',
            description: 'Configuration du système de tickets',
            options: [
                { name: 'salon', type: 7, description: 'Salon de l\'annonce', required: true },
                { name: 'role_staff', type: 8, description: 'Rôle qui gère les tickets', required: true },
                { name: 'nom_bouton', type: 3, description: 'Texte du bouton', required: true },
                { name: 'titre', type: 3, description: 'Titre de l\'embed', required: true }
            ]
        },
        {
            name: 'clear',
            description: 'Supprime des messages (Modération)',
            options: [{ name: 'nombre', type: 4, description: 'Nombre de messages', required: true }]
        },
        {
            name: 'timeout',
            description: 'Mettre un membre en sourdine',
            options: [
                { name: 'membre', type: 6, description: 'Le membre à mute', required: true },
                { name: 'minutes', type: 4, description: 'Durée en minutes', required: true }
            ]
        }
    ];

    await client.application.commands.set(commands);
    console.log("🚀 Commandes Slash enregistrées !");
});

client.on('interactionCreate', async interaction => {
    // --- GESTION DES COMMANDES ---
    if (interaction.isChatInputCommand()) {
        
        // SETUP TICKET
        if (interaction.commandName === 'setup-ticket') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("Admin requis.");
            
            const channel = interaction.options.getChannel('salon');
            const role = interaction.options.getRole('role_staff');
            const label = interaction.options.getString('nom_bouton');
            const title = interaction.options.getString('titre');

            const embed = new EmbedBuilder()
                .setTitle(`✨ ${title}`)
                .setDescription(`Besoin d'aide ? Cliquez sur le bouton ci-dessous pour contacter l'équipe.\n\n**Option :** ${label}`)
                .setColor(0x00AEFF)
                .setFooter({ text: 'Système ZTS', iconURL: client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_${role.id}_${label}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📩')
            );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Système configuré !', ephemeral: true });
        }

        // CLEAR
        if (interaction.commandName === 'clear') {
            const count = interaction.options.getInteger('nombre');
            await interaction.channel.bulkDelete(count);
            return interaction.reply({ content: `🧹 ${count} messages supprimés.`, ephemeral: true });
        }
    }

    // --- LOGIQUE DES TICKETS ---
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const modal = new ModalBuilder().setCustomId(`modal_${roleId}_${label}`).setTitle(`Support: ${label}`);
        const input = new TextInputBuilder().setCustomId('reason').setLabel("Description du problème").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('reason');

        const ticketChannel = await interaction.guild.channels.create({
            name: `🎫-${label}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('🎫 Nouveau Ticket Ouvert')
            .setColor(0x2F3136)
            .addFields(
                { name: '👤 Utilisateur', value: `${interaction.user}`, inline: true },
                { name: '🛠 Catégorie', value: label, inline: true },
                { name: '📝 Raison', value: reason }
            );

        const closeBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await ticketChannel.send({ content: `<@&${roleId}>`, embeds: [successEmbed], components: [closeBtn] });
        await interaction.reply({ content: `Ton ticket est ici : ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply("🔒 Fermeture en cours...");
        setTimeout(() => interaction.channel.delete(), 3000);
    }
});

client.login(TOKEN);
