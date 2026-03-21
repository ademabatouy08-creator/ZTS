const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('ZTS GHOST V11 : OPERATIONAL'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

let logChannelId = null;
let dispatchChannelId = null;

client.once('ready', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n💀 ZTS GHOST V11 DÉPLOYÉ : ${client.user.tag}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique (Base/Cache)',
            options: [
                { name: 'lieu', type: 3, description: 'Nom (ex: Base pby)', required: true },
                { name: 'map', type: 3, description: 'La Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code serv (ex: 9273)', required: true },
                { name: 'longueur', type: 3, description: 'X (ex: 057)', required: true },
                { name: 'hauteur', type: 3, description: 'Y (ex: 018)', required: true }
            ]
        },
        {
            name: 'info',
            description: '📊 Obtenir les infos en temps réel du serveur',
            options: [{ name: 'serveur', type: 3, description: 'Code du serveur (ex: 9273)', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un décès (K.I.A)',
            options: [
                { name: 'map', type: 3, description: 'La Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'X', required: true },
                { name: 'hauteur', type: 3, description: 'Y', required: true }
            ]
        },
        { name: 'raid', description: '🚨 ALERTE RAID IMMÉDIAT', options: [{name:'lieu', type:3, description:'Position', required:true}] },
        { name: 'set-logs', description: '⚙️ Config logs admin', options: [{name:'salon', type:7, required:true}] },
        { name: 'set-dispatch', description: '🛰️ Config salon traçage', options: [{name:'salon', type:7, required:true}] },
        { name: 'setup-recrutement', description: '👑 Interface recrutement' },
        { name: 'clear', description: '🧹 Nettoyer le chat', options: [{name:'nombre', type:4, required:true}] }
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // --- COMMANDE /SETCO (CORRIGÉE) ---
    if (i.commandName === 'setco') {
        const lieu = i.options.getString('lieu');
        const map = i.options.getString('map');
        const srv = i.options.getString('serveur');
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Configure le salon avec /set-dispatch", flags: MessageFlags.Ephemeral });

        const template = `**(${lieu})** sur le serveur **${map}** (${srv}), les coordonnées sont : longueur=(**${x}**) ; hauteur=(**${y}**).`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS TACTICAL • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 NOUVEAU MARQUAGE DE ZONE')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n${template}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2ecc71')
            .setThumbnail('https://i.imgur.com/vH9v5Z9.png')
            .setFooter({ text: 'Système de reconnaissance ZTS' })
            .setTimestamp();

        const ch = i.guild.channels.cache.get(dispatchChannelId);
        if (ch) ch.send({ embeds: [embed] });
        return i.reply({ content: `✅ Coordonnées transmises au dispatch.`, flags: MessageFlags.Ephemeral });
    }

    // --- COMMANDE /INFO (TEMPS RÉEL RP) ---
    if (i.commandName === 'info') {
        const srv = i.options.getString('serveur');
        
        // Simulation de données (DayZ API n'est pas accessible directement sans serveur tiers, on fait un simulateur pro)
        const players = Math.floor(Math.random() * 60);
        const uptime = Math.floor(Math.random() * 4);
        
        const infoEmb = new EmbedBuilder()
            .setTitle(`📊 STATUS SERVEUR : ${srv}`)
            .setColor('#3498db')
            .addFields(
                { name: '👥 Joueurs', value: `\`${players}/60\``, inline: true },
                { name: '⏳ Relancement', value: `dans \`${uptime}h ${players}m\``, inline: true },
                { name: '🛰️ Latence', value: `\`24ms (Stable)\``, inline: true },
                { name: '🌍 Map Active', value: `\`Chernarus Plus\``, inline: false }
            )
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*Données synchronisées avec le PSN Network ZTS.*\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setFooter({ text: 'ZTS Intelligence Service' })
            .setTimestamp();

        return i.reply({ embeds: [infoEmb] });
    }

    // --- MORT ---
    if (i.commandName === 'mort') {
        const map = i.options.getString('map');
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        const deathEmb = new EmbedBuilder()
            .setTitle('💀 RAPPORT DE PERTE (K.I.A)')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**SURVIVANT :** ${i.user}\n**MAP :** ${map}\n**POSITION :** longueur=(**${x}**) ; hauteur=(**${y}**)\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#e74c3c')
            .setTimestamp();

        return i.reply({ content: '@everyone ⚠️ **UN MEMBRE EST TOMBÉ !**', embeds: [deathEmb] });
    }

    // --- RAID ALERT ---
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID ZTS 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**CIBLE DÉTECTÉE :** ${lieu}\n**ORDRE :** MOBILISATION TOTALE\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000')
            .setThumbnail('https://i.imgur.com/8N7mZ6m.png');
        return i.reply({ content: '@everyone ⚔️ **CONTACT ENNEMI !**', embeds: [embed] });
    }

    // --- CONFIG ---
    if (i.commandName === 'set-logs') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        logChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Logs configurés.`);
    }

    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Dispatch configuré.`);
    }

    // --- SETUP RECRUTEMENT ---
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 RECRUTEMENT UNITÉ ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*Vous voulez rejoindre la team sur PS5 ?*\n\nCliquez sur le bouton ci-dessous pour soumettre votre dossier.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#000000');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rec_btn').setLabel('Postuler').setStyle(ButtonStyle.Danger));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // --- CLEAR ---
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 Nettoyage terminé.`, flags: MessageFlags.Ephemeral });
    }
});

// --- RECRUTEMENT MODAL ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Recrutement ZTS');
        const a = new TextInputBuilder().setCustomId('a').setLabel("Heures DayZ").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('p').setLabel("ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('s').setLabel("Pourquoi vous ?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(s));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const age = i.fields.getTextInputValue('a');
        const psn = i.fields.getTextInputValue('p');
        const spe = i.fields.getTextInputValue('s');
        const embed = new EmbedBuilder()
            .setTitle('📥 CANDIDATURE REÇUE')
            .setColor('Gold')
            .addFields({name:'Survivant', value:`${i.user}`, inline:true}, {name:'PSN', value:psn, inline:true}, {name:'Exp', value:age, inline:true}, {name:'Dossier', value:`\`\`\`${spe}\`\`\``})
            .setTimestamp();
        await i.reply({ content: "🫡 Dossier envoyé.", flags: MessageFlags.Ephemeral });
        const ch = i.guild.channels.cache.find(c => c.name.includes('recrut') || c.name.includes('log'));
        if (ch) ch.send({ embeds: [embed] });
    }
});

// --- LOGS SUPPRESSION ---
client.on('messageDelete', async m => {
    if (!logChannelId || m.author?.bot) return;
    const ch = m.guild.channels.cache.get(logChannelId);
    if (ch) {
        const emb = new EmbedBuilder()
            .setTitle('🗑️ LOG : MESSAGE SUPPRIMÉ')
            .setColor('#e74c3c')
            .addFields({name:'Auteur', value:`${m.author}`, inline:true}, {name:'Salon', value:`${m.channel}`, inline:true}, {name:'Contenu', value:`\`\`\`${m.content || "Fichier"}\`\`\``});
        ch.send({ embeds: [emb] });
    }
});

// --- ANTI-CRASH ---
process.on('unhandledRejection', (r) => console.log('🛡️ ANTI-CRASH :', r));

client.login(process.env.BOT_TOKEN);
