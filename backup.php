<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Read credentials from .env file
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];
$servername = $_ENV['DB_SERVERNAME'];
$database = $_POST['command'] ?? '';

if (empty($database)) {
    header('Content-Type: text/plain');
    die("Error: Please provide a database name to backup.");
}

// Sanitize the database name
if (!preg_match('/^[a-zA-Z0-9_]+$/', $database)) {
    header('Content-Type: text/plain');
    die("Error: Invalid database name.");
}

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $database);
if ($conn->connect_error) {
    header('Content-Type: text/plain');
    die("Connection failed: " . $conn->connect_error);
}

// Start output buffering
ob_start();

// Get all tables
$tablesResult = $conn->query("SHOW TABLES");
if ($tablesResult) {
    while ($row = $tablesResult->fetch_array()) {
        $table = $row[0];

        // Get CREATE TABLE statement
        $createResult = $conn->query("SHOW CREATE TABLE `" . $conn->real_escape_string($table) . "`");
        if ($createResult) {
            $createRow = $createResult->fetch_assoc();
            echo "-- Table structure for `" . $table . "`\n";
            echo "DROP TABLE IF EXISTS `" . $table . "`;\n"; // Added DROP TABLE for cleaner backups
            echo $createRow['Create Table'] . ";\n\n";
        }

        // Get all records
        $dataResult = $conn->query("SELECT * FROM `" . $conn->real_escape_string($table) . "`");
        if ($dataResult) {
            while ($dataRow = $dataResult->fetch_assoc()) {
                $columns = array_map(fn($col) => "`" . $conn->real_escape_string($col) . "`", array_keys($dataRow));
                $values = array_map(fn($val) => "'" . $conn->real_escape_string($val) . "'", array_values($dataRow));
                echo "INSERT INTO `" . $table . "` (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $values) . ");\n";
            }
            echo "\n";
        }
    }
} else {
    header('Content-Type: text/plain');
    die("Error: Failed to retrieve tables from the database.");
}

$conn->close();

// Set headers to trigger a download
$filename = "backup_{$database}_" . date('Y-m-d') . ".sql";
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . ob_get_length());

// Flush buffer to browser
ob_end_flush();
exit;

?>