<?php

header('Content-Type: text/plain');

// Include the Composer autoloader to load the dotenv library
require __DIR__ . '/vendor/autoload.php';

// Load environment variables from the .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database credentials from environment variables
$servername = $_ENV['DB_SERVERNAME'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

// Establish connection without a database name initially
$conn = new mysqli($servername, $username, $password); 

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get the command and the current database name from the POST request
$command = $_POST['command'] ?? '';
$currentDB = $_POST['db'] ?? '';

// If a database is provided by the client, select it for this session.
// This is crucial to fix the "No database selected" error.
if ($currentDB) {
    if (!$conn->select_db($currentDB)) {
        echo "Error: The database '{$currentDB}' does not exist or you don't have access. Please check the name and try again.";
        $conn->close();
        exit();
    }
}

$output = "";

// Check for the special command to list databases
if ($command === 'SPECIAL_COMMAND_LIST_DB') {
    $sql = "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema ORDER BY table_schema;";
    
    $result = $conn->query($sql);

    if ($result) {
        if ($result->num_rows > 0) {
            $table_data = [];
            $row = $result->fetch_assoc();
            $headers = array_keys($row);
            array_unshift($table_data, $headers);
            $table_data[] = array_values($row);
            while ($row = $result->fetch_assoc()) {
                $table_data[] = array_values($row);
            }
            $output = format_table($table_data);
        } else {
            $output = "No databases found.";
        }
    } else {
        $output = "Error executing query: " . $conn->error;
    }
} else if ($command === 'SPECIAL_COMMAND_LIST_TABLES') {
    // Logic for listing tables, sizes, and row counts in the current database
    if ($currentDB) {
        $sql = "
            SELECT 
                TABLE_NAME AS `Table`,
                TABLE_ROWS AS `Rows`,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS `Size (MB)`
            FROM 
                information_schema.tables 
            WHERE 
                table_schema = ?
            ORDER BY 
                TABLE_NAME;
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $currentDB);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result) {
            if ($result->num_rows > 0) {
                $table_data = [];
                $row = $result->fetch_assoc();
                $headers = array_keys($row);
                array_unshift($table_data, $headers);
                $table_data[] = array_values($row);
                while ($row = $result->fetch_assoc()) {
                    $table_data[] = array_values($row);
                }
                $output = format_table($table_data);
            } else {
                $output = "No tables found in database '{$currentDB}'.";
            }
        } else {
            $output = "Error executing query: " . $stmt->error;
        }
    } else {
        $output = "Error: No database selected.";
    }
} else {
    // Logic for handling other commands
    $command_lower = strtolower(trim($command));
    $command_parts = explode(' ', $command_lower, 2);
    $first_word = $command_parts[0];
    
    // Explicitly allow DROP DATABASE and DROP TABLE
    if ($first_word === 'drop') {
        $command_parts_full = explode(' ', $command_lower);
        $second_word = $command_parts_full[1] ?? '';
        
        if ($second_word === 'database' || $second_word === 'db') {
            $result = $conn->query($command);
            if ($result) {
                $output = "Database dropped successfully.";
            } else {
                $output = "Error dropping database: " . $conn->error;
            }
        } else if ($second_word === 'table' || $second_word === '') {
            $result = $conn->query($command);
            if ($result) {
                $output = "Table dropped successfully.";
            } else {
                $output = "Error dropping table: " . $conn->error;
            }
        } else {
            $output = "Error: Invalid DROP command. Use 'DROP DATABASE' or 'DROP TABLE'.";
        }
    } else {
        $allowed_commands = ['select', 'show', 'describe', 'desc'];
        if (in_array($first_word, $allowed_commands)) {
            $result = $conn->query($command);
            if ($result) {
                if ($result instanceof mysqli_result) {
                    if ($result->num_rows > 0) {
                        $table_data = [];
                        $row = $result->fetch_assoc();
                        $headers = array_keys($row);
                        array_unshift($table_data, $headers);
                        $table_data[] = array_values($row);
                        while ($row = $result->fetch_assoc()) {
                            $table_data[] = array_values($row);
                        }
                        $output = format_table($table_data);
                    } else {
                        $output = "Query executed successfully, but no results were returned.";
                    }
                } else {
                    $output = "Query executed successfully. " . $conn->affected_rows . " row(s) affected.";
                }
            } else {
                $output = "Error: " . $conn->error;
            }
        } else {
            $output = "Error: Command not allowed. Type 'help' to see allowed commands.";
        }
    }
}

$conn->close();

echo $output;

// Function to format the result into a simple text-based table
function format_table($data) {
    if (empty($data)) {
        return "No data to display.";
    }

    $column_widths = array_fill(0, count($data[0]), 0);
    foreach ($data as $row) {
        foreach ($row as $col_index => $cell) {
            $column_widths[$col_index] = max($column_widths[$col_index], strlen((string)$cell));
        }
    }

    $output = "";
    $header = array_shift($data);
    
    // Header row
    foreach ($header as $col_index => $cell) {
        $output .= str_pad($cell, $column_widths[$col_index]) . " | ";
    }
    $output .= "\n";

    // Separator line
    foreach ($column_widths as $width) {
        $output .= str_repeat('-', $width) . "-+-";
    }
    $output = rtrim($output, "-+-") . "\n";

    // Data rows
    foreach ($data as $row) {
        foreach ($row as $col_index => $cell) {
            $output .= str_pad((string)$cell, $column_widths[$col_index]) . " | ";
        }
        $output .= "\n";
    }

    return $output;
}
?>