const serviceCreator = require('../../server/services/offendersService')

const offenderNo = 'C3456RS'
const emptyResponse = { catAEndYear: null, catAStartYear: null, catAType: null, finalCat: null, releaseYear: null }
const nomisClient = {
  getCategoryHistory: jest.fn(),
  getSentenceHistory: jest.fn(),
}

const formService = {
  getCategorisationRecord: jest.fn(),
}

const nomisClientBuilder = () => nomisClient

const service = serviceCreator(nomisClientBuilder, formService)

afterEach(() => {
  nomisClient.getCategoryHistory.mockReset()
  nomisClient.getSentenceHistory.mockReset()
})

describe('getCatAInformation', () => {
  test('it should return previous Cat A and sentence information', async () => {
    const categories = [
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
      },
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -45, releaseDate: '2014-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -55, releaseDate: '2015-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: '2014',
      finalCat: 'Cat B',
    })
  })

  test('it should handle no previous', async () => {
    nomisClient.getCategoryHistory.mockReturnValue([])

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual(emptyResponse)
  })

  test('it should handle previous but no Cat A', async () => {
    const categories = [
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentCode: 'CATEGORY',
        assessmentDescription: 'Categorisation',
        cellSharingAlertFlag: false,
        assessmentDate: '2013-03-24',
        nextReviewDate: '2013-09-17',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual(emptyResponse)
  })

  test('it should handle Cat A not the first cat', async () => {
    const categories = [
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
      },
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2014-04-04',
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -45, releaseDate: '2015-02-03' },
      },
    ]
    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2014',
      catAEndYear: '2015',
      releaseYear: '2015',
      finalCat: 'Cat A',
    })
  })
  test('it should handle no sentence info', async () => {
    const categories = [
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
      },
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue([])

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: null,
      finalCat: 'Cat B',
    })
  })

  test('it should find correct Cat A and sentence information from a long list', async () => {
    const categories = [
      {
        bookingId: -35,
        offenderNo,
        classificationCode: 'C',
        classification: 'Cat C',
        assessmentDate: '2010-04-04',
      },
      {
        bookingId: -35,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2011-03-24',
      },
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
      },
      {
        bookingId: -45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
      },
      {
        bookingId: -55,
        offenderNo,
        classificationCode: 'D',
        classification: 'Cat D',
        assessmentDate: '2015-04-04',
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -35, releaseDate: '2011-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -45, releaseDate: '2014-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: -55, releaseDate: '2015-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo)
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: '2014',
      finalCat: 'Cat B',
    })
  })
})
