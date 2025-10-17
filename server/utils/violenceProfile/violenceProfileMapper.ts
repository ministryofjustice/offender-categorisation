import { ViperDto } from '../../data/formApi/viper/viper.dto'
import { CountOfAssaultIncidents } from '../../services/incidents/countOfAssaultIncidents'
import { RISK_TYPE_VIOLENCE, ViolenceProfile } from './violenceProfile'

export const mapDataToViolenceProfile = (
  viperData?: ViperDto,
  countOfAssaultIncidents?: CountOfAssaultIncidents,
): ViolenceProfile => ({
  notifySafetyCustodyLead: viperData?.aboveThreshold ?? false,
  numberOfAssaults: countOfAssaultIncidents?.countOfAssaults ?? 0,
  numberOfSeriousAssaults: countOfAssaultIncidents?.countOfSeriousAssaults ?? 0,
  numberOfNonSeriousAssaults: countOfAssaultIncidents?.countOfNonSeriousAssaults ?? 0,
  riskType: RISK_TYPE_VIOLENCE,
})
