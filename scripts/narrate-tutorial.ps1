$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$insignRoot = Split-Path $PSScriptRoot -Parent
$insignOutput = Join-Path $insignRoot 'media/tutorial/build'
New-Item -ItemType Directory -Path $insignOutput -Force | Out-Null
$insignChapters = Get-Content -LiteralPath (Join-Path $insignRoot 'media/tutorial/guion.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$insignVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$insignVoice.SelectVoice('Microsoft Sabina Desktop')
$insignVoice.Rate = 0
$insignVoice.Volume = 100
try {
    for ($insignIndex = 0; $insignIndex -lt $insignChapters.Count; $insignIndex++) {
        $insignAudioPath = Join-Path $insignOutput (('{0:D2}' -f $insignIndex) + '.wav')
        $insignVoice.SetOutputToWaveFile($insignAudioPath)
        $insignVoice.Speak($insignChapters[$insignIndex].speech)
        $insignVoice.SetOutputToNull()
        Write-Output ('Narración: ' + $insignChapters[$insignIndex].title)
    }
} finally {
    $insignVoice.Dispose()
}
