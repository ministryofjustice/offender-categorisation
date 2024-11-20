import { UserDto } from './user.dto'

export const makeTestUserDto = (userDto: Partial<UserDto>): UserDto => ({
  activeCaseLoad: {
    caseLoadId: userDto.activeCaseLoad.caseLoadId ?? 'TEST',
  },
})

export default makeTestUserDto
