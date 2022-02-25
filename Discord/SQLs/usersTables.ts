export default [
    `CREATE TABLE IF NOT EXISTS warn (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        executorId text,
        executorTag text,
        warnedId text,
        warnedTag text,
        reason text,
        timestamp INTEGER
    )`
];