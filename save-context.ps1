$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

New-Item -ItemType Directory -Force -Path .chat-context | Out-Null

git status --short --branch | Set-Content .chat-context/git-status.txt
git log --oneline --decorate --graph --all | Set-Content .chat-context/git-history.txt
git remote -v | Set-Content .chat-context/git-remote.txt

Copy-Item README.md .chat-context/README.md -Force
Copy-Item prisma/schema.prisma .chat-context/schema.prisma -Force
Copy-Item src/lib/permissions.ts .chat-context/permissions.ts -Force
Copy-Item src/lib/classIdentifier.ts .chat-context/classIdentifier.ts -Force
Copy-Item src/lib/importCatechumens.ts .chat-context/importCatechumens.ts -Force

Get-ChildItem -Recurse -File src | Select-Object -ExpandProperty FullName | ForEach-Object { $_.Replace($root + '\', '') } | Sort-Object | Set-Content .chat-context/src-files.txt

$todoNotes = @()
Get-ChildItem -Recurse -File -Path . | Where-Object { $_.FullName -match '\.(md|ts|tsx|prisma)$' } | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -ErrorAction SilentlyContinue
    foreach ($line in $content) {
        if ($line -match 'TODO|FIXME|pendente|deve|falt|revisar|ainda') {
            $todoNotes += "$path`: $line"
        }
    }
}
$todoNotes | Set-Content .chat-context/todo-notes.txt

@'
--- CONTEXTO RESUMIDO ---
'@ | Set-Content .chat-context/contexto.txt
Get-Content RESUMO_PROJETO.md | Add-Content .chat-context/contexto.txt

Write-Host "Contexto salvo em .chat-context"
Get-ChildItem .chat-context | Select-Object Name
