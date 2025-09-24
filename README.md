# MySQL WebCLI

**Mysql WebCLI** is a web-based command-line interface for MySQL databases. It lets you run SQL queries from a web browser, giving you a terminal-like experience without needing a native desktop client.

## Features

  * **Execute SQL Queries**: Run queries directly from your browser.
  * **View Results**: See query results displayed in a clean, tabular format.
  * **Command History**: Use the arrow keys to navigate through your past commands.
  * **Lightweight**: A single PHP file with no external dependencies.
  * **Secure**: All database interactions happen on the server-side.

-----

## Deployment Guide

### Prerequisites

  * A web server with PHP (e.g., Apache, Nginx).
  * Access to a MySQL database.
  * **Composer** for managing PHP dependencies.
  * A common setup like **XAMPP**, **WAMP**, or **MAMP** works perfectly.

### Installation

1.  **Download the project files.**
2.  Place the `mysqlwebcli` folder inside your web server's root directory (e.g., `/xampp/htdocs/`).
3.  **Configure Database Connection**:
      * Create a new file named `.env` in the root of your project.
      * Add your database credentials to this file in the following format:
    <!-- end list -->
    ```plaintext
    DB_SERVERNAME="localhost"
    DB_USERNAME="your_username"
    DB_PASSWORD="your_password"
    DB_NAME="your_database"
    ```
      * **Note**: **Do not** commit this `.env` file to your Git repository.

-----

## How to Use

1.  Start your web server (e.g., start Apache and MySQL in XAMPP).
2.  Open your web browser and navigate to `http://localhost/mysqlwebcli`.
3.  You'll see a command prompt interface.
4.  Type your SQL queries and press `Enter` to execute them.
5.  The results will be displayed directly below the input line.

-----

## Available Commands

  * `help | h | hlp`: Show this help guide.
  * `mysql`: Start a MySQL session.
  * `exit`: Exit the current MySQL session.
  * `sysconfig`: View the contents of the .env file. (Read-only)

### MySQL Session Commands

  * `start [db_name]`: Select a database to work with.
  * `close | close mydb`: Close the current database connection.
  * `drop [db_name] | del [db_name]`: Permanently delete a database.
  * `drop [tbl_name] | delete [tbl_name]`: Permanently delete a table.
  * `list mydb | ls mydb`: List all databases and their sizes.
  * `list table | ls table`: List all tables in the current database.
  * `q <- [SQL query]`: Execute an SQL query and display results in a table.
  * `json<-q<- [SQL query]`: Execute an SQL query and display results in JSON format.
  * `upload sql`: Upload and execute a .sql file.
  * `bkp [db_name] | backup [db_name]`: Create and download a backup of a database.

**Note**: Commands are case-insensitive.

-----

## For Support and Feedback

  * **Visit**: [https://iquipedigital.com](https://iquipedigital.com)
  * **Email**: support@iquipedigital.com
  * **GitHub**: [https://github.com/iquipe/mysqlwebcli](https://github.com/iquipe/mysqlwebcli)
  * **License**: MIT License