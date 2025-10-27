@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem
@rem SPDX-License-Identifier: Apache-2.0
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@rem This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:execute
@rem Setup the command line

set "WRAPPER_VERSION=8.13.0"
set "WRAPPER_SHA256=81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f"
set "REPO_WRAPPER_JAR=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar"
set "WRAPPER_CACHE_ROOT=%GRADLE_USER_HOME%"
if "%WRAPPER_CACHE_ROOT%"=="" set "WRAPPER_CACHE_ROOT=%USERPROFILE%\.gradle"
set "WRAPPER_CACHE_DIR=%WRAPPER_CACHE_ROOT%\wrapper\dists\gradle-wrapper\%WRAPPER_VERSION%"
set "CACHED_WRAPPER_JAR=%WRAPPER_CACHE_DIR%\gradle-wrapper.jar"

call :validateWrapper "%REPO_WRAPPER_JAR%"
if errorlevel 1 (
    if exist "%REPO_WRAPPER_JAR%" (
        echo WARNING: Ignoring unexpected Gradle wrapper at "%REPO_WRAPPER_JAR%". 1>&2
    )
) else (
    call :validateWrapper "%CACHED_WRAPPER_JAR%"
    if errorlevel 1 (
        if not exist "%WRAPPER_CACHE_DIR%" mkdir "%WRAPPER_CACHE_DIR%" >NUL 2>&1
        copy /Y "%REPO_WRAPPER_JAR%" "%CACHED_WRAPPER_JAR%" >NUL 2>&1
        if errorlevel 1 (
            echo WARNING: Unable to prime cached Gradle wrapper from "%REPO_WRAPPER_JAR%". 1>&2
            del /Q "%CACHED_WRAPPER_JAR%" >NUL 2>&1
        )
    )
)

set "WRAPPER_JAR=%CACHED_WRAPPER_JAR%"

call :validateWrapper "%WRAPPER_JAR%"
if errorlevel 1 (
    if exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try {$ErrorActionPreference='Stop';$urls=@('https://downloads.gradle.org/distributions/gradle-8.13.0-wrapper.jar','https://services.gradle.org/distributions/gradle-8.13.0-wrapper.jar','https://downloads.gradle.org/distributions/gradle-8.13-wrapper.jar','https://services.gradle.org/distributions/gradle-8.13-wrapper.jar','https://raw.githubusercontent.com/gradle/gradle/v8.13.0/gradle/wrapper/gradle-wrapper.jar');$sha256='%WRAPPER_SHA256%';$cacheDir='%WRAPPER_CACHE_DIR%';$target='%CACHED_WRAPPER_JAR%';$tmp=[System.IO.Path]::GetTempFileName();$downloaded=$false;foreach($url in $urls){try{Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing;$downloaded=$true;break;}catch{}}if(-not $downloaded){throw 'Unable to download Gradle wrapper jar from known sources.';}if((Get-FileHash -LiteralPath $tmp -Algorithm SHA256).Hash.ToLower() -ne $sha256){throw 'Checksum mismatch while downloading Gradle wrapper.';}if(-not (Test-Path -LiteralPath $cacheDir)){New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null;}Move-Item -Force -LiteralPath $tmp -Destination $target;} catch {Write-Error $_; exit 1;} finally {if(Test-Path -LiteralPath $tmp){Remove-Item -Force $tmp}}" || goto downloadWrapperFailed
    ) else (
        echo ERROR: Gradle wrapper JAR is missing and PowerShell is unavailable to download it. 1>&2
        goto fail
    )
)

call :validateWrapper "%WRAPPER_JAR%"
if errorlevel 1 goto downloadWrapperFailed
set CLASSPATH=%WRAPPER_JAR%

if /I "%WRAPPER_JAR%"=="%CACHED_WRAPPER_JAR%" (
    if exist "%APP_HOME%\gradle\wrapper\gradle-wrapper.properties" (
        if not exist "%WRAPPER_CACHE_DIR%" mkdir "%WRAPPER_CACHE_DIR%" >NUL 2>&1
        copy /Y "%APP_HOME%\gradle\wrapper\gradle-wrapper.properties" "%WRAPPER_CACHE_DIR%\gradle-wrapper.properties" >NUL 2>&1
    )
)

goto executeGradle

:validateWrapper
setlocal EnableDelayedExpansion
set "FILE=%~1"
if not exist "!FILE!" (
    endlocal & exit /b 1
)
set "WRAPPER_VALID="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "try {$path = [System.IO.Path]::GetFullPath(\"!FILE!\"); if(-not (Test-Path -LiteralPath $path)){Write-Output 'False'; exit 0} $stream = [System.IO.File]::OpenRead($path); try {$buffer = New-Object byte[] 4; $read = $stream.Read($buffer,0,4);} finally {$stream.Dispose()} if($read -ne 4 -or $buffer[0] -ne 0x50 -or $buffer[1] -ne 0x4b -or $buffer[2] -ne 0x03 -or $buffer[3] -ne 0x04){Write-Output 'False'; exit 0} $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); if($hash -eq '%WRAPPER_SHA256%'){Write-Output 'True'} else {Write-Output 'False'}} catch {Write-Output 'False'}"`) do set "WRAPPER_VALID=%%I"
if /I "!WRAPPER_VALID!"=="True" (
    endlocal & exit /b 0
) else (
    endlocal & exit /b 1
)

:downloadWrapperFailed
echo ERROR: Failed to provision the Gradle wrapper JAR. 1>&2
goto fail

:executeGradle


@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%GRADLE_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
