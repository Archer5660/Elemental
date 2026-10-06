!macro customInit
  ; Ask the app and its child processes to exit before files are replaced.
  nsExec::ExecToStack 'cmd.exe /c "taskkill /F /T /IM Elemental.exe"'
  Pop $R0

  StrCpy $R1 0
  ${DoUntil} $R1 >= 40
    ${nsProcess::FindProcess} "Elemental.exe" $R0
    ${If} $R0 != 0
      ${Break}
    ${EndIf}
    Sleep 250
    IntOp $R1 $R1 + 1
  ${Loop}

  ; A stuck process must not block an upgrade indefinitely.
  ${nsProcess::FindProcess} "Elemental.exe" $R0
  ${If} $R0 == 0
    ${nsProcess::KillProcess} "Elemental.exe" $R0
    Sleep 500
  ${EndIf}
!macroend

!macro customUnInit
  !insertmacro customInit
!macroend
