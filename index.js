const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- SERVEUR WEB (ANTI-DODO RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OVERLORD V8 : SYSTEM ONLINE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partial.Message, Partials.GuildMember]
});

// --- VARIABLES DE CONFIGURATION ---
let logChannelId = null;
let dispatchChannelId = null;
let verifyRoleId = null;
const shoppingList = new Map(); // Map pour gérer les quantités
const blacklist = new Map();
const xpSystem = new Map();

// --- INITIALISATION DU BOT ---
client.once('clientReady', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n🛡️ ZTS OVERLORD DÉPLOYÉ : ${client.user.tag}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        // --- SYSTÈME TACTIQUE DAYZ ---
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
        {
            name: 'mort',
            description: '💀 Signaler un décès pour récupération de stuff',
            options: [{ name: 'coords', type: 3, description: 'Position du corps', required: true }]
        },
        {
            name: 'besoin',
            description: '🛒 Ajouter un item à la logistique base',
            options: [
                { name: 'item', type: 3, description: 'Nom de l\'objet', required: true },
                { name: 'quantite', type: 3, description: 'Combien ?', required: true }
            ]
        },
        { name: 'liste-besoin', description: '📋 Voir l\'inventaire manquant de la base' },
        {
            name: 'blacklist',
            description: '🚫 Ficher un ennemi PSN',
            options: [
                { name: 'psn', type: 3, description: 'ID PSN de l\'ennemi', required: true },
                { name: 'raison', type: 3, description: 'Motif du fichage', required: true }
            ]
        },

        // --- COMMANDES DE STRUCTURE & ADMIN ---
        { name: 'raid', description: '🚨 ALERTE ROUGE : Raid en cours', options: [{name:'lieu', type:3, description:'Position de l\'attaque', required:true}] },
        { name: 'set-logs', description: '⚙️ Configurer le salon des logs', options: [{name:'salon', type:7, description:'Salon cible', required:true}] },
        { name: 'set-dispatch', description: '🛰️ Configurer le salon de traçage', options: [{name:'salon', type:7, description:'Salon cible', required:true}] },
        { name: 'setup-recrutement', description: '👑 Créer l\'interface de recrutement' },
        { name: 'clear', description: '🧹 Nettoyer le chat', options: [{name:'nombre', type:4, description:'Nombre de messages', required:true}] },
        { name: 'rank', description: '🎖️ Voir ton grade au sein de la ZTS' }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("✅ Commandes Titan synchronisées.");
    } catch (e) { console.error("❌ Erreur synchro :", e); }
});

// --- GESTION DES COMMANDES SLASH ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // 1. POSITIONING SYSTEM
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
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**STATUS :** \`${ty}\`\n**SERVEUR :** \`${srv}\`\n**COORDONNÉES :** \`${co}\`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor(isSpawn ? '#2ecc71' : '#e67e22')
            .setTimestamp();

        const ch = i.guild.channels.cache.get(dispatchChannelId);
        if (ch) ch.send({ embeds: [embed] });
        return i.reply({ content: `✅ Transmission effectuée.`, flags: MessageFlags.Ephemeral });
    }

    // 2. LOGISTIQUE
    if (i.commandName === 'besoin') {
        const item = i.options.getString('item');
        const qte = i.options.getString('quantite');
        shoppingList.set(item, { qte, user: i.user.username });
        return i.reply(`🛒 **Logistique :** \`${qte}x ${item}\` ajouté à la liste par **${i.user.username}**.`);
    }

    if (i.commandName === 'liste-besoin') {
        let content = "";
        shoppingList.forEach((val, key) => { content += `• **${key}** (x${val.qte}) - *par ${val.user}*\n`; });
        const listEmb = new EmbedBuilder()
            .setTitle('📋 INVENTAIRE DES BESOINS - ZTS')
            .setColor('#3498db')
            .setDescription(content || "Aucun besoin enregistré. La base est full !")
            .setFooter({ text: 'ZTS Logistics' });
        return i.reply({ embeds: [listEmb] });
    }

    // 3. RAID & COMBAT
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const raidEmb = new EmbedBuilder()
            .setTitle('🚨 ALERTE ROUGE : RAID EN COURS 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**OBJECTIF :** ${lieu}\n**PRIORITÉ :** IMMÉDIATE\n**UNITÉ :** @everyone\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000')
            .setTimestamp();
        return i.reply({ content: '⚔️ **MOBILISATION GÉNÉRALE !**', embeds: [raidEmb] });
    }

    // 4. CONFIGURATION
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

    // 5. RECRUTEMENT INTERFACE
    if (i.commandName === 'setup-recrutement') {
        const emb = new EmbedBuilder()
            .setTitle('👑 REJOINDRE LA UNITÉ ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nVous souhaitez intégrer une team organisée sur DayZ PS5 ?\n\n**Pré-requis :**\n• Micro obligatoire\n• Maturité & Respect\n• Esprit d'équipe\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#2b2d31');
        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rec_btn').setLabel('Déposer Candidature').setStyle(ButtonStyle.Secondary).setEmoji('🎖️')
        );
        return i.reply({ embeds: [emb], components: [btn] });
    }
    
    // 6. CLEAR
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 \`${amount}\` messages supprimés.`, flags: MessageFlags.Ephemeral });
    }
});

// --- GESTION DES BOUTONS & MODALS (RECRUTEMENT) ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Formulaire de Recrue ZTS');
        const a = new TextInputBuilder().setCustomId('age').setLabel("Âge / Heures de jeu").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('psn').setLabel("Ton ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('spe').setLabel("Spécialité (PVP, Builder, Farmer)").setStyle(TextInputStyle.Paragraph).setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(a),
            new ActionRowBuilder().addComponents(p),
            new ActionRowBuilder().addComponents(s)
        );
        return await i.showModal(modal);
    }

    if (i.isModalSubmit() && i.customId === 'm_rec') {
        const age = i.fields.getTextInputValue('age');
        const psn = i.fields.getTextInputValue('psn');
        const spe = i.fields.getTextInputValue('spe');

        const recLog = new EmbedBuilder()
            .setTitle('📥 NOUVELLE CANDIDATURE')
            .setColor('Gold')
            .addFields(
                { name: '👤 Survivant', value: `${i.user}`, inline: true },
                { name: '🎮 ID PSN', value: psn, inline: true },
                { name: '⏳ Heures', value: age, inline: true },
                { name: '🛡️ Profil', value: `\`\`\`${spe}\`\`\`` }
            ).setTimestamp();

        await i.reply({ content: "🫡 Ta candidature a été envoyée au haut commandement.", flags: MessageFlags.Ephemeral });
        const ch = i.guild.channels.cache.find(c => c.name.includes('recrutement') || c.name.includes('log'));
        if (ch) ch.send({ embeds: [recLog] });
    }
});

// --- SYSTÈME D'XP ET DE GRADE ---
client.on('messageCreate', m => {
    if (m.author.bot || !m.guild) return;
    let data = xpSystem.get(m.author.id) || { xp: 0, rank: 'Soldat' };
    data.xp += 1;
    if (data.xp > 50) data.rank = 'Caporal';
    if (data.xp > 200) data.rank = 'Sergent';
    if (data.xp > 500) data.rank = 'Lieutenant';
    xpSystem.set(m.author.id, data);
});

// --- LOGS MESSAGES SUPPRIMÉS ---
client.on('messageDelete', async m => {
    if (!logChannelId || m.author?.bot) return;
    const logChan = m.guild.channels.cache.get(logChannelId);
    if (logChan) {
        const delEmb = new EmbedBuilder()
            .setTitle('🗑️ MESSAGE SUPPRIMÉ')
            .setColor('#e74c3c')
            .addFields(
                { name: 'Auteur', value: `${m.author.tag}`, inline: true },
                { name: 'Salon', value: `${m.channel}`, inline: true },
                { name: 'Contenu', value: `\`\`\`${m.content || "Fichier/Embed"}\`\`\`` }
            );
        logChan.send({ embeds: [delEmb] });
    }
});

// --- ANTI-CRASH ---
process.on('unhandledRejection', (reason, promise) => {
    console.log('🛡️ ANTI-CRASH : Erreur détectée\n', reason);
});

client.login(process.env.BOT_TOKEN);
