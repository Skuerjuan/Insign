param([int]$Rate = 0)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$insignRoot = Split-Path $PSScriptRoot -Parent
$insignOutput = Join-Path $insignRoot 'media/tutorial/build/recorrido'
New-Item -ItemType Directory -Path $insignOutput -Force | Out-Null
$insignGuide = Get-Content -LiteralPath (Join-Path $insignRoot 'media/tutorial/guion-recorrido.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$insignVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$insignVoice.SelectVoice('Microsoft Sabina Desktop')
$insignVoice.Rate = $Rate
$insignVoice.Volume = 100
try {
    for ($insignIndex = 0; $insignIndex -lt $insignGuide.chapters.Count; $insignIndex++) {
        $insignAudioPath = Join-Path $insignOutput (('{0:D2}' -f $insignIndex) + '.wav')
        $insignVoice.SetOutputToWaveFile($insignAudioPath)
        $insignVoice.Speak($insignGuide.chapters[$insignIndex].speech)
        $insignVoice.SetOutputToNull()
        Write-Output ('Audio: ' + $insignGuide.chapters[$insignIndex].section)
    }
} finally { $insignVoice.Dispose() }
