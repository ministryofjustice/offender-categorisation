import allocationManager from './allocationManager'
import auth from './auth'
import elite2 from './elite2'
import prisonerSearch from './prisonerSearch'
import riskProfiler from './riskProfiler'
import tokenVerification from './tokenVerification'
import dpsComponents from './dpsComponents'
import probationOffenderSearchApi from './probationOffenderSearchApi'
import formApi from './formApi'

export default {
  ...allocationManager,
  ...auth,
  ...elite2,
  ...prisonerSearch,
  ...riskProfiler,
  ...tokenVerification,
  ...dpsComponents,
  ...probationOffenderSearchApi,
  ...formApi,
}
