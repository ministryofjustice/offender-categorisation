import { User } from './user'

export const makeTestUser = (user: Partial<User> = {}): User => ({
  username: user.username ?? 'test-user',
})

export default makeTestUser
