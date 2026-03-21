const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionFlagsBits, ChannelType, MessageFlags 
} = require('discord.js');
const express = require('express');

// --- SERVEUR WEB (ANTI-DODO RENDER) ---
const app = express();
app.get('/', (req, res) => res.send('ZTS OVERLORD V10 : PRÉCISION MAXIMALE'));
app.listen(process.env.PORT || 10000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- VARIABLES DE STOCKAGE ---
let logChannelId = null;
let dispatchChannelId = null;
const shoppingList = new Map();
const blacklist = new Map();

// --- INITIALISATION ---
client.once('ready', async () => {
    console.log(`\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n🛡️ ZTS OVERLORD V10 DÉPLOYÉ : ${client.user.tag}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`);
    
    const commands = [
        // --- SYSTÈME DE POSITION PRÉCIS ---
        {
            name: 'position',
            description: '📍 Signalement tactique (Format Team)',
            options: [
                { name: 'etat', type: 3, description: 'Action', required: true, choices: [{name:'📥 Connexion', value:'spawn'}, {name:'📤 Déconnexion', value:'despawn'}] },
                { name: 'lieu', type: 3, description: 'Nom du lieu (ex: Base pby)', required: true },
                { name: 'map', type: 3, description: 'La Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code serv (4 car. ex: 9273)', required: true },
                { name: 'longueur', type: 3, description: 'X (ex: 057)', required: true },
                { name: 'hauteur', type: 3, description: 'Y (ex: 018)', required: true }
            ]
        },
        {
            name: 'mort',
            description: '💀 Signaler un décès (Format Team)',
            options: [
                { name: 'map', type: 3, description: 'La Map', required: true, choices: [{name:'Chernarus', value:'Chernarus'}, {name:'Sakhal', value:'Sakhal'}, {name:'Livonia', value:'Livonia'}] },
                { name: 'serveur', type: 3, description: 'Code serv', required: true },
                { name: 'longueur', type: 3, description: 'X', required: true },
                { name: 'hauteur', type: 3, description: 'Y', required: true }
            ]
        },
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
            name: 'blacklist',
            description: '🚫 Ficher un ennemi PSN',
            options: [
                { name: 'psn', type: 3, description: 'ID PSN de l\'ennemi', required: true },
                { name: 'raison', type: 3, description: 'Motif du fichage', required: true }
            ]
        },
        // --- ADMIN & CONFIG ---
        { name: 'raid', description: '🚨 ALERTE RAID IMMÉDIAT', options: [{name:'lieu', type:3, description:'Lieu', required:true}] },
        { name: 'set-logs', description: '⚙️ Config logs admin', options: [{name:'salon', type:7, required:true}] },
        { name: 'set-dispatch', description: '🛰️ Config salon traçage', options: [{name:'salon', type:7, required:true}] },
        { name: 'setup-recrutement', description: '👑 Interface recrutement' },
        { name: 'clear', description: '🧹 Nettoyer le chat', options: [{name:'nombre', type:4, required:true}] }
    ];

    try {
        await client.application.commands.set(commands);
        console.log("💎 Interface Tactique ZTS V10 Synchronisée.");
    } catch (e) { console.error(e); }
});

// --- INTERACTIONS ---
client.on('interactionCreate', async i => {
    if (!i.isChatInputCommand()) return;

    // 1. SYSTÈME DE POSITION FORMATÉ
    if (i.commandName === 'position') {
        const et = i.options.getString('etat');
        const lieu = i.options.getString('lieu');
        const map = i.options.getString('map');
        const srv = i.options.getString('serveur').substring(0, 4).toUpperCase();
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        if (!dispatchChannelId) return i.reply({ content: "⚠️ Dispatch non configuré.", flags: MessageFlags.Ephemeral });

        const isSpawn = et === 'spawn';
        const template = `(${lieu}) sur le serveur **${map}** (${srv}), les coordonnées sont : longueur=(**${x}**) ; hauteur=(**${y}**).`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `ZTS UNIT : ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
            .setTitle(isSpawn ? '📥 LOG-IN : ENTRÉE EN ZONE' : '📤 LOG-OUT : SORTIE DE ZONE')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n${template}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor(isSpawn ? '#2ecc71' : '#e67e22')
            .setFooter({ text: 'Système de traçage ZTS' })
            .setTimestamp();

        const ch = i.guild.channels.cache.get(dispatchChannelId);
        if (ch) ch.send({ embeds: [embed] });
        return i.reply({ content: `✅ Position enregistrée dans <#${dispatchChannelId}>.`, flags: MessageFlags.Ephemeral });
    }

    // 2. SIGNALEMENT MORT
    if (i.commandName === 'mort') {
        const map = i.options.getString('map');
        const srv = i.options.getString('serveur').substring(0, 4).toUpperCase();
        const x = i.options.getString('longueur');
        const y = i.options.getString('hauteur');

        const deathEmb = new EmbedBuilder()
            .setTitle('💀 SURVIVANT À TERRE (K.I.A)')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**${i.user.username}** est mort sur **${map}** (${srv}).\nCoordonnées du corps : longueur=(**${x}**) ; hauteur=(**${y}**).\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#000000')
            .setTimestamp();

        return i.reply({ content: '@everyone ⚠️ **PERTE HUMAINE, BESOIN DE BACKUP !**', embeds: [deathEmb] });
    }

    // 3. RAID ALERT
    if (i.commandName === 'raid') {
        const lieu = i.options.getString('lieu');
        const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE RAID : ZTS UNIT 🚨')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n**CIBLE :** ${lieu}\n**STATUT :** MOBILISATION @everyone\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#ff0000')
            .setImage('https://i.imgur.com/8N7mZ6m.png'); // Si l'image bug encore, retire cette ligne
        return i.reply({ content: '⚔️ **MOBILISATION IMMÉDIATE !**', embeds: [embed] });
    }

    // 4. LOGISTIQUE
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
            .setTitle('📋 INVENTAIRE DES BESOINS ZTS')
            .setColor('#3498db')
            .setDescription(content || "La base est full (aucun besoin).")
            .setFooter({ text: 'ZTS Logistics' });
        return i.reply({ embeds: [embed] });
    }

    // 5. BLACKLIST
    if (i.commandName === 'blacklist') {
        const psn = i.options.getString('psn');
        const raison = i.options.getString('raison');
        const blEmb = new EmbedBuilder()
            .setTitle('🚫 FICHE ENNEMI : BLACKLIST')
            .addFields({ name: 'ID PSN', value: `\`${psn}\``, inline: true }, { name: 'Raison', value: raison })
            .setColor('#2b2d31')
            .setTimestamp();
        return i.reply({ embeds: [blEmb] });
    }

    // 6. CONFIGURATION
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

    // 7. RECRUTEMENT
    if (i.commandName === 'setup-recrutement') {
        const embed = new EmbedBuilder()
            .setTitle('👑 RECRUTEMENT UNITÉ ZTS')
            .setDescription(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nPostulez pour rejoindre l'escouade.\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
            .setColor('#000000');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('rec_btn').setLabel('Postuler').setStyle(ButtonStyle.Danger));
        return i.reply({ embeds: [embed], components: [row] });
    }

    // 8. CLEAR
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('nombre');
        await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 \`${amount}\` messages supprimés.`, flags: MessageFlags.Ephemeral });
    }
});

// --- BOUTONS & MODALS ---
client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'rec_btn') {
        const modal = new ModalBuilder().setCustomId('m_rec').setTitle('Dossier Recrue ZTS');
        const a = new TextInputBuilder().setCustomId('a').setLabel("Heures DayZ").setStyle(TextInputStyle.Short).setRequired(true);
        const p = new TextInputBuilder().setCustomId('p').setLabel("ID PSN").setStyle(TextInputStyle.Short).setRequired(true);
        const s = new TextInputBuilder().setCustomId('s').setLabel("Spécialité").setStyle(TextInputStyle.Paragraph).setRequired(true);
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
            .addFields({name:'Survivant', value:`${i.user}`, inline:true}, {name:'PSN', value:psn, inline:true}, {name:'Exp', value:age, inline:true}, {name:'Profil', value: `\`\`\`${spe}\`\`\``})
            .setTimestamp();
        await i.reply({ content: "Dossier envoyé au staff ZTS.", flags: MessageFlags.Ephemeral });
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
            .setTitle('🗑️ MESSAGE SUPPRIMÉ')
            .setColor('#e74c3c')
            .addFields({name:'Auteur', value:`${m.author}`, inline:true}, {name:'Salon', value:`${m.channel}`, inline:true}, {name:'Contenu', value:`\`\`\`${m.content || "Fichier"}\`\`\``});
        ch.send({ embeds: [emb] });
    }
});

// --- ANTI-CRASH ---
process.on('unhandledRejection', (r) => console.log('🛡️ ANTI-CRASH :', r));

client.login(process.env.BOT_TOKEN);
