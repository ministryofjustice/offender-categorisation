import { CATEGORISER_USER } from '../factory/user'

describe('Subject Access Request', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  it('should require that the user is logged in', () => {
    cy.request({
      url: '/subject-access-request',
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.eq(401)
    })
  })

  describe('Unauthorised user', () => {
    it.only('Token is missing the required role', () => {
      const user = CATEGORISER_USER
      cy.stubLogin({ user })
      cy.task('stubJwksResponse')

      // get this token from the output of a call to `http://0.0.0.0:3331/.well-known/jwks.json`
      // this would need a proper implementation if pursuing this approach
      const token =
        'eyJ0eXAiOiJqd3QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImVtdjFHSUtZelk3cTJyQndHNmpJbUx2OUliOWRKQTNjd29Kb0FSRTdkc00ifQ.eyJ1c2VyX25hbWUiOiJUSU1NWSIsInNjb3BlIjpbInJlYWQiXSwiYXV0aF9zb3VyY2UiOiJub21pcyIsImF1dGhvcml0aWVzIjpbIlNPTUUiLCJST0xFUyJdLCJqdGkiOiI4M2I1MGExMC1jY2E2LTQxZGItOTg1Zi1lODdlZmIzMDNkZGIiLCJjbGllbnRfaWQiOiJjbGllbnRpZCIsImlzc3VlciI6Imh0dHA6Ly8wLjAuMC4wOjMzMzEvY2hyaXMiLCJzdWIiOiJjaHJpcyJ9.QWBZZiE4CB25TdW-bCuY7GlTcXS3oQx4c80QP_KAGF13kYqiOUFMCnFT31Z07NhtqPjlIwv2RYYC0qCtek9xBcAg0Xut2APMr8l0riqrk6FpHCzb1RzP63LTpc5L4NuFsaQRwnsqJJqnxtXs1V4Q5p_t8xSSAdsnfQl-28vy2eNeLV_f6Vb79TmYoLhwzH7YOT2tGaQ-gGfckf5L7gycmIhyksiQ_HDzQ0gDNdw456j10HYERpzCjbdeHGOPI71PWWVj_LGmIwAOZKd9w8FHiaZNUbpidvEzgMc_3D68h53536cjAnZQfARvok3PcYn8ME9BJ3Kvv8uguNh5LueHIg'

      cy.request({
        url: '/subject-access-request',
        headers: {
          authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      }).then(resp => {
        cy.log('sdgsdfg')
        expect(resp.status).to.eq(403)
      })
    })
  })
})
