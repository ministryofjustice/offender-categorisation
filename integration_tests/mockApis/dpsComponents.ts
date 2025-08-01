import { Response } from 'superagent'
import { stubFor } from './wiremock'

const stubHeaderFail = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/components/header',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

const stubFooterFail = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/components/footer',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

const stubHeaderSuccess = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/components/header',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        html:
          '\n' +
          '    \n' +
          '<header class="connect-dps-common-header govuk-!-display-none-print" role="banner">\n' +
          '  <div class="connect-dps-common-header__container">\n' +
          '    <div class="connect-dps-common-header__title">\n' +
          '      <a class="connect-dps-common-header__link connect-dps-common-header__title__organisation-name" href="http://localhost:9091/dps">\n' +
          '        <svg role="presentation" focusable="false" class="connect-dps-common-header__logo" xmlns="http://www.w3.org/2000/svg" width="41" height="30" viewBox="0 0 41 30">\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.54677 9.20065C8.64351 9.65301 9.88802 9.13584 10.3347 8.05183C10.7839 6.97073 10.27 5.71374 9.17342 5.26352C8.09836 4.82212 6.84843 5.34938 6.40124 6.4349C5.95404 7.515 6.47121 8.76014 7.54677 9.20065Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.71865 12.0298C3.81564 12.4821 5.0599 11.965 5.50659 10.881C5.9558 9.79984 5.44191 8.54286 4.34529 8.09264C3.27023 7.65124 2.02031 8.17837 1.57311 9.26402C1.12592 10.3441 1.64308 11.5891 2.71865 12.0298Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M1.3065 17.397C2.4035 17.8494 3.648 17.3322 4.09469 16.2481C4.54391 15.1669 4.02977 13.91 2.9334 13.4599C1.85834 13.0183 0.608415 13.5457 0.160968 14.6311C-0.286227 15.7112 0.231192 16.9565 1.3065 17.397Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.9335 10.9018C14.0302 11.3542 15.2747 10.837 15.7214 9.75301C16.1706 8.6719 15.6568 7.41491 14.5601 6.96469C13.4851 6.52329 12.2351 7.05055 11.788 8.13607C11.3408 9.21617 11.8579 10.4613 12.9335 10.9018Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M32.4543 9.20065C31.3573 9.65301 30.1131 9.13584 29.6661 8.05183C29.2172 6.97073 29.7308 5.71374 30.8274 5.26352C31.9027 4.82212 33.1527 5.34938 33.5999 6.4349C34.0471 7.515 33.5299 8.76014 32.4543 9.20065Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M37.2805 12.0298C36.1833 12.4821 34.939 11.965 34.4923 10.881C34.0433 9.79984 34.557 8.54286 35.6536 8.09264C36.7289 7.65124 37.9788 8.17837 38.426 9.26402C38.8732 10.3441 38.3558 11.5891 37.2805 12.0298Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M38.6944 17.397C37.5977 17.8494 36.3532 17.3322 35.9065 16.2481C35.4573 15.1669 35.9712 13.91 37.0678 13.4599C38.1428 13.0183 39.3928 13.5457 39.84 14.6311C40.2874 15.7112 39.77 16.9565 38.6944 17.397Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M27.0657 10.9018C25.9687 11.3542 24.7244 10.837 24.2775 9.75301C23.8285 8.6719 24.3421 7.41491 25.4388 6.96469C26.5141 6.52329 27.764 7.05055 28.2112 8.13607C28.6584 9.21617 28.1412 10.4613 27.0657 10.9018Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.1246 5.39912L21.1311 5.39294L23.8259 6.80828V2.83635L21.1342 3.68851L21.1266 3.68044C21.0512 3.58147 20.9639 3.49284 20.8653 3.41656L20.858 3.40899L21.9407 0L19.9961 0.000252154L18.0507 0L19.1337 3.40899L19.1263 3.41656C19.0281 3.49284 18.9402 3.58147 18.8653 3.68044L18.8573 3.68851L16.166 2.83635V6.80828L18.8609 5.39294L18.8673 5.39912C18.9471 5.50351 19.0407 5.5963 19.1458 5.67498L17.5981 10.344C17.5962 10.3498 17.5942 10.3556 17.5925 10.3611L17.5908 10.366L17.5913 10.3666C17.5193 10.5997 17.4807 10.847 17.4807 11.1036C17.4807 12.3669 18.4127 13.4095 19.6264 13.5887C19.6445 13.5915 19.6621 13.5946 19.6804 13.5968C19.7838 13.61 19.8884 13.6188 19.9956 13.6188H19.9961H19.9964C20.1031 13.6188 20.2079 13.61 20.3116 13.5968C20.3295 13.5946 20.3472 13.5915 20.3655 13.5887C21.5788 13.4095 22.5112 12.3669 22.5112 11.1036C22.5112 10.847 22.4721 10.5997 22.4006 10.3666L22.4009 10.366L22.3994 10.3611C22.3975 10.3556 22.3955 10.3498 22.3935 10.344L20.8461 5.67498C20.951 5.5963 21.0448 5.50351 21.1246 5.39912Z"/>\n' +
          '          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9961 28.2469C25.1126 28.2469 29.9557 28.5936 34.2707 29.2111C35.4958 24.0612 36.9865 21.1103 38.5258 19.0092L35.6272 17.978C35.9156 19.4496 35.9616 20.1346 35.6388 21.0806C35.1608 20.6133 34.7078 19.7539 34.3542 18.4405L32.95 23.1175C33.8045 22.529 34.4635 22.1489 35.2174 22.1306C33.8799 25.0107 32.2103 25.7519 31.1284 25.552C29.8069 25.3094 29.1998 24.1313 29.4046 23.1324C29.7085 21.7159 31.1616 21.3468 31.8404 22.994C33.1384 20.3461 30.9362 19.5212 29.5189 20.3045C31.6957 18.1333 31.9448 16.2036 30.1877 13.8682C27.7395 15.7394 27.7109 17.5926 28.8127 20.1999C27.383 18.5638 25.1586 19.4422 25.9621 22.0859C26.9932 20.4897 28.3578 21.4937 28.1436 23.0095C27.9627 24.3308 26.2183 25.3978 24.0464 25.2087C20.9338 24.9265 20.7484 22.7785 20.6709 21.0011C21.4362 20.8593 22.814 21.5684 23.9887 23.2183L24.4217 18.2575C23.1434 19.5894 21.9821 19.8421 20.6921 19.8829C21.1215 18.5433 23.0951 16.3481 23.0951 16.3481L20.2276 16.3478H20.2261H20.2248L16.9033 16.3481C16.9033 16.3481 18.877 18.5433 19.3061 19.8829C18.0163 19.8421 16.8551 19.5894 15.5765 18.2575L16.0097 23.2183C17.1847 21.5684 18.5623 20.8593 19.3276 21.0011C19.2503 22.7785 19.0648 24.9265 15.9521 25.2087C13.7802 25.3978 12.036 24.3308 11.8548 23.0095C11.6406 21.4937 13.0053 20.4897 14.0365 22.0859C14.8401 19.4422 12.6152 18.5638 11.186 20.1999C12.2877 17.5926 12.2587 15.7394 9.81076 13.8682C8.0535 16.2036 8.3025 18.1333 10.4793 20.3045C9.06211 19.5212 6.86005 20.3461 8.15814 22.994C8.83681 21.3468 10.2902 21.7159 10.5941 23.1324C10.7989 24.1313 10.1911 25.3094 8.87035 25.552C7.78836 25.7519 6.11859 25.0107 4.78117 22.1306C5.53523 22.1489 6.19361 22.529 7.04866 23.1175L5.64454 18.4405C5.29039 19.7539 4.8379 20.6133 4.35969 21.0806C4.03656 20.1346 4.08283 19.4496 4.37091 17.978L1.47266 19.0092C3.01218 21.11 4.50241 24.0607 5.72725 29.21C10.041 28.5931 14.8817 28.2469 19.9961 28.2469Z"/>\n' +
          '        </svg>\n' +
          '\n' +
          '        Digital Prison Services\n' +
          '      </a>\n' +
          '\n' +
          '      \n' +
          '        <div class="govuk-phase-banner">\n' +
          '          <strong class="govuk-tag">\n' +
          '  CYPRESS TESTING\n' +
          '</strong>\n' +
          '\n' +
          '        </div>\n' +
          '      \n' +
          '    </div>\n' +
          '\n' +
          '    <nav aria-label="Account navigation">\n' +
          '      <ul class="connect-dps-common-header__navigation">\n' +
          '        \n' +
          '          <li class="connect-dps-common-header__navigation__item">\n' +
          '            <img class="connect-dps-common-header__link__icon govuk-!-padding-right-3" src="https://frontend-components-dev.hmpps.service.justice.gov.uk/assets/images/location.svg" aria-hidden="true" alt="" />\n' +
          '            <a data-qa="changeCaseLoad" class="connect-dps-common-header__link" href="http://localhost:9091/dps/change-caseload" data-test="change-case-load-link" referrerpolicy="no-referrer-when-downgrade">\n' +
          '              <span data-qa=header-active-case-load>Hewell (HMP)</span>\n' +
          '            </a>\n' +
          '          </li>\n' +
          '        \n' +
          '\n' +
          '        \n' +
          '          <li class="connect-dps-common-header__navigation__item">\n' +
          '            <a data-qa="manageDetails" class="connect-dps-common-header__link" href="http://localhost:9091/auth/account-details" data-test="manage-account-link" referrerpolicy="no-referrer-when-downgrade">\n' +
          '              <span data-qa=header-user-name>T. Testfield</span>\n' +
          '              <span class="connect-dps-common-header__link__sub-text">Manage your details</span>\n' +
          '            </a>\n' +
          '          </li>\n' +
          '        \n' +
          '\n' +
          '        <li class="connect-dps-common-header__navigation__item">\n' +
          '          <a data-qa="signOut" class="connect-dps-common-header__link" href="/sign-out">Sign out</a>\n' +
          '        </li>\n' +
          '      </ul>\n' +
          '    </nav>\n' +
          '  </div>\n' +
          '</header>\n' +
          '\n',
        css: ['https://frontend-components-dev.hmpps.service.justice.gov.uk/assets/stylesheets/header.css'],
        javascript: [],
      },
    },
  })

const stubFooterSuccess = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/components/footer',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        html:
          '\n' +
          '    <footer class="connect-dps-common-footer govuk-!-display-none-print" role="contentinfo">\n' +
          '    <div class="govuk-width-container ">\n' +
          '        <div class="connect-dps-common-footer__info">\n' +
          '            <div class="connect-dps-common-footer__help">\n' +
          '                <h2>Get help with DPS</h2>\n' +
          '                <p>Call 0800 917 5148 or #6598 from inside an establishment.</p>\n' +
          '            </div>\n' +
          '        </div>\n' +
          '        <div class="connect-dps-common-footer__support-links">\n' +
          '            <h2 class="govuk-visually-hidden">Support links</h2>\n' +
          '\n' +
          '            <ul class="connect-dps-common-footer__inline-list">\n' +
          '                <li class="connect-dps-common-footer__inline-list-item">\n' +
          `                    <a class="connect-dps-common-footer__link" href="https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]" target='_blank' referrerpolicy='no-referrer' rel='noopener'>\n` +
          '                        Feedback\n' +
          '                    </a>\n' +
          '                </li>\n' +
          '\n' +
          '                \n' +
          '                    <li class="connect-dps-common-footer__inline-list-item">\n' +
          '                        <a class="connect-dps-common-footer__link" href="http://localhost:9091/dps/accessibility-statement">\n' +
          '                            Accessibility statement\n' +
          '                        </a>\n' +
          '                    </li>\n' +
          '                \n' +
          '                    <li class="connect-dps-common-footer__inline-list-item">\n' +
          '                        <a class="connect-dps-common-footer__link" href="http://localhost:9091/dps/terms-and-conditions">\n' +
          '                            Terms and conditions\n' +
          '                        </a>\n' +
          '                    </li>\n' +
          '                \n' +
          '                    <li class="connect-dps-common-footer__inline-list-item">\n' +
          '                        <a class="connect-dps-common-footer__link" href="http://localhost:9091/dps/privacy-policy">\n' +
          '                            Privacy policy\n' +
          '                        </a>\n' +
          '                    </li>\n' +
          '                \n' +
          '                    <li class="connect-dps-common-footer__inline-list-item">\n' +
          '                        <a class="connect-dps-common-footer__link" href="http://localhost:9091/dps/cookies-policy">\n' +
          '                            Cookies policy\n' +
          '                        </a>\n' +
          '                    </li>\n' +
          '                \n' +
          '            </ul>\n' +
          '        </div>\n' +
          '    </div>\n' +
          '</footer>\n' +
          '\n',
        css: ['https://frontend-components-dev.hmpps.service.justice.gov.uk/assets/stylesheets/footer.css'],
        javascript: [],
      },
    },
  })

export default {
  stubDpsComponentsFail: (): Promise<[Response, Response]> => Promise.all([stubHeaderFail(), stubFooterFail()]),
  stubDpsComponentsSuccess: (): Promise<[Response, Response]> =>
    Promise.all([stubHeaderSuccess(), stubFooterSuccess()]),
}
