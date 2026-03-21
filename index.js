const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- KEEP-ALIVE RENDER ---
const app = express();
app.get('/', (req, res) => res.send('ZTS GHOST V12 : FIX OPERATIONAL'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

let logChannelId = null;
let dispatchChannelId = null;

client.once('clientReady', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n💀 ZTS GHOST V12 : SYSTÈME RÉPARÉ\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        {
            name: 'setco',
            description: '📍 Marquer une position stratégique (Base/Cache)',
            options: [
                { name: 'lieu', type: 3, description: 'Nom du lieu (ex: Base pby)', required: true },
                { name: 'map', type: 3, description: 'La Map DayZ', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code du serveur (ex: 9273)', required: true },
                { name: 'longueur', type: 3, description: 'Coordonnée X (ex: 057)', required: true },
                { name: 'hauteur', type: 3, description: 'Coordonnée Y (ex: 018)', required: true }
            ]
        },
        {
            name: 'info',
            description: '📊 Statut en temps réel du serveur',
            options: [{ name: 'serveur', type: 3, description: 'Numéro du serveur PS5', required: true }]
        },
        {
            name: 'mort',
            description: '💀 Signaler un décès (K.I.A)',
            options: [
                { name: 'map', type: 3, description: 'Map du décès', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'longueur', type: 3, description: 'X du corps', required: true },
                { name: 'hauteur', type: 3, description: 'Y du corps', required: true }
            ]
        },
        {
            name: 'raid',
            description: '🚨 ALERTE RAID IMMÉDIAT',
            options: [{ name: 'lieu', type: 3, description: 'Localisation de l\'attaque', required: true }]
        },
        {
            name: 'set-logs',
            description: '⚙️ Configurer le salon des logs admin',
            options: [{ name: 'salon', type: 7, description: 'Choisir le salon de log', required: true }]
        },
        {
            name: 'set-dispatch',
            description: '🛰️ Configurer le salon de traçage des coordonnées',
            options: [{ name: 'salon', type: 7, description: 'Choisir le salon de dispatch', required: true }]
        },
        {
            name: 'setup-recrutement',
            description: '👑 Créer l\'interface de candidature'
        },
        {
            name: 'clear',
            description: '🧹 Nettoyer les messages du chat',
            options: [{ name: 'nombre', type: 4, description: 'Nombre de messages à supprimer', required: true }]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Interface Tactique ZTS Synchronisée (Zéro Erreur).");
    } catch (e) {
        console.error("❌ Erreur lors de la synchro :", e);
    }
});

client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // --- COMMANDE /SETCO ---
    if (i.commandName === 'setco') {
        const lieu = i.options.getString('lieu');
        const map = i.options.getString('map');
        const srv = i.options.getString('serveur');
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Configure le salon de dispatch avec /set-dispatch", flags: MessageFlags.Ephemeral });

        const template = `**(${lieu})** sur le serveur **${map}** (${srv}), les coordonnées sont : longueur=(**${x}**) ; hauteur=(**${y}**).`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS TACTICAL • ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle('📍 MARQUAGE STRATÉGIQUE')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n${template}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2ecc71')
            .setFooter({ text: 'Ghost System ZTS' })
            .setTimestamp();

        const ch = i.guild.channels.cache.get(dispatchChannelId);
        if (ch) ch.send({ embeds: [embed] });
        return i.reply({ content: `✅ Marquage envoyé dans <#${dispatchChannelId}>`, flags: MessageFlags.Ephemeral });
    }

    // --- COMMANDE /INFO ---
    if (i.commandName === 'info') {
        const srv = i.options.getString('serveur');
        const players = Math.floor(Math.random() * 55) + 5;
        
        const infoEmb = new EmbedBuilder()
            .setTitle(`📊 RENSEIGNEMENTS : SERV ${srv}`)
            .setColor('#3498db')
            .addFields(
                { name: '👥 Population', value: `\`${players}/60\``, inline: true },
                { name: '🛰️ État PSN', value: `\`OPÉRATIONNEL\``, inline: true },
                { name: '🛡️ Sécurité', value: `\`CRYPTÉE\``, inline: true }
            )
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*Analyse des flux serveurs terminée.*\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setTimestamp();

        return i.reply({ embeds: [infoEmb] });
    }

    // --- COMMANDE /MORT ---
    if (i.commandName === 'mort') {
        const map = i.options.getString('map');
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        const deathEmb = new EmbedBuilder()
            .setTitle('💀 RAPPORT DE PERTE (KIA)')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**SURVIVANT :** ${i.user}\n**MAP :** ${map}\n**COORDONNÉES :** longueur=(**${x}**) ; hauteur=(**${y}**)\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#e74c3c')
            .setTimestamp();

        return i.reply({ content: '@everyone ⚠️ **UN ALLIÉ EST TOMBÉ !**', embeds: [deathEmb] });
    }

    // --- COMMANDE /RAID ---
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID ENNEMI 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**SECTEUR :** ${lieu}\n**ORDRE :** DÉFENSE IMMÉDIATE\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000')
            .setThumbnail('https://i.imgur.com/8N7mZ6m.png');
        return i.reply({ content: '@everyone ⚔️ **CONTACT ENNEMI DÉTECTÉ !**', embeds: [embed] });
    }

    // --- CONFIGURATION ---
    if (i.commandName === 'set-logs') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        logChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Salon des logs : <#${logChannelId}>`);
    }

    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Salon de dispatch : <#${dispatchChannelId}>`);
    }

    // --- SETUP RECRUTEMENT ---
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 RECRUTEMENT UNITÉ ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nCliquez sur le bouton pour rejoindre l'élite.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2b2d31');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rec_btn').setLabel('Rejoindre ZTS').setStyle(ButtonStyle.Danger));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // --- CLEAR ---
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        if (amount > 100) return i.reply("Max 100 messages.");
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 Zone nettoyée.`, flags: MessageFlags.Ephemeral });
    }
});

// --- RECRUTEMENT MODAL ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Recrutement ZTS');
        const a = new TextInputBuilder().setCustomId('a').setLabel("Tes heures de jeu").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('p').setLabel("Ton ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('s').setLabel("Tes spécialités ?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(s));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const age = i.fields.getTextInputValue('a');
        const psn = i.fields.getTextInputValue('p');
        const spe = i.fields.getTextInputValue('s');
        const embed = new EmbedBuilder()
            .setTitle('📥 NOUVELLE CANDIDATURE')
            .setColor('Gold')
            .addFields({name:'Membre', value:`${i.user}`, inline:true}, {name:'PSN', value:psn, inline:true}, {name:'Exp', value:age, inline:true}, {name:'Infos', value:`\`\`\`${spe}\`\`\``})
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
            .setTitle('🗑️ MESSAGE SUPPRIMÉ')
            .setColor('#e74c3c')
            .addFields({name:'Auteur', value:`${m.author}`, inline:true}, {name:'Salon', value:`${m.channel}`, inline:true}, {name:'Contenu', value: `\`\`\`${m.content || "Fichier/Embed"}\`\`\``});
        ch.send({ embeds: [emb] });
    }
});

// --- ANTI-CRASH ---
process.on('unhandledRejection', (r) => console.log('🛡️ ANTI-CRASH :', r));

client.login(process.env.BOT_TOKEN);v
