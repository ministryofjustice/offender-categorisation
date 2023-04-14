import BaseSecurityPage from './base'

export default class SecurityHomePage extends BaseSecurityPage {
  static baseUrl: string = '/securityHome'

  constructor() {
    super('Categorisation referrals')
  }
}
