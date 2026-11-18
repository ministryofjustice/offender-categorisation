import { ManageUsersApiClientBuilder } from 'server/data/manageUsersApi/manageUsersApiClient'
import logger from '../../log'
import { setFemaleCaseLoads } from '../utils/utils'

interface Context {
  user: {
    token: string
  }
}

export default function createUserService(manageUsersApiClientBuilder: ManageUsersApiClientBuilder) {
  const getUser = async (context: Context) => {
    try {
      const manageUsersApiClient = manageUsersApiClientBuilder(context.user.token)
      const [user, activeCaseloads] = await Promise.all([
        manageUsersApiClient.getUser(),
        manageUsersApiClient.getUserCaseload(),
      ])
      const decoratedActiveCaseloads = setFemaleCaseLoads(
        activeCaseloads.caseloads.map(caseload => ({
          caseLoadId: caseload.id,
          description: caseload.name,
          caseloadFunction: caseload.function,
        })),
      )

      const activeCaseLoadId = activeCaseloads.activeCaseload?.id

      const activeCaseload = decoratedActiveCaseloads.find(
        (caseload: { caseLoadId: string }) => caseload.caseLoadId === activeCaseLoadId,
      )
      return {
        ...user,
        displayName: user.name,
        displayNameAlternative: user.name,
        activeCaseLoad: activeCaseload,
        activeCaseLoadId,
        activeCaseLoads: decoratedActiveCaseloads,
      }
    } catch (error) {
      logger.error('Error during getUserByUserId:', error instanceof Error ? error.stack : error)
      throw error
    }
  }

  const getUserByUserId = async (context: Context, username: string) => {
    try {
      const manageUsersApiClient = manageUsersApiClientBuilder(context.user.token)
      const user = await manageUsersApiClient.getUserByUsername(username)

      return {
        ...user,
        displayName: user.name,
        displayNameAlternative: user.name,
      }
    } catch (error) {
      logger.error('Error during getUserByUserId:', error instanceof Error ? error.stack : error)
      throw error
    }
  }

  return {
    getUser,
    getUserByUserId,
  }
}
