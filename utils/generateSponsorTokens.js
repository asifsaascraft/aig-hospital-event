// utils/generateSponsorTokens.js

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import Sponsor from '../models/Sponsor.js'

// =======================
// Generate Sponsor JWT Tokens
// =======================
export const generateSponsorTokens = (sponsorId, eventId) => {
  const accessToken = jwt.sign(
    {
      id: sponsorId,
      role: 'sponsor',
      eventId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '15m',
    },
  )

  const refreshToken = jwt.sign(
    {
      id: sponsorId,
      role: 'sponsor',
      eventId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    },
  )

  return {
    accessToken,
    refreshToken,
  }
}

// =======================
// Generate Sponsor Login Token
// =======================
//
// Requirements:
// - Exactly 16 characters
// - Contains uppercase letters
// - Contains numbers
// - Contains special characters
// - Cryptographically secure randomness
// - Unique across all Sponsor accounts
// =======================
export const generateSponsorLoginToken = async () => {
  const uppercaseCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  const numberCharacters = '0123456789'

  const specialCharacters = '!@#$%^&*'

  const allCharacters =
    uppercaseCharacters + numberCharacters + specialCharacters

  const getRandomCharacter = (characters) => {
    const randomIndex = crypto.randomInt(0, characters.length)

    return characters[randomIndex]
  }

  const shuffleCharacters = (characters) => {
    const charactersArray = characters.split('')

    for (let index = charactersArray.length - 1; index > 0; index--) {
      const randomIndex = crypto.randomInt(0, index + 1)

      ;[charactersArray[index], charactersArray[randomIndex]] = [
        charactersArray[randomIndex],
        charactersArray[index],
      ]
    }

    return charactersArray.join('')
  }

  while (true) {
    // Guarantee at least:
    // 1 uppercase character
    // 1 number
    // 1 special character
    const tokenCharacters = [
      getRandomCharacter(uppercaseCharacters),
      getRandomCharacter(numberCharacters),
      getRandomCharacter(specialCharacters),
    ]

    // Fill remaining 13 characters randomly
    while (tokenCharacters.length < 16) {
      tokenCharacters.push(getRandomCharacter(allCharacters))
    }

    // Shuffle so the required characters are
    // not always in predictable positions.
    const loginToken = shuffleCharacters(tokenCharacters.join(''))

    // Make absolutely sure the generated token
    // is not already assigned to another Sponsor.
    const existingSponsor = await Sponsor.findOne({
      loginToken,
    }).select('_id')

    if (!existingSponsor) {
      return loginToken
    }
  }
}
