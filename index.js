const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- SERVEUR WEB ANTI-DODO ---
const app = express();
app.get('/', (req, res) => res.send('ZTS GENESIS STATUS: GOD MODE ACTIVATED'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- VARIABLES & DATABASES ---
let autoRoleId = null;
let logChannelId = null;
const xp = new Map();
const giveaways = new Map();

client.once('clientReady', async () => {
    console.log(`🔱 ZTS GENESIS DÉPLOYÉ : ${client.user.tag}`);
    const commands = [
        // CONFIG & TICKETS
        { name: 'setup-embed', description: 'Créer un embed ZTS', options: [{name:'salon', type:7, required:true}, {name:'titre', type:3, required:true}, {name:'desc', type:3, required:true}] },
        { name: 'add-option', description: 'Ajouter Ticket/Rôle', options: [{name:'msg_id', type:3, required:true}, {name:'type', type:3, required:true, choices:[{name:'Ticket', value:'tk'}, {name:'Rôle', value:'rl'}]}, {name:'nom', type:3, required:true}, {name:'cible', type:8, required:true}] },
        
        // MODÉRATION
        { name: 'nuke', description: 'Réinitialiser complètement un salon' },
        { name: 'kick', description: 'Expulser un membre', options: [{name:'membre', type:6, required:true}, {name:'raison', type:3}] },
        { name: 'set-logs', description: 'Salon des logs', options: [{name:'salon', type:7, required:true}] },
        { name: 'set-autorole', description: 'Rôle automatique', options: [{name:'role', type:8, required:true}] },

        // GIVEAWAY
        { name: 'giveaway', description: 'Lancer un concours', options: [{name:'prix', type:3, required:true}, {name:'gagnants', type:4, required:true}] },

        // FUN & SOCIAL
        { name: 'rank', description: 'Voir ton niveau XP' },
        { name: 'slap', description: 'Mettre une gifle', options: [{name:'membre', type:6, required:true}] },
        { name: 'meme', description: 'Afficher un meme aléatoire' },
        { name: 'join', description: 'Faire venir le bot en vocal' }
    ];
    await client.application.commands.set(commands);
});

// --- SYSTÈME XP ---
client.on('messageCreate', m => {
    if (m.author.bot || !m.guild) return;
    let uXp = xp.get(m.author.id) || { xp: 0, level: 1 };
    uXp.xp += 5;
    if (uXp.xp >= uXp.level * 100) {
        uXp.level++;
        m.channel.send(`✨ GG ${m.author}, tu es passé niveau **${uXp.level}** !`);
    }
    xp.set(m.author.id, uXp);
});

client.on('interactionCreate', async i => {
    if (i.isChatInputCommand()) {
        
        // NUKE
        if (i.commandName === 'nuke') {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) return i.reply("Non.");
            const newChan = await i.channel.clone();
            await i.channel.delete();
            return newChan.send("☢️ Salon atomisé et réinitialisé !");
        }

        // GIVEAWAY
        if (i.commandName === 'giveaway') {
            const prix = i.options.getString('prix');
            const n = i.options.getInteger('gagnants');
            const emb = new EmbedBuilder().setTitle('🎉 GIVEAWAY !').setDescription(`Prix : **${prix}**\nNombre de gagnants : **${n}**\n\nCliquez sur le bouton pour participer !`).setColor('Gold');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('gw_join').setLabel('Participer !').setStyle(ButtonStyle.Primary).setEmoji('🎁'));
            const msg = await i.reply({ embeds: [emb], components: [row], fetchReply: true });
            giveaways.set(msg.id, { participants: [], prize: prix, winners: n });
        }

        // RANK
        if (i.commandName === 'rank') {
            const data = xp.get(i.user.id) || { xp: 0, level: 1 };
            return i.reply(`📊 **${i.user.username}** | Niveau : **${data.level}** (${data.xp} XP)`);
        }

        // SLAP
        if (i.commandName === 'slap') {
            const target = i.options.getUser('membre');
            return i.reply(`🖐️ **${i.user.username}** met une énorme baffe à **${target.username}** !`);
        }

        // SETUP EMBED (Ticket/Role) - Toujours là !
        if (i.commandName === 'setup-embed') {
            const channel = i.options.getChannel('salon');
            const embed = new EmbedBuilder().setTitle(i.options.getString('titre')).setDescription(i.options.getString('desc')).setColor('#2b2d31');
            await channel.send({ embeds: [embed] });
            return i.reply({ content: "✅ Embed OK", flags: MessageFlags.Ephemeral });
        }
    }

    // --- LOGIQUE BOUTONS ---
    if (i.isButton()) {
        // GIVEAWAY JOIN
        if (i.customId === 'gw_join') {
            const gw = giveaways.get(i.message.id);
            if (!gw) return i.reply({ content: "Expiré", flags: MessageFlags.Ephemeral });
            if (gw.participants.includes(i.user.id)) return i.reply({ content: "Déjà inscrit !", flags: MessageFlags.Ephemeral });
            gw.participants.push(i.user.id);
            return i.reply({ content: "✅ Inscription validée !", flags: MessageFlags.Ephemeral });
        }

        // TICKET MODAL (Correction interaction)
        if (i.customId.startsWith('tk_')) {
            const [_, roleId, label] = i.customId.split('_');
            const modal = new ModalBuilder().setCustomId(`mod_${roleId}_${label}`).setTitle(`Support : ${label}`);
            const input = new TextInputBuilder().setCustomId('r').setLabel("Raison").setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await i.showModal(modal);
        }

        // AUTO-ROLE
        if (i.customId.startsWith('rl_')) {
            const rId = i.customId.split('_')[1];
            if (i.member.roles.cache.has(rId)) {
                await i.member.roles.remove(rId);
                return i.reply({ content: "Rôle retiré.", flags: MessageFlags.Ephemeral });
            } else {
                await i.member.roles.add(rId);
                return i.reply({ content: "Rôle ajouté !", flags: MessageFlags.Ephemeral });
            }
        }
    }

    // --- MODAL TICKET ---
    if (i.isModalSubmit() && i.customId.startsWith('mod_')) {
        const [_, rId, lab] = i.customId.split('_');
        const reason = i.fields.getTextInputValue('r');
        const chan = await i.guild.channels.create({
            name: `ticket-${lab}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: rId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });
        await chan.send({ content: `<@&${rId}>`, embeds: [new EmbedBuilder().setTitle(lab).setDescription(`Auteur: ${i.user}\nRaison: ${reason}`).setColor('Blue')] });
        return i.reply({ content: `Ticket ouvert : ${chan}`, flags: MessageFlags.Ephemeral });
    }
});

// --- LOGS & AUTO-ROLE ---
client.on('guildMemberAdd', member => {
    if (autoRoleId) member.roles.add(autoRoleId).catch(() => {});
});

process.on('unhandledRejection', e => console.log('ERREUR CAPTURÉE :', e));
client.login(process.env.BOT_TOKEN);
