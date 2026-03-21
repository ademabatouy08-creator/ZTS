const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ChannelType 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

const TOKEN = process.env.BOT_TOKEN;

client.once('ready', () => {
    console.log(`ZTS Bot est en ligne sous le nom ${client.user.tag}`);
    
    // Enregistrement de la commande /setup-ticket
    const guild = client.guilds.cache.get('ID_DE_TON_SERVEUR'); 
    // Note : Pour un bot public, utilise client.application.commands.set()
    if (guild) {
        guild.commands.create({
            name: 'setup-ticket',
            description: 'Configure le système de tickets ZTS',
            options: [
                { name: 'salon', type: 7, description: 'Salon de l\'embed', required: true },
                { name: 'role_staff', type: 8, description: 'Rôle qui gère les tickets', required: true },
                { name: 'categorie_nom', type: 3, description: 'Nom de l\'option (ex: Contact Modos)', required: true },
                { name: 'titre_embed', type: 3, description: 'Titre de l\'affichage', required: true }
            ]
        });
    }
});

client.on('interactionCreate', async interaction => {
    // 1. Commande de Setup
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
        const channel = interaction.options.getChannel('salon');
        const role = interaction.options.getRole('role_staff');
        const label = interaction.options.getString('categorie_nom');
        const title = interaction.options.getString('titre_embed');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`Cliquez sur le bouton ci-dessous pour ouvrir un ticket pour : **${label}**`)
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_${role.id}_${label}`)
                .setLabel(label)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        await channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: 'Système configuré !', ephemeral: true });
    }

    // 2. Clic sur le bouton de création
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const [_, roleId, label] = interaction.customId.split('_');

        const modal = new ModalBuilder()
            .setCustomId(`modal_${roleId}_${label}`)
            .setTitle(`Ouverture : ${label}`);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel("Pourquoi ouvrez-vous ce ticket ?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
    }

    // 3. Soumission du Modal (Création réelle du channel)
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

        const successEmbed = new EmbedBuilder()
            .setTitle(`Ticket : ${label}`)
            .addFields(
                { name: 'Auteur', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Rôle en charge', value: `<@&${roleId}>`, inline: true },
                { name: 'Raison', value: reason }
            )
            .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `<@&${roleId}> Nouveau ticket !`, embeds: [successEmbed], components: [closeRow] });
        await interaction.reply({ content: `Ton ticket a été créé : ${ticketChannel}`, ephemeral: true });
    }

    // 4. Fermeture du ticket
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply("Fermeture du ticket dans 5 secondes...");
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

client.login(TOKEN);
