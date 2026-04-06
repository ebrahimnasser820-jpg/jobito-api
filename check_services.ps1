$services = @(
    @{ Name = "Backend"; Port = 3000 },
    @{ Name = "MongoDB"; Port = 27017 },
    @{ Name = "PostgreSQL"; Port = 5432 }
)

Write-Host "--- Jobito Service Diagnostic ---" -ForegroundColor Cyan
foreach ($svc in $services) {
    $check = Test-NetConnection -ComputerName localhost -Port $svc.Port -WarningAction SilentlyContinue
    if ($check.TcpTestSucceeded) {
        Write-Host "[OK] $($svc.Name) is running on port $($svc.Port)" -ForegroundColor Green
    } else {
        Write-Host "[!!] $($svc.Name) is DOWN on port $($svc.Port)" -ForegroundColor Red
    }
}
Write-Host "----------------------------------"
Write-Host "If Backend is DOWN, run: npm run start:dev inside jobito-api"
Write-Host "If databases are DOWN, start your Mongo/Postgres services."
