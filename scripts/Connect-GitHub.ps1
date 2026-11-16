[CmdletBinding()]
param([switch]$Check)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$repository = 'Eeelyyy/Eeelyyy.github.io'
$credentialPath = "$repository.git"
$expectedRemote = "https://github.com/$credentialPath"
$tokenValue = $null
$credentialResult = $null
$headers = $null

function Invoke-CredentialHelper {
    param([string]$Action, [string]$Payload)
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = 'git'
    $startInfo.WorkingDirectory = $repoRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.ArgumentList.Add('credential-manager')
    $startInfo.ArgumentList.Add($Action)
    $startInfo.Environment['GCM_INTERACTIVE'] = 'never'
    $startInfo.Environment['GCM_CREDENTIAL_STORE'] = 'wincredman'
    $helperProcess = [System.Diagnostics.Process]::Start($startInfo)
    $outTask = $helperProcess.StandardOutput.ReadToEndAsync()
    $errTask = $helperProcess.StandardError.ReadToEndAsync()
    $helperProcess.StandardInput.Write($Payload)
    $helperProcess.StandardInput.Close()
    $helperProcess.WaitForExit()
    $result = $outTask.GetAwaiter().GetResult()
    $null = $errTask.GetAwaiter().GetResult()
    $exitCode = $helperProcess.ExitCode
    $helperProcess.Dispose()
    if ($exitCode -ne 0) { throw "Credential Manager failed (exit $exitCode). No credentials were printed." }
    return $result
}

try {
    if (-not $IsWindows) { throw 'This helper uses Windows Credential Manager. Configure an OS credential helper on other systems.' }
    $actualRemote = (& git -C $repoRoot remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0 -or $actualRemote -ne $expectedRemote) {
        throw 'Origin does not match the intended homepage repository. No credential was requested.'
    }
    $credentialIdentity = "protocol=https`nhost=github.com`npath=$credentialPath`nusername=Eeelyyy`n"
    if ($Check) {
        $credentialResult = Invoke-CredentialHelper -Action 'get' -Payload "$credentialIdentity`n"
        $passwordLine = $credentialResult -split "`n" | Where-Object { $_.StartsWith('password=') } | Select-Object -First 1
        if (-not $passwordLine) { throw 'No saved repository credential was found. Run this script interactively to configure one.' }
        $tokenValue = $passwordLine.Substring(9).TrimEnd("`r")
    } else {
        $secureToken = Read-Host 'GitHub token (hidden input)' -AsSecureString
        $tokenValue = [System.Net.NetworkCredential]::new('', $secureToken).Password
        if ([string]::IsNullOrWhiteSpace($tokenValue) -or $tokenValue -match '[\r\n]') { throw 'Invalid token input.' }
    }
    $headers = @{ Authorization = "Bearer $tokenValue"; 'User-Agent' = 'Yishen-Homepage-Workspace'; Accept = 'application/vnd.github+json' }
    $account = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
    $repoInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$repository" -Headers $headers -TimeoutSec 30
    if ($account.login -ne 'Eeelyyy' -or -not $repoInfo.permissions.push) {
        throw 'The credential does not identify Eeelyyy with write access to this repository.'
    }
    if (-not $Check) {
        & git -C $repoRoot config --local 'credential.https://github.com.useHttpPath' true
        if ($LASTEXITCODE -ne 0) { throw 'Could not configure repository credential matching.' }
        & git -C $repoRoot config --local credential.credentialStore wincredman
        if ($LASTEXITCODE -ne 0) { throw 'Could not configure the OS credential store.' }
        $null = Invoke-CredentialHelper -Action 'store' -Payload "${credentialIdentity}password=$tokenValue`n`n"
    }
    $pages = $null
    $pagesError = $null
    try {
        $pagesInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$repository/pages" -Headers $headers -TimeoutSec 30
        $pages = [ordered]@{
            url = $pagesInfo.html_url
            buildType = $pagesInfo.build_type
            status = $pagesInfo.status
            sourceBranch = $pagesInfo.source.branch
            sourcePath = $pagesInfo.source.path
            customDomain = $pagesInfo.cname
        }
    } catch {
        $pagesError = if ($_.Exception.Response) { "HTTP $([int]$_.Exception.Response.StatusCode)" } else { 'Network request failed' }
    }
    $report = [ordered]@{
        checkedAt = [DateTime]::UtcNow.ToString('o')
        repository = $repository
        login = $account.login
        pushAccess = [bool]$repoInfo.permissions.push
        credentialStore = 'Windows Credential Manager (Git Credential Manager)'
        pages = $pages
        pagesReadError = $pagesError
    }
    $privateDirectory = Join-Path $repoRoot 'private'
    $null = New-Item -ItemType Directory -Path $privateDirectory -Force
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $privateDirectory 'github-access.json') -Encoding utf8
    Write-Output "Authenticated as $($account.login); write access verified for $repository."
    if (-not $Check) { Write-Output 'Credential saved in Windows Credential Manager.' }
    if ($pages) { Write-Output "Pages: $($pages.buildType), $($pages.sourceBranch)$($pages.sourcePath), $($pages.url)" }
    elseif ($pagesError) { Write-Output "Pages configuration could not be read: $pagesError" }
} catch {
    $failure = if ($_.Exception.Response) {
        "GitHub authentication/API request failed: HTTP $([int]$_.Exception.Response.StatusCode)."
    } else { $_.Exception.Message }
    Write-Error $failure -ErrorAction Continue
    exit 1
} finally {
    $tokenValue = $null
    $credentialResult = $null
    $passwordLine = $null
    $headers = $null
    if ($secureToken) { $secureToken.Dispose() }
}
