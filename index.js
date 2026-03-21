const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- ANTI-CRASH RENDER ---
const app = express();
app.get('/', (req, res) => res.send('ZTS V2 IS ONLINE!'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel]
});

const TOKEN = process.env.BOT_TOKEN;

client.once('clientReady', async () => {
    console.log(`✅ ZTS V2 Connecté : ${client.user.tag}`);
    
    const commands = [
        // SETUP SYSTEM
        {
            name: 'setup-embed',
            description: 'Créer un embed vide pour tickets ou rôles',
            options: [
                { name: 'salon', type: 7, description: 'Salon de l\'annonce', required: true },
                { name: 'titre', type: 3, description: 'Titre de l\'embed', required: true },
                { name: 'description', type: 3, description: 'Texte d\'explication', required: true },
                { name: 'couleur', type: 3, description: 'Couleur Hex (ex: #FF0000)', required: false }
            ]
        },
        {
            name: 'add-ticket',
            description: 'Ajouter un bouton Ticket à un embed',
            options: [
                { name: 'message_id', type: 3, description: 'ID de l\'embed', required: true },
                { name: 'nom', type: 3, description: 'Nom du bouton', required: true },
                { name: 'role_staff', type: 8, description: 'Rôle à ping', required: true },
                { name: 'emoji', type: 3, description: 'Emoji', required: false }
            ]
        },
        {
            name: 'add-role',
            description: 'Ajouter un bouton Rôle à un embed',
            options: [
                { name: 'message_id', type: 3, description: 'ID de l\'embed', required: true },
                { name: 'nom', type: 3, description: 'Nom du rôle sur le bouton', required: true },
                { name: 'role_a_donner', type: 8, description: 'Le rôle à donner', required: true },
                { name: 'emoji', type: 3, description: 'Emoji', required: false }
            ]
        },
        // MODÉRATION
        {
            name: 'ban',
            description: 'Bannir un membre',
            options: [
                { name: 'membre', type: 6, description: 'Cible', required: true },
                { name: 'raison', type: 3, description: 'Raison', required: false }
            ]
        },
        {
            name: 'mute',
            description: 'Mute un membre (Timeout)',
            options: [
                { name: 'membre', type: 6, description: 'Cible', required: true },
                { name: 'minutes', type: 4, description: 'Durée en minutes', required: true }
            ]
        },
        // FUN
        {
            name: 'lovecheck',
            description: 'Test l\'amour entre deux personnes',
            options: [
                { name: 'user1', type: 6, description: 'Premier utilisateur', required: true },
                { name: 'user2', type: 6, description: 'Deuxième utilisateur', required: false }
            ]
        },
        {
            name: 'avatar',
            description: 'Affiche l\'avatar d\'un membre',
            options: [{ name: 'cible', type: 6, description: 'Le membre', required: false }]
        }
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        
        // --- SETUP EMBED ---
        if (interaction.commandName === 'setup-embed') {
            const channel = interaction.options.getChannel('salon');
            const title = interaction.options.getString('titre');
            const desc = interaction.options.getString('description');
            const color = interaction.options.getString('couleur') || '#2F3136';

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(desc)
                .setColor(color)
                .setFooter({ text: 'ZTS System' });

            await channel.send({ embeds: [embed] });
            return interaction.reply({ content: "✅ Embed envoyé ! Copie son ID.", flags: MessageFlags.Ephemeral });
        }

        // --- ADD TICKET / ROLE ---
        if (interaction.commandName === 'add-ticket' || interaction.commandName === 'add-role') {
            const msgId = interaction.options.getString('message_id');
            const label = interaction.options.getString('nom');
            const emoji = interaction.options.getString('emoji') || '✨';
            const isTicket = interaction.commandName === 'add-ticket';
            const targetId = isTicket ? interaction.options.getRole('role_staff').id : interaction.options.getRole('role_a_donner').id;

            try {
                const message = await interaction.channel.messages.fetch(msgId);
                let row = message.components[0] ? ActionRowBuilder.from(message.components[0]) : new ActionRowBuilder();
                
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(isTicket ? `tk_${targetId}_${label}` : `rl_${targetId}`)
                        .setLabel(label)
                        .setStyle(isTicket ? ButtonStyle.Primary : ButtonStyle.Success)
                        .setEmoji(emoji)
                );

                await message.edit({ components: [row] });
                return interaction.reply({ content: "✅ Bouton ajouté !", flags: MessageFlags.Ephemeral });
            } catch (e) {
                return interaction.reply({ content: "Erreur : ID de message invalide.", flags: MessageFlags.Ephemeral });
            }
        }

        // --- FUN : LOVECHECK ---
        if (interaction.commandName === 'lovecheck') {
            const u1 = interaction.options.getUser('user1');
            const u2 = interaction.options.getUser('user2') || interaction.user;
            const love = Math.floor(Math.random() * 101);
            const loveEmbed = new EmbedBuilder()
                .setTitle('❤️ Love Checker')
                .setDescription(`L'amour entre **${u1.username}** et **${u2.username}** est de **${love}%** !`)
                .setColor(love > 50 ? '#FF00EA' : '#5865F2');
            return interaction.reply({ embeds: [loveEmbed] });
        }

        // --- MOD : BAN ---
        if (interaction.commandName === 'ban') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply("Pas de permission.");
            const user = interaction.options.getUser('membre');
            await interaction.guild.members.ban(user);
            return interaction.reply(`🔨 **${user.tag}** a été banni par ZTS.`);
        }
    }

    // --- GESTION DES BOUTONS ---
    if (interaction.isButton()) {
        // Logique Rôle (Auto-role)
        if (interaction.customId.startsWith('rl_')) {
            const roleId = interaction.customId.split('_')[1];
            const role = interaction.guild.roles.cache.get(roleId);
            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(roleId);
                return interaction.reply({ content: `❌ Rôle **${role.name}** retiré.`, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.member.roles.add(roleId);
                return interaction.reply({ content: `✅ Rôle **${role.name}** ajouté !`, flags: MessageFlags.Ephemeral });
            }
        }

        // Logique Ticket
        if (interaction.customId.startsWith('tk_')) {
            const [_, roleId, label] = interaction.customId.split('_');
            const modal = new ModalBuilder().setCustomId(`modal_${roleId}_${label}`).setTitle(`Support: ${label}`);
            const input = new TextInputBuilder().setCustomId('reason').setLabel("Pourquoi ?").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        
        if (interaction.customId === 'close_ticket') {
            await interaction.reply("🔒 Suppression...");
            setTimeout(() => interaction.channel.delete(), 3000);
        }
    }

    // --- LOGIQUE MODAL TICKET ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('reason');

        const chan = await interaction.guild.channels.create({
            name: `zts-${label}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const embed = new EmbedBuilder().setTitle(`Ticket : ${label}`).setDescription(`Raison : ${reason}`).setColor('#2ecc71');
        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer').setStyle(ButtonStyle.Danger));
        
        await chan.send({ content: `<@&${roleId}>`, embeds: [embed], components: [btn] });
        await interaction.reply({ content: `Ticket ouvert : ${chan}`, flags: MessageFlags.Ephemeral });
    }
});

client.login(TOKEN);
