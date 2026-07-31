
$ErrorActionPreference = "Stop"
$ReportDir = Join-Path $PSScriptRoot "report"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$ReportFile = Join-Path $ReportDir ("softpharm-discovery-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".txt")

function Write-Report($Text) {
    $Text | Tee-Object -FilePath $ReportFile -Append
}

Write-Report "SOFTPHARM READ-ONLY DISCOVERY REPORT"
Write-Report ("Generated: " + (Get-Date))
Write-Report ("Computer: " + $env:COMPUTERNAME)
Write-Report ""

Write-Report "=== SQL SERVER SERVICES ==="
$services = Get-Service | Where-Object {
    $_.Name -match "MSSQL|SQLSERVER|SQLAgent" -or $_.DisplayName -match "SQL Server"
} | Select-Object Name, DisplayName, Status
if ($services) {
    $services | Format-Table -AutoSize | Out-String | Write-Report
} else {
    Write-Report "No SQL Server services were found."
}

Write-Report "=== POSSIBLE LOCAL INSTANCES ==="
$instances = New-Object System.Collections.Generic.List[string]
$instances.Add("localhost")
$instances.Add(".")
$instances.Add("$env:COMPUTERNAME")

foreach ($svc in $services) {
    if ($svc.Name -match "^MSSQL\$(.+)$") {
        $instanceName = $Matches[1]
        $instances.Add("localhost\$instanceName")
        $instances.Add("$env:COMPUTERNAME\$instanceName")
    }
}
$instances = $instances | Select-Object -Unique
$instances | ForEach-Object { Write-Report $_ }

Write-Host ""
Write-Host "This tool is READ-ONLY. It does not change SoftPharm or SQL Server." -ForegroundColor Green
Write-Host "Trying local SQL Server instances with Windows authentication..." -ForegroundColor Cyan

Add-Type -AssemblyName System.Data

$connected = $false
$successfulServer = $null
$databaseList = @()

foreach ($server in $instances) {
    try {
        $connString = "Server=$server;Database=master;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=3"
        $conn = New-Object System.Data.SqlClient.SqlConnection $connString
        $conn.Open()
        Write-Report ""
        Write-Report ("CONNECTED TO: " + $server)
        $successfulServer = $server
        $connected = $true

        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases WHERE state_desc='ONLINE' ORDER BY name"
        $reader = $cmd.ExecuteReader()
        while ($reader.Read()) {
            $databaseList += $reader.GetString(0)
        }
        $reader.Close()
        $conn.Close()
        break
    } catch {
        Write-Report ("Could not connect to " + $server + ": " + $_.Exception.Message)
    }
}

if (-not $connected) {
    Write-Report ""
    Write-Report "Automatic connection failed."
    Write-Report "Ask the SoftPharm operator for the SQL Server/instance name, then run this tool again."
    Write-Host ""
    Write-Host "No local SQL connection was found automatically." -ForegroundColor Yellow
    Write-Host "The report was saved here:" -ForegroundColor Yellow
    Write-Host $ReportFile
    Read-Host "Press Enter to close"
    exit
}

Write-Report ""
Write-Report "=== DATABASES ==="
$databaseList | ForEach-Object { Write-Report $_ }

Write-Host ""
Write-Host "Connected to $successfulServer" -ForegroundColor Green
Write-Host "Databases found:" -ForegroundColor Cyan
for ($i=0; $i -lt $databaseList.Count; $i++) {
    Write-Host "[$i] $($databaseList[$i])"
}

$choice = Read-Host "Enter the number of the database that looks like SoftPharm"
if ($choice -notmatch '^\d+$' -or [int]$choice -ge $databaseList.Count) {
    Write-Report "No valid database selected."
    Write-Host "Invalid selection. Report saved to $ReportFile"
    Read-Host "Press Enter to close"
    exit
}

$dbName = $databaseList[[int]$choice]
Write-Report ""
Write-Report ("SELECTED DATABASE: " + $dbName)

$connString = "Server=$successfulServer;Database=$dbName;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=5"
$conn = New-Object System.Data.SqlClient.SqlConnection $connString
$conn.Open()

Write-Report ""
Write-Report "=== TABLES AND VIEWS ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_SCHEMA, TABLE_NAME
"@
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
$dt = New-Object System.Data.DataTable
[void]$adapter.Fill($dt)
$dt | Format-Table -AutoSize | Out-String | Write-Report

Write-Report ""
Write-Report "=== LIKELY PRODUCT TABLES ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT 
    c.TABLE_SCHEMA,
    c.TABLE_NAME,
    COUNT(*) AS MatchingColumns,
    STRING_AGG(c.COLUMN_NAME, ', ') WITHIN GROUP (ORDER BY c.COLUMN_NAME) AS MatchingColumnNames
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE LOWER(c.COLUMN_NAME) LIKE '%barcode%'
   OR LOWER(c.COLUMN_NAME) LIKE '%price%'
   OR LOWER(c.COLUMN_NAME) LIKE '%stock%'
   OR LOWER(c.COLUMN_NAME) LIKE '%quantity%'
   OR LOWER(c.COLUMN_NAME) LIKE '%category%'
   OR LOWER(c.COLUMN_NAME) LIKE '%family%'
   OR LOWER(c.COLUMN_NAME) LIKE '%expiry%'
   OR LOWER(c.COLUMN_NAME) LIKE '%product%'
   OR LOWER(c.COLUMN_NAME) LIKE '%item%'
   OR LOWER(c.COLUMN_NAME) LIKE '%designation%'
   OR LOWER(c.COLUMN_NAME) LIKE '%description%'
GROUP BY c.TABLE_SCHEMA, c.TABLE_NAME
HAVING COUNT(*) >= 2
ORDER BY MatchingColumns DESC, c.TABLE_NAME
"@
try {
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
    $likely = New-Object System.Data.DataTable
    [void]$adapter.Fill($likely)
    $likely | Format-Table -AutoSize | Out-String | Write-Report
} catch {
    # STRING_AGG may not exist on older SQL Server versions.
    $cmd.CommandText = @"
SELECT c.TABLE_SCHEMA, c.TABLE_NAME, COUNT(*) AS MatchingColumns
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE LOWER(c.COLUMN_NAME) LIKE '%barcode%'
   OR LOWER(c.COLUMN_NAME) LIKE '%price%'
   OR LOWER(c.COLUMN_NAME) LIKE '%stock%'
   OR LOWER(c.COLUMN_NAME) LIKE '%quantity%'
   OR LOWER(c.COLUMN_NAME) LIKE '%category%'
   OR LOWER(c.COLUMN_NAME) LIKE '%family%'
   OR LOWER(c.COLUMN_NAME) LIKE '%expiry%'
   OR LOWER(c.COLUMN_NAME) LIKE '%product%'
   OR LOWER(c.COLUMN_NAME) LIKE '%item%'
   OR LOWER(c.COLUMN_NAME) LIKE '%designation%'
   OR LOWER(c.COLUMN_NAME) LIKE '%description%'
GROUP BY c.TABLE_SCHEMA, c.TABLE_NAME
HAVING COUNT(*) >= 2
ORDER BY MatchingColumns DESC, c.TABLE_NAME
"@
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
    $likely = New-Object System.Data.DataTable
    [void]$adapter.Fill($likely)
    $likely | Format-Table -AutoSize | Out-String | Write-Report
}

Write-Report ""
Write-Report "=== ALL COLUMNS ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
"@
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
$cols = New-Object System.Data.DataTable
[void]$adapter.Fill($cols)
$cols | Format-Table -AutoSize | Out-String | Write-Report

$conn.Close()

Write-Report ""
Write-Report "DISCOVERY FINISHED. No data was changed."
Write-Host ""
Write-Host "Discovery finished successfully." -ForegroundColor Green
Write-Host "Send this report file back to the developer:" -ForegroundColor Cyan
Write-Host $ReportFile
Read-Host "Press Enter to close"
