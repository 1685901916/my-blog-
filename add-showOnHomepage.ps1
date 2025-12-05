# 批量为 portfolio 文件添加 showOnHomepage 字段

$files = Get-ChildItem "src/content/portfolio" -Recurse -Filter "*.md"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # 检查是否已经有 showOnHomepage 字段
    if ($content -notmatch 'showOnHomepage:') {
        # 在 draft: false 后面添加 showOnHomepage: true
        $content = $content -replace '(draft:\s*false)', "`$1`nshowOnHomepage: true"
        
        # 保存文件
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    } else {
        Write-Host "Skipped (already has field): $($file.Name)"
    }
}

Write-Host "`nDone! Updated all portfolio files."

