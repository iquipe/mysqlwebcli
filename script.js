document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('command-input');
    const outputDiv = document.getElementById('output');
    const promptElement = document.getElementById('cli-prompt');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal');
    const sqlFileInput = document.getElementById('sql-file-input');

    let currentPrompt = '$';
    let currentDB = '';

    commandInput.focus();

    const updatePrompt = () => {
        if (currentDB) {
            promptElement.textContent = `mysql>${currentDB}>`;
        } else if (currentPrompt === '$msql>') {
            promptElement.textContent = `$msql>`;
        } else {
            promptElement.textContent = `$`;
        }
    };

    const helpGuide = `
Available Commands:

- help | h | hlp    : Show this help guide.
- mysql             : Start a MySQL session.
- exit              : Exit the current MySQL session.
- sysconfig         : View the contents of the .env file. (Read-only)

--- MySQL Session Commands ---

- start [db_name]   : Select a database to work with.
- close | close mydb : Close the current database connection.
- drop [db_name] | del [db_name] : Permanently delete a database.
- drop [tbl_name] | delete [tbl_name] : Permanently delete a table.
- list mydb | ls mydb : List all databases and their sizes.
- list table | ls table : List all tables in the current database.
- q <- [SQL query]  : Execute an SQL query and display results in a table.
- json<-q<- [SQL query]: Execute an SQL query and display results in JSON format.
- upload sql        : Upload and execute a .sql file.
- bkp [db_name] | backup [db_name] : Create and download a backup of a database.

Note: Commands are case-insensitive.

--- For Support and Feedback ---
- Visit: https://iquipedigital.com
- Email: support@iquipedigital.com
- GitHub: https://github.com/iquipe/mysqlwebcli
- License: MIT License
`;

    const executeCommand = async () => {
        const fullCommand = commandInput.value.trim();
        if (fullCommand === '') {
            return;
        }

        outputDiv.innerHTML += `\n<pre>${promptElement.textContent} ${fullCommand}</pre>`;

        const lowerCaseCommand = fullCommand.toLowerCase();
        let commandToSend = '';
        let endpoint = 'execute.php';
        let isBackupCommand = false;

        const startRegex = /^start\s+(\S+)$/i;
        const backupRegex = /^(bkp|backup)\s+(\S+)$/i;
        const jsonQueryRegex = /^json<-q<-\s*(.+)$/i;
        const sqlQueryRegex = /^q\s*<-\s*(.+)$/i;
        const dropDbRegex = /^(drop|delete|del)\s+(database|db)?\s*(\S+)$/i;
        const dropTableRegex = /^(drop|delete)\s+(\S+)$/i;

        const startMatch = lowerCaseCommand.match(startRegex);
        const backupMatch = lowerCaseCommand.match(backupRegex);
        const jsonMatch = fullCommand.match(jsonQueryRegex);
        const sqlMatch = fullCommand.match(sqlQueryRegex);
        const dropDbMatch = lowerCaseCommand.match(dropDbRegex);
        const dropTableMatch = lowerCaseCommand.match(dropTableRegex);

        if (lowerCaseCommand === 'help' || lowerCaseCommand === 'h' || lowerCaseCommand === 'hlp') {
            outputDiv.innerHTML += `<pre>${helpGuide}</pre>`;
        } else if (lowerCaseCommand === 'sysconfig') {
            try {
                const response = await fetch('get_env.php');
                const envContent = await response.text();
                modalContent.textContent = envContent;
                modal.style.display = 'block';
            } catch (error) {
                outputDiv.innerHTML += `<pre style="color: red;">Error: Could not retrieve .env file content.</pre>`;
            }
        } else if (backupMatch) {
            const dbName = backupMatch[2];
            endpoint = 'backup.php';
            commandToSend = dbName;
            isBackupCommand = true;
            outputDiv.innerHTML += `<pre>Starting backup of database '${dbName}'...</pre>`;
        } else if (lowerCaseCommand === 'mysql') {
            currentPrompt = '$msql>';
            outputDiv.innerHTML += `<pre>MySQL session started. Type 'start [database name]' to select a database.</pre>`;
        } else if (startMatch) {
            const dbName = startMatch[1];
            currentDB = dbName;
            currentPrompt = '$msql>';
            outputDiv.innerHTML += `<pre>Database changed to '${dbName}'.</pre>`;
        } else if (lowerCaseCommand === 'exit') {
            currentPrompt = '$';
            currentDB = '';
            outputDiv.innerHTML += `<pre>MySQL session terminated.</pre>`;
        } else if (lowerCaseCommand === 'close' || lowerCaseCommand === 'close mydb') {
            if (currentDB) {
                outputDiv.innerHTML += `<pre>Closed database '${currentDB}'.</pre>`;
                currentDB = '';
            } else {
                outputDiv.innerHTML += `<pre>No database is currently open.</pre>`;
            }
        } else if (lowerCaseCommand === 'list mydb' || lowerCaseCommand === 'ls mydb') {
            commandToSend = 'SPECIAL_COMMAND_LIST_DB';
        } else if (lowerCaseCommand.match(/^(list|ls)\s+(table|tbl)$/)) {
            if (currentDB) {
                commandToSend = 'SPECIAL_COMMAND_LIST_TABLES';
            } else {
                outputDiv.innerHTML += `<pre style="color: red;">No database selected. Use 'start [database name]' first.</pre>`;
            }
        } else if (lowerCaseCommand === 'upload sql') {
            sqlFileInput.click();
            outputDiv.innerHTML += `<pre>Please select a .sql file to upload...</pre>`;
        } else if (dropDbMatch) {
            const dbName = dropDbMatch[3];
            if (confirm(`WARNING: This will permanently delete the database '${dbName}'. Are you sure?`)) {
                endpoint = 'execute.php';
                commandToSend = `DROP DATABASE \`${dbName}\``;
                outputDiv.innerHTML += `<pre>Dropping database '${dbName}'...</pre>`;
                if (currentDB === dbName) {
                    currentDB = '';
                }
            } else {
                outputDiv.innerHTML += `<pre>Deletion canceled.</pre>`;
            }
        } else if (dropTableMatch && currentPrompt.startsWith('$msql>') && currentDB) {
            const tableName = dropTableMatch[2];
            if (confirm(`WARNING: This will permanently delete the table '${tableName}' from database '${currentDB}'. Are you sure?`)) {
                endpoint = 'execute.php';
                commandToSend = `DROP TABLE \`${tableName}\``;
                outputDiv.innerHTML += `<pre>Dropping table '${tableName}'...</pre>`;
            } else {
                outputDiv.innerHTML += `<pre>Deletion canceled.</pre>`;
            }
        } else if (currentPrompt.startsWith('$msql>') && jsonMatch) {
            commandToSend = jsonMatch[1].trim();
            endpoint = 'execute_json.php';
        } else if (currentPrompt.startsWith('$msql>') && sqlMatch) {
            commandToSend = sqlMatch[1].trim();
            endpoint = 'execute.php';
        } else {
            outputDiv.innerHTML += `<pre style="color: red;">Command not found. Type 'help' to see available commands.</pre>`;
        }

        updatePrompt();

        if (commandToSend) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `command=${encodeURIComponent(commandToSend)}&db=${encodeURIComponent(currentDB)}`
                });

                if (isBackupCommand) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `backup_${commandToSend}.sql`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    outputDiv.innerHTML += `<pre>Backup file downloaded.</pre>`;
                } else if (endpoint === 'execute_json.php') {
                    const result = await response.json();
                    outputDiv.innerHTML += `<pre>${JSON.stringify(result, null, 2)}</pre>`;
                } else {
                    const result = await response.text();
                    outputDiv.innerHTML += `<pre>${result}</pre>`;
                }
            } catch (error) {
                outputDiv.innerHTML += `<pre style="color: red;">Error: Could not connect to the server or invalid response.</pre>`;
            }
        }

        commandInput.value = '';
        outputDiv.scrollTop = outputDiv.scrollHeight;
    };

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand();
        }
    });

    sqlFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            outputDiv.innerHTML += `<pre style="color: red;">No file selected.</pre>`;
            return;
        }

        const formData = new FormData();
        formData.append('sql_file', file);
        formData.append('db', currentDB);

        outputDiv.innerHTML += `<pre>Uploading and executing '${file.name}'...</pre>`;
        outputDiv.scrollTop = outputDiv.scrollHeight;

        try {
            const response = await fetch('upload_sql.php', {
                method: 'POST',
                body: formData,
            });

            const result = await response.text();
            outputDiv.innerHTML += `<pre>${result}</pre>`;
        } catch (error) {
            outputDiv.innerHTML += `<pre style="color: red;">Error during file upload and execution.</pre>`;
        }

        sqlFileInput.value = '';
        commandInput.focus();
        outputDiv.scrollTop = outputDiv.scrollHeight;
    });

    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            modal.style.display = 'none';
            commandInput.focus();
        };
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                commandInput.focus();
            }
        };
    }
});