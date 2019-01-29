package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

class JwtFactory {
  static Algorithm ALGORITHM = Algorithm.HMAC256("secret")
  static ISSUER = "Paddy McGinty's Goat"

  static String token(username) {
    Date now = new Date()

    Date fiveMinutesLater = new Date(now.getTime() + (5 * 60 * 1000))

    JWT
      .create()
      .withIssuer(ISSUER)
      .withIssuedAt(now)
      .withExpiresAt(fiveMinutesLater)
      .withClaim("username", username)
      .sign ALGORITHM
  }
}
