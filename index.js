const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- SERVEUR WEB (ANTI-DODO RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OVERLORD V9 : SYSTEM ONLINE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember] // FIX APPORTÉ ICI (Partials avec un S)
});

// --- VARIABLES DE STOCKAGE ---
let logChannelId = null;
let dispatchChannelId = null;
const shoppingList = new Map();
const blacklist = new Map();
const xpSystem = new Map();

// --- INITIALISATION ---
client.once('ready', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n🛡️ ZTS OVERLORD V9 DÉPLOYÉ : ${client.user.tag}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        // --- COMMANDES DE POSITION ---
        {
            name: 'position',
            description: '📍 Signalement tactique (Log-In/Out)',
            options: [
                { name: 'etat', type: 3, description: 'Action', required: true, choices: [{name:'📥 Connexion', value:'spawn'}, {name:'📤 Déconnexion', value:'despawn'}] },
                { name: 'type', type: 3, description: 'Type de lieu', required: true, choices: [{name:'👤 Perso', value:'Perso'}, {name:'🏰 Base', value:'Base'}, {name:'📦 Cache', value:'Cache'}] },
                { name: 'serveur', type: 3, description: 'Code serv (Max 4 car.)', required: true },
                { name: 'coords', type: 3, description: 'Coordonnées (ex: 045 120)', required: true }
            ]
        },
        { name: 'mort', description: '💀 Signaler un décès', options: [{ name: 'coords', type: 3, description: 'Position corps', required: true }] },
        
        // --- LOGISTIQUE & TEAM ---
        {
            name: 'besoin',
            description: '🛒 Ajouter un item aux besoins base',
            options: [
                { name: 'item', type: 3, description: 'Nom objet', required: true },
                { name: 'quantite', type: 3, description: 'Nombre', required: true }
            ]
        },
        { name: 'liste-besoin', description: '📋 Voir l\'inventaire manquant' },
        {
            name: 'meteo',
            description: '☁️ Rapporter la météo sur le serveur',
            options: [{ name: 'temps', type: 3, required: true, choices: [{name:'☀️ Soleil', value:'soleil'}, {name:'🌧️ Pluie', value:'pluie'}, {name:'🌫️ Brouillard', value:'brouillard'}] }]
        },
        
        // --- ADMIN & CONFIG ---
        { name: 'raid', description: '🚨 ALERTE ROUGE RAID', options: [{name:'lieu', type:3, description:'Lieu', required:true}] },
        { name: 'set-logs', description: '⚙️ Config logs admin', options: [{name:'salon', type:7, required:true}] },
        { name: 'set-dispatch', description: '🛰️ Config salon traçage', options: [{name:'salon', type:7, required:true}] },
        { name: 'setup-recrutement', description: '👑 Interface recrutement' },
        { name: 'rank', description: '🎖️ Ton grade ZTS' },
        { name: 'clear', description: '🧹 Nettoyer chat', options: [{name:'nombre', type:4, required:true}] }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Interface Tactique ZTS Synchronisée.");
    } catch (e) { console.error("❌ Erreur synchro :", e); }
});

// --- INTERACTIONS ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // POSITION SYSTEM
    if (i.commandName === 'position') {
        const et = i.options.getString('etat');
        const ty = i.options.getString('type');
        const srv = i.options.getString('serveur').substring(0, 4).toUpperCase();
        const co = i.options.getString('coords');
        if (!dispatchChannelId) return i.reply({ content: "⚠️ Dispatch non configuré.", flags: MessageFlags.Ephemeral });

        const isSpawn = et === 'spawn';
        const embed = new EmbedBuilder()
            .setAuthor({ name: `SURVIVANT : ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle(isSpawn ? '🟢 SIGNAL : IN-GAME' : '🟠 SIGNAL : OUT-GAME')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**LIEU :** \`${ty}\`\n**SERVEUR :** \`${srv}\`\n**COORDONNÉES :** \`${co}\`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor(isSpawn ? '#2ecc71' : '#e67e22')
            .setTimestamp();

        const ch = i.guild.channels.cache.get(dispatchChannelId);
        if (ch) ch.send({ embeds: [embed] });
        return i.reply({ content: `✅ Signal ${et} transmis.`, flags: MessageFlags.Ephemeral });
    }

    // RAID SYSTEM
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE RAID : ZTS UNIT 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**COORDONNÉES :** ${lieu}\n**STATUT :** MOBILISATION MAXIMALE\n**UNITÉ :** @everyone\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000');
        return i.reply({ content: '⚔️ **ALERTE GÉNÉRALE !**', embeds: [embed] });
    }

    // LOGISTIQUE
    if (i.commandName === 'besoin') {
        const item = i.options.getString('item');
        const qte = i.options.getString('quantite');
        shoppingList.set(item, { qte, user: i.user.username });
        return i.reply(`🛒 **Logistique :** \`${qte}x ${item}\` ajouté à la liste.`);
    }

    if (i.commandName === 'liste-besoin') {
        let content = "";
        shoppingList.forEach((v, k) => content += `• **${k}** (x${v.qte}) - *par ${v.user}*\n`);
        const embed = new EmbedBuilder()
            .setTitle('📋 BESOINS LOGISTIQUES ZTS')
            .setColor('#3498db')
            .setDescription(content || "La base est opérationnelle (Aucun besoin).")
            .setFooter({ text: 'ZTS Tactical Unit' });
        return i.reply({ embeds: [embed] });
    }

    // CONFIGURATION
    if (i.commandName === 'set-logs') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        logChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Logs configurés dans <#${logChannelId}>.`);
    }

    if (i.commandName === 'set-dispatch') {
        if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) return i.reply("Admin requis.");
        dispatchChannelId = i.options.getChannel('salon').id;
        return i.reply(`✅ Dispatch configuré dans <#${dispatchChannelId}>.`);
    }

    // METEO
    if (i.commandName === 'meteo') {
        const t = i.options.getString('temps');
        return i.reply(`☁️ **MÉTÉO DAYZ :** Un survivant rapporte du temps : **${t}**. Préparez vos équipements !`);
    }

    // RECRUTEMENT
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 UNITÉ ZTS - RECRUTEMENT PS5')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nRejoignez l'élite des survivants.\n\n**REQUIS :**\n• +18 ans de préférence\n• Connaissance Map\n• Disponibilité Soirée\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#000000');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rec_btn').setLabel('Postuler').setStyle(ButtonStyle.Danger));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // CLEAR
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 Nettoyage de \`${amount}\` messages effectué.`, flags: MessageFlags.Ephemeral });
    }
});

// --- BOUTONS & MODALS ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Dossier Recrue ZTS');
        const a = new TextInputBuilder().setCustomId('a').setLabel("Âge / Heures de jeu").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('p').setLabel("ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('s').setLabel("Pourquoi toi ?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(p), new ActionRowBuilder().addComponents(s));
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const age = i.fields.getTextInputValue('a');
        const psn = i.fields.getTextInputValue('p');
        const spe = i.fields.getTextInputValue('s');
        const embed = new EmbedBuilder()
            .setTitle('📥 NOUVELLE RECRUE')
            .setColor('Gold')
            .addFields({name:'Survivant', value:`${i.user}`, inline:true}, {name:'PSN', value:psn, inline:true}, {name:'Exp', value:age, inline:true}, {name:'Profil', value:`\`\`\`${spe}\`\`\``})
            .setTimestamp();
        await i.reply({ content: "Dossier envoyé au Haut Commandement ZTS.", flags: MessageFlags.Ephemeral });
        const ch = i.guild.channels.cache.find(c => c.name.includes('recrut') || c.name.includes('log'));
        if (ch) ch.send({ embeds: [embed] });
    }
});

// --- LOGS MESSAGES SUPPRIMÉS ---
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

// --- SYSTÈME XP ---
client.on('messageCreate', m => {
    if (m.author.bot || !m.guild) return;
    let d = xpSystem.get(m.author.id) || { xp: 0, r: 'Recrue' };
    d.xp += 1;
    if (d.xp > 100) d.r = 'Éclaireur';
    if (d.xp > 500) d.r = 'Officier';
    xpSystem.set(m.author.id, d);
});

// --- ANTI-CRASH ---
process.on('unhandledRejection', (r) => console.log('🛡️ ANTI-CRASH :', r));

client.login(process.env.BOT_TOKEN);
