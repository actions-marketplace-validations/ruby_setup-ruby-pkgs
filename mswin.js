'use strict';

const fs   = require('fs')
const core = require('@actions/core')

// , updateKeyRing
const { execSync, grpSt, grpEnd, getInput } = require('./common')

// group start time
let msSt

let mingw = getInput('mingw')  // only parsed for openssl
let mswin = getInput('mswin')
let choco = getInput('choco')
let vcpkg = getInput('vcpkg')

let ruby

export const setRuby = (_ruby) => { ruby = _ruby } // eslint-disable-line no-unused-vars

export const run = async () => {
  try {
    if (mswin !== '') {
      // await updateKeyRing('1~20210213-1')

      if (mingw.includes('ragel') && !mswin.includes('ragel')) {
        mswin += ' mingw-w64-ucrt-x86_64-ragel'
        mswin = mswin.trim()
      }
      msSt = grpSt(`install msys2 packages: ${mswin}`)
      execSync(`pacman.exe -Sy --noconfirm --noprogressbar --needed ${mswin}`)
      grpEnd(msSt)
    }

    if (choco !== '') {
      msSt = grpSt(`choco install ${choco}`)
      execSync(`choco install --no-progress ${choco}`)
      if (choco.includes('openssl')) {
        // fs.renameSync('C:\\Program Files\\OpenSSL-Win64', 'C:\\openssl-win')
        // core.exportVariable('SSL_DIR', '--with-openssl-dir=C:/openssl-win')
        core.exportVariable('SSL_DIR', '--with-openssl-dir="C:/Program Files/OpenSSL-Win64"')
      }
      grpEnd(msSt)
    }

    if (vcpkg !== '') {
      const vcpkgRoot = process.env.VCPKG_INSTALLATION_ROOT.replace(/\\/g, '/')

      // Update vcpkg
      const cwd = process.cwd()
      process.chdir(vcpkgRoot)
      execSync('git pull -q')
      execSync('bootstrap-vcpkg.bat')

      // install packages
      msSt = grpSt(`vcpkg --triplet x64-windows install ${vcpkg}`)
      execSync(`vcpkg --triplet x64-windows install ${vcpkg}`)

      // add vcpkg dll folder to path
      const vcpkgBin = `${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows\\bin`
      core.addPath(vcpkgBin)
      console.log(`Added to Path: ${vcpkgBin}`)

      core.exportVariable('OPT_DIR', `--with-opt-dir=${vcpkgRoot}/installed/x64-windows`)
      const vcpkgTools = `${process.env.VCPKG_INSTALLATION_ROOT}\\installed\\x64-windows\\tools`
      if (fs.existsSync(vcpkgTools) && fs.readdirSync(vcpkgTools).length >= 0) {
        core.addPath(vcpkgTools)
        console.log(`Added to Path: ${vcpkgTools}`)
      }
      process.chdir(cwd)
      grpEnd(msSt)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
