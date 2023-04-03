import auth from './auth'
import riskProfiler from './riskProfiler'
import tokenVerification from './tokenVerification'

export default {
  ...auth,
  ...riskProfiler,
  ...tokenVerification,
}
