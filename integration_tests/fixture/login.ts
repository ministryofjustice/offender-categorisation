import { UserAccount } from '../factory/user'
import elite2Api from '../mockApis/elite2'

export default {
  stubLogin: (user: UserAccount) => {
    console.log('stubLogin', user)
    // oauthApi.resetRequests()
    // currentUser = user
    // elite2Api.stubHealth()
    // oauthApi.stubValidOAuthTokenRequest currentUser
    elite2Api.stubGetMyDetails({ user, caseloadId: user.workingCaseload.id })
    elite2Api.stubGetMyCaseloads({ caseloads: user.caseloads })
    // allocationApi.stubGetPomByOffenderNo()
  },
}
