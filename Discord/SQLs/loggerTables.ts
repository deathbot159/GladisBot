export default [
    `CREATE TABLE IF NOT EXISTS channel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type text,
        channelId INTEGER,
        channelName text,
        executorId INTEGER,
        executorTag text,
        additionalInfo text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS guildban (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type text,
        bannedId INTEGER,
        bannedTag text,
        executorId INTEGER,
        executorTag text,
        reason text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS messagecreate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId INTEGER,
        channelId INTEGER,
        channelName text,
        authorId text,
        authorTag text,
        messageContent text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS messagedelete (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId INTEGER,
        channelId INTEGER,
        channelName text,
        authorId text,
        authorTag text,
        messageContent text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS messageupdate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId INTEGER,
        channelId INTEGER,
        channelName text,
        authorId text,
        authorTag text,
        oldMessageContent text,
        newMessageContent text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS role (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type text,
        roleId INTEGER,
        executorId INTEGER,
        executorTag text,
        additionalInfo text,
        timestamp INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS thread (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type text,
        threadId INTEGER,
        executorId INTEGER,
        executorTag text,
        additionalInfo text,
        timestamp INTEGER
    )`
];