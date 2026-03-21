const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- ANTI-CRASH & KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('ZTS V3 TITAN IS ONLINE!'));
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

// Base de données temporaire (se vide au redémarrage Render, idéal pour tester)
const warns = new Map(); 

client.once('clientReady', async () => {
    console.log(`✅ ZTS V3 Connecté : ${client.user.tag}`);
    
    const commands = [
        {
            name: 'setup-embed',
            description: 'Créer un socle pour Tickets/Rôles',
            options: [
                { name: 'salon', type: 7, description: 'Salon', required: true },
                { name: 'titre', type: 3, description: 'Titre', required: true },
                { name: 'description', type: 3, description: 'Texte', required: true },
                { name: 'image', type: 3, description: 'Lien d\'une image (URL)', required: false }
            ]
        },
        {
            name: 'add-option',
            description: 'Ajouter un bouton (Ticket ou Rôle)',
            options: [
                { name: 'message_id', type: 3, description: 'ID du message', required: true },
                { name: 'type', type: 3, description: 'Type de bouton', required: true, choices: [{name: 'Ticket', value: 'tk'}, {name: 'Rôle', value: 'rl'}] },
                { name: 'nom', type: 3, description: 'Texte du bouton', required: true },
                { name: 'cible_role', type: 8, description: 'Rôle (à donner ou à ping)', required: true },
                { name: 'emoji', type: 3, description: 'Emoji', required: false }
            ]
        },
        {
            name: 'warn',
            description: 'Avertir un membre',
            options: [
                { name: 'membre', type: 6, description: 'Cible', required: true },
                { name: 'raison', type: 3, description: 'Raison', required: true }
            ]
        },
        {
            name: 'warns-list',
            description: 'Voir les warns d\'un membre',
            options: [{ name: 'membre', type: 6, description: 'Cible', required: true }]
        },
        {
            name: 'user-info',
            description: 'Afficher le profil complet d\'un membre',
            options: [{ name: 'membre', type: 6, description: 'Cible', required: false }]
        },
        {
            name: 'clear',
            description: 'Nettoyage rapide du chat',
            options: [{ name: 'nombre', type: 4, description: 'Nombre (1-100)', required: true }]
        }
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- SETUP EMBED ---
    if (interaction.commandName === 'setup-embed') {
        const channel = interaction.options.getChannel('salon');
        const img = interaction.options.getString('image');
        const embed = new EmbedBuilder()
            .setTitle(`👑 ${interaction.options.getString('titre')}`)
            .setDescription(interaction.options.getString('description'))
            .setColor('#2b2d31')
            .setTimestamp();
        
        if (img) embed.setImage(img);

        await channel.send({ embeds: [embed] });
        return interaction.reply({ content: "✅ Embed ZTS déployé !", flags: MessageFlags.Ephemeral });
    }

    // --- ADD OPTION ---
    if (interaction.commandName === 'add-option') {
        const msgId = interaction.options.getString('message_id');
        const type = interaction.options.getString('type');
        const label = interaction.options.getString('nom');
        const role = interaction.options.getRole('cible_role');
        const emoji = interaction.options.getString('emoji') || '🔹';

        try {
            const message = await interaction.channel.messages.fetch(msgId);
            let row = message.components[0] ? ActionRowBuilder.from(message.components[0]) : new ActionRowBuilder();
            
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${type}_${role.id}_${label}`)
                    .setLabel(label)
                    .setStyle(type === 'tk' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji(emoji)
            );

            await message.edit({ components: [row] });
            return interaction.reply({ content: "✅ Bouton ZTS ajouté !", flags: MessageFlags.Ephemeral });
        } catch (e) {
            return interaction.reply({ content: "❌ Erreur : Message introuvable.", flags: MessageFlags.Ephemeral });
        }
    }

    // --- WARN SYSTEM ---
    if (interaction.commandName === 'warn') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply("Pas de permission !");
        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        
        if (!warns.has(target.id)) warns.set(target.id, []);
        warns.get(target.id).push({ reason, date: new Date().toLocaleDateString(), mod: interaction.user.tag });

        const warnEmbed = new EmbedBuilder()
            .setTitle("⚠️ Avertissement !")
            .setColor('#FFCC00')
            .addFields(
                { name: 'Coupable', value: `${target}`, inline: true },
                { name: 'Modérateur', value: `${interaction.user}`, inline: true },
                { name: 'Raison', value: `\`${reason}\`` }
            );
        return interaction.reply({ embeds: [warnEmbed] });
    }

    // --- USER INFO ---
    if (interaction.commandName === 'user-info') {
        const member = interaction.options.getMember('membre') || interaction.member;
        const infoEmbed = new EmbedBuilder()
            .setAuthor({ name: `Profil de ${member.user.username}`, iconURL: member.user.displayAvatarURL() })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor('#5865F2')
            .addFields(
                { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
                { name: '📅 Rejoint le', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: '🎭 Rôles', value: `${member.roles.cache.size > 1 ? member.roles.cache.map(r => r).join(' ').replace('@everyone', '') : 'Aucun'}` }
            );
        return interaction.reply({ embeds: [infoEmbed] });
    }
});

// --- LOGIQUE BOUTONS (TICKETS / ROLES) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // AUTO-ROLE
    if (interaction.customId.startsWith('rl_')) {
        const roleId = interaction.customId.split('_')[1];
        if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(roleId);
            return interaction.reply({ content: "❌ Rôle retiré.", flags: MessageFlags.Ephemeral });
        } else {
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: "✅ Rôle ajouté.", flags: MessageFlags.Ephemeral });
        }
    }

    // TICKET
    if (interaction.customId.startsWith('tk_')) {
        const [_, roleId, label] = interaction.customId.split('_');
        const modal = new ModalBuilder().setCustomId(`modal_${roleId}_${label}`).setTitle(`${label}`);
        const input = new TextInputBuilder().setCustomId('reason').setLabel("Raison").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
});

client.login(process.env.BOT_TOKEN);
