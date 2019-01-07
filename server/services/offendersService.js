const logger = require('../../log.js');
const {isNilOrEmpty} = require('../utils/functionalHelpers');

module.exports = function createOffendersService(custodyClientBuilder) {
    async function getOffendersInPrison(user, agencyId) {
        try {

            const custodyClient = custodyClientBuilder(user.username);
            const offenders = await custodyClient.getOffendersInPrison(agencyId);

            if (isNilOrEmpty(offenders)) {
                logger.info('No available offenders');
                return [];
            }

            return offenders;

        } catch (error) {
            logger.error('Error during getOffendersInPrison: ', error.stack);
            throw error;
        }
    }

    return {getOffendersInPrison};
};

