import allocationManager from './allocationManager'
import auth from './auth'
import elite2 from './elite2'
import prisonerSearch from './prisonerSearch'
import riskProfiler from './riskProfiler'
import tokenVerification from './tokenVerification'
import dpsComponents from './dpsComponents'

export default {
  ...allocationManager,
  ...auth,
  ...elite2,
  ...prisonerSearch,
  ...riskProfiler,
  ...tokenVerification,
  ...dpsComponents,
}
